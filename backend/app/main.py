from importlib.metadata import version
from pathlib import Path

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware

from app.auth.web import csrf_middleware
from app.config import get_settings
from app.email import EmailDeliveryError
from app.http import (
    configure_logging,
    global_rate_limit_middleware,
    request_log_middleware,
    security_headers_middleware,
)
from app.routers import (
    admin,
    ai,
    auth,
    feedback,
    health,
    members,
    projects,
    shares,
    site,
    template,
)
from app.spa import mount_frontend
from app.workbook.loader import validate_all_templates


def create_app() -> FastAPI:
    # Refuse to start with a broken workbook template.
    validate_all_templates()
    settings = get_settings()

    configure_logging()
    production = settings.env == "production"

    app = FastAPI(
        title="AI Project Workbook API",
        version=version("app"),
        # The interactive docs load scripts from a CDN: development only.
        docs_url=None if production else "/docs",
        redoc_url=None,
        openapi_url=None if production else "/openapi.json",
    )
    # Starlette runs the last middleware added first: the log wraps everything, then the
    # security headers, the global rate limit and the CSRF check.
    app.middleware("http")(csrf_middleware)
    app.middleware("http")(global_rate_limit_middleware)
    app.middleware("http")(security_headers_middleware)
    # Signed, short-lived cookie that only carries the OAuth state and nonce during the Google
    # redirect; user sessions live in the database (see app/auth/web.py).
    app.add_middleware(
        SessionMiddleware,
        secret_key=settings.secret_key,
        session_cookie="oauth_state",
        max_age=600,
        same_site="lax",
        https_only=settings.secure_cookies,
    )
    app.include_router(health.router)
    app.include_router(template.router)
    app.include_router(auth.router)
    app.include_router(projects.router)
    app.include_router(members.router)
    app.include_router(admin.router)
    app.include_router(ai.router)
    app.include_router(shares.router)
    app.include_router(site.router)
    app.include_router(feedback.router)
    app.include_router(shares.public_router)

    @app.exception_handler(EmailDeliveryError)
    async def email_not_sent(_request: Request, _error: EmailDeliveryError) -> JSONResponse:
        # The same answer whatever the address, so it reveals nothing about accounts.
        return JSONResponse(
            {"detail": "Non è stato possibile inviare l'email. Riprova tra qualche minuto."},
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    if settings.frontend_dist:
        mount_frontend(app, Path(settings.frontend_dist))
    # Added last, so it is the outermost layer: it also logs the session middleware's work.
    app.middleware("http")(request_log_middleware)
    return app


app = create_app()
