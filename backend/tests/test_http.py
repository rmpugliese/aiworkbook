import json
import logging
from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy.orm import Session, sessionmaker

from app import http
from app.auth import rate_limit
from app.config import Settings
from app.http import JsonFormatter, loggable_path
from tests.conftest import new_client


class Records(logging.Handler):
    def __init__(self) -> None:
        super().__init__()
        self.lines: list[dict[str, object]] = []

    def emit(self, record: logging.LogRecord) -> None:
        self.lines.append(json.loads(JsonFormatter().format(record)))


@pytest.fixture
def request_log() -> Iterator[Records]:
    records = Records()
    logger = logging.getLogger("app.requests")
    logger.addHandler(records)
    yield records
    logger.removeHandler(records)


# Security headers


def test_security_headers_on_api_responses(anon_client: TestClient) -> None:
    headers = anon_client.get("/api/health").headers
    assert "default-src 'self'" in headers["content-security-policy"]
    assert "frame-ancestors 'none'" in headers["content-security-policy"]
    assert headers["x-content-type-options"] == "nosniff"
    assert headers["x-frame-options"] == "DENY"
    assert headers["referrer-policy"] == "strict-origin-when-cross-origin"
    assert "camera=()" in headers["permissions-policy"]
    assert "strict-transport-security" not in headers  # development: plain http


def test_hsts_only_in_production(anon_client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    class Production:
        env = "production"

    monkeypatch.setattr(http, "get_settings", lambda: Production())
    headers = anon_client.get("/api/health").headers
    assert headers["strict-transport-security"].startswith("max-age=31536000")


def test_shared_pages_keep_their_stricter_policy(anon_client: TestClient) -> None:
    csp = anon_client.get("/s/qualcosa").headers["content-security-policy"]
    assert csp.startswith("default-src 'none'")


# Rate limit


def test_global_rate_limit_per_ip(anon_client: TestClient) -> None:
    for _ in range(rate_limit.api_requests.limit):
        anon_client.get("/api/auth/providers")
    response = anon_client.get("/api/auth/providers")
    assert response.status_code == 429
    assert response.headers["retry-after"] == "60"
    assert anon_client.get("/api/health").status_code == 200  # monitoring is never limited


# Request log


def test_one_json_line_per_request_without_sensitive_data(
    client: TestClient, request_log: Records
) -> None:
    client.post("/api/projects", json={"name": "Segretissimo", "client_name": "ACME"})
    line = request_log.lines[-1]
    assert line["message"] == "request"
    assert line["method"] == "POST"
    assert line["path"] == "/api/projects"
    assert line["status"] == 201
    assert isinstance(line["duration_ms"], float)
    assert isinstance(line["user_id"], int)
    assert len(str(line["request_id"])) >= 8
    text = json.dumps(request_log.lines)
    assert "Segretissimo" not in text and "ACME" not in text
    assert "una-password-lunga" not in text  # the sign-in in the fixture is logged too


def test_share_tokens_are_masked_in_the_log(anon_client: TestClient, request_log: Records) -> None:
    anon_client.get("/s/token-segreto-1234567890/pdf?x=1")
    assert request_log.lines[-1]["path"] == "/s/[token]/pdf"
    assert "token-segreto" not in json.dumps(request_log.lines)
    assert loggable_path("/s/abc") == "/s/[token]"
    assert loggable_path("/api/projects/1") == "/api/projects/1"


def test_request_id_header(anon_client: TestClient) -> None:
    generated = anon_client.get("/api/health").headers["x-request-id"]
    assert len(generated) == 32
    echoed = anon_client.get("/api/health", headers={"X-Request-ID": "abc-12345678"})
    assert echoed.headers["x-request-id"] == "abc-12345678"
    unsafe = anon_client.get("/api/health", headers={"X-Request-ID": "<script>"})
    assert unsafe.headers["x-request-id"] != "<script>"


def test_unhandled_errors_return_a_generic_500(
    sessions: sessionmaker[Session], request_log: Records
) -> None:
    client = new_client(sessions)

    @client.app.get("/api/boom")  # type: ignore[attr-defined, untyped-decorator]
    def boom() -> None:
        raise RuntimeError("dettaglio interno")

    with TestClient(client.app, raise_server_exceptions=False) as raw:
        response = raw.get("/api/boom")
    assert response.status_code == 500
    request_id = response.headers["x-request-id"]
    assert request_id in response.json()["detail"]
    assert "dettaglio interno" not in response.text
    error = next(line for line in request_log.lines if line["message"] == "unhandled error")
    assert error["request_id"] == request_id
    assert "RuntimeError: dettaglio interno" in str(error["exception"])


# Production configuration


PRODUCTION = {
    "env": "production",
    "secret_key": "x" * 40,
    "public_url": "https://workbook.example.com",
    "database_url": "postgresql+psycopg://db/app",
    "email_backend": "smtp",
}


def test_complete_production_configuration() -> None:
    assert Settings(**PRODUCTION).secure_cookies is True  # type: ignore[arg-type]


@pytest.mark.parametrize(
    ("override", "message"),
    [
        ({"secret_key": "dev-only-secret-key-change-me"}, "APP_SECRET_KEY"),
        ({"secret_key": "corta"}, "APP_SECRET_KEY"),
        ({"public_url": "http://workbook.example.com"}, "APP_PUBLIC_URL"),
        ({"database_url": "sqlite:///./prod.db"}, "APP_DATABASE_URL"),
        ({"email_backend": "console"}, "APP_EMAIL_BACKEND"),
    ],
)
def test_incomplete_production_configuration(override: dict[str, str], message: str) -> None:
    with pytest.raises(ValidationError, match=message):
        Settings(**{**PRODUCTION, **override})  # type: ignore[arg-type]


# The frontend build served by the backend


@pytest.fixture
def spa_client(
    tmp_path: Path, sessions: sessionmaker[Session], monkeypatch: pytest.MonkeyPatch
) -> Iterator[TestClient]:
    (tmp_path / "assets").mkdir()
    (tmp_path / "index.html").write_text("<!doctype html><div id=root></div>")
    (tmp_path / "assets" / "app-1234.js").write_text("console.log(1)")
    (tmp_path / "favicon.svg").write_text("<svg/>")
    monkeypatch.setenv("APP_FRONTEND_DIST", str(tmp_path))
    from app.config import get_settings

    get_settings.cache_clear()
    try:
        with new_client(sessions) as client:
            yield client
    finally:
        monkeypatch.delenv("APP_FRONTEND_DIST")
        get_settings.cache_clear()


def test_spa_files_and_fallback(spa_client: TestClient) -> None:
    asset = spa_client.get("/assets/app-1234.js")
    assert asset.status_code == 200
    assert "immutable" in asset.headers["cache-control"]
    assert spa_client.get("/favicon.svg").text == "<svg/>"
    for path in ("/", "/projects/3/iterations/4", "/profile"):
        page = spa_client.get(path)
        assert page.status_code == 200
        assert "id=root" in page.text
        assert page.headers["cache-control"] == "no-cache"


def test_spa_does_not_swallow_the_api_or_shared_pages(spa_client: TestClient) -> None:
    assert spa_client.get("/api/health").json()["status"] == "ok"
    missing_api = spa_client.get("/api/does-not-exist")
    assert missing_api.status_code == 404
    assert "id=root" not in missing_api.text
    assert "Link non valido" in spa_client.get("/s/sconosciuto").text


def test_spa_never_serves_files_outside_the_build(spa_client: TestClient) -> None:
    response = spa_client.get("/..%2F..%2Fetc%2Fpasswd")
    assert response.status_code == 200
    assert "id=root" in response.text  # the fallback page, not the file
