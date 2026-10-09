"""Middleware for every request: request log, security headers, global rate limit.

The request log is one JSON line per request with only metadata. It never records bodies, query
strings, cookies or headers, and the token in shared-page paths (/s/<token>) is masked.
"""

import json
import logging
import re
import sys
import time
import uuid
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime
from typing import Any

from fastapi import Request, Response, status
from fastapi.responses import JSONResponse

from app.auth import rate_limit
from app.config import get_settings

Handler = Callable[[Request], Awaitable[Response]]

log = logging.getLogger("app.requests")

_SHARE_TOKEN = re.compile(r"^/s/[^/]+")
_VALID_REQUEST_ID = re.compile(r"^[A-Za-z0-9._-]{8,64}$")

# Our own pages load only our own files. Mantine sets inline styles, logos may be data:/blob: URLs.
APP_CSP = (
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
    "img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; "
    "base-uri 'self'; form-action 'self'; object-src 'none'"
)
_SECURITY_HEADERS = {
    "Content-Security-Policy": APP_CSP,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Cross-Origin-Opener-Policy": "same-origin",
}
_HSTS = "max-age=31536000; includeSubDomains"


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        entry: dict[str, Any] = {
            "time": datetime.fromtimestamp(record.created, UTC).isoformat(timespec="milliseconds"),
            "level": record.levelname.lower(),
            "logger": record.name,
            "message": record.getMessage(),
        }
        entry.update(getattr(record, "fields", {}))
        if record.exc_info:
            entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(entry, ensure_ascii=False)


def configure_logging() -> None:
    """JSON lines on stdout for the app's loggers; idempotent."""
    logger = logging.getLogger("app")
    if any(isinstance(h.formatter, JsonFormatter) for h in logger.handlers):
        return
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    logger.propagate = False


def loggable_path(path: str) -> str:
    return _SHARE_TOKEN.sub("/s/[token]", path)


def client_ip(request: Request) -> str:
    # Behind the reverse proxy, Uvicorn's --proxy-headers puts the visitor's address here.
    return request.client.host if request.client else "unknown"


async def request_log_middleware(request: Request, call_next: Handler) -> Response:
    incoming = request.headers.get("X-Request-ID", "")
    request_id = incoming if _VALID_REQUEST_ID.match(incoming) else uuid.uuid4().hex
    request.state.request_id = request_id
    started = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        log.exception(
            "unhandled error",
            extra={"fields": {"request_id": request_id, "path": loggable_path(request.url.path)}},
        )
        response = JSONResponse(
            {"detail": f"Errore interno. Se si ripete, comunica questo codice: {request_id}"},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    response.headers["X-Request-ID"] = request_id
    log.info(
        "request",
        extra={
            "fields": {
                "request_id": request_id,
                "method": request.method,
                "path": loggable_path(request.url.path),
                "status": response.status_code,
                "duration_ms": round((time.perf_counter() - started) * 1000, 1),
                "user_id": getattr(request.state, "user_id", None),
            }
        },
    )
    return response


async def security_headers_middleware(request: Request, call_next: Handler) -> Response:
    response = await call_next(request)
    for name, value in _SECURITY_HEADERS.items():
        # Shared pages and logos set a stricter policy of their own: keep it.
        response.headers.setdefault(name, value)
    if get_settings().env == "production":
        response.headers.setdefault("Strict-Transport-Security", _HSTS)
    return response


async def global_rate_limit_middleware(request: Request, call_next: Handler) -> Response:
    path = request.url.path
    if path.startswith("/api/") and path != "/api/health":
        key = client_ip(request)
        if rate_limit.api_requests.is_limited(key):
            return JSONResponse(
                {"detail": "Troppe richieste: riprova tra un minuto."},
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                headers={"Retry-After": "60"},
            )
        rate_limit.api_requests.hit(key)
    return await call_next(request)
