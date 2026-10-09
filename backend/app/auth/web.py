"""Session cookies, the signed-in user dependency and CSRF protection."""

from collections.abc import Awaitable, Callable
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session as DbSession

from app.auth.security import new_token, tokens_match
from app.config import get_settings
from app.db import get_db
from app.models import User
from app.services import auth as auth_service

SESSION_COOKIE = "session"
CSRF_COOKIE = "csrf_token"
CSRF_HEADER = "X-CSRF-Token"
_UNSAFE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


def set_session_cookie(response: Response, new_session: auth_service.NewSession) -> None:
    settings = get_settings()
    response.set_cookie(
        SESSION_COOKIE,
        new_session.token,
        max_age=settings.session_days * 24 * 3600,
        httponly=True,
        secure=settings.secure_cookies,
        samesite="lax",
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(SESSION_COOKIE, path="/")


def ensure_csrf_cookie(request: Request, response: Response) -> None:
    """The frontend reads this cookie and echoes it in the X-CSRF-Token header."""
    if not request.cookies.get(CSRF_COOKIE):
        response.set_cookie(
            CSRF_COOKIE,
            new_token(),
            httponly=False,
            secure=get_settings().secure_cookies,
            samesite="lax",
            path="/",
        )


def current_user(
    request: Request,
    db: Annotated[DbSession, Depends(get_db)],
    session: Annotated[str | None, Cookie(alias=SESSION_COOKIE)] = None,
) -> User:
    user = auth_service.user_for_session(db, session) if session else None
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Accesso richiesto.")
    request.state.user_id = user.id  # for the request log
    return user


CurrentUser = Annotated[User, Depends(current_user)]


async def csrf_middleware(
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> Response:
    """Double-submit cookie: unsafe /api requests must echo the CSRF cookie in a header.

    The Google callback is a top-level GET redirect, so it never needs the header.
    """
    if request.method in _UNSAFE_METHODS and request.url.path.startswith("/api/"):
        cookie = request.cookies.get(CSRF_COOKIE, "")
        header = request.headers.get(CSRF_HEADER, "")
        if not cookie or not header or not tokens_match(cookie, header):
            return JSONResponse(
                {"detail": "Richiesta non valida: ricarica la pagina e riprova."},
                status_code=status.HTTP_403_FORBIDDEN,
            )
    return await call_next(request)
