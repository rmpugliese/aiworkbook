from importlib.metadata import version

from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware

from app.auth.web import csrf_middleware
from app.config import get_settings
from app.routers import admin, ai, auth, health, projects, shares, template
from app.workbook.loader import validate_all_templates


def create_app() -> FastAPI:
    # Refuse to start with a broken workbook template.
    validate_all_templates()
    settings = get_settings()

    app = FastAPI(title="AI Project Workbook API", version=version("app"))
    app.middleware("http")(csrf_middleware)
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
    app.include_router(admin.router)
    app.include_router(ai.router)
    app.include_router(shares.router)
    app.include_router(shares.public_router)
    return app


app = create_app()
