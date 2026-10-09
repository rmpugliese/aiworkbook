import json
from typing import Annotated, Any

from authlib.integrations.base_client import OAuthError
from authlib.integrations.starlette_client import OAuth
from fastapi import (
    APIRouter,
    Cookie,
    Depends,
    HTTPException,
    Request,
    Response,
    UploadFile,
    status,
)
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session as DbSession

from app.auth import rate_limit
from app.auth.web import (
    SESSION_COOKIE,
    CurrentUser,
    clear_session_cookie,
    ensure_csrf_cookie,
    set_session_cookie,
)
from app.config import get_settings
from app.db import get_db
from app.legal import TERMS_VERSION
from app.models import User
from app.models.project import utcnow
from app.schemas.auth import (
    DeleteAccountIn,
    EmailIn,
    LoginIn,
    MessageOut,
    PasswordResetIn,
    ProfileIn,
    ProvidersOut,
    RegisterIn,
    TokenIn,
    UserOut,
)
from app.services import account, branding
from app.services import auth as service
from app.services.errors import ConflictError, InvalidRequestError

router = APIRouter(prefix="/api/auth", tags=["auth"])

Db = Annotated[DbSession, Depends(get_db)]

CHECK_EMAIL = MessageOut(
    detail="Se l'indirizzo è corretto, riceverai a breve un'email con le istruzioni."
)


def _user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        has_password=user.password_hash is not None,
        google_linked=user.google_sub is not None,
        is_admin=user.is_admin,
        brand_color=user.brand_color,
        terms_current=user.terms_version == TERMS_VERSION,
        logo_url=(
            f"/api/auth/me/logo?v={int(user.logo_updated_at.timestamp())}"
            if user.logo_updated_at
            else None
        ),
    )


def _limit_email_requests(request: Request) -> None:
    key = request.client.host if request.client else "unknown"
    if rate_limit.email_requests.is_limited(key):
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS, "Troppe richieste: riprova tra un po'."
        )
    rate_limit.email_requests.hit(key)


@router.get("/me")
def me(user: CurrentUser) -> UserOut:
    return _user_out(user)


@router.post("/me/accept-terms")
def accept_terms(db: Db, user: CurrentUser) -> UserOut:
    return _user_out(service.accept_terms(db, user))


@router.get(
    "/me/export",
    response_class=Response,
    responses={200: {"content": {"application/json": {}}, "description": "All the user's data"}},
)
def export_my_data(db: Db, user: CurrentUser) -> Response:
    data = account.export_data(db, user)
    filename = f"ai-project-workbook-dati-{utcnow():%Y-%m-%d}.json"
    return Response(
        content=json.dumps(data, ensure_ascii=False, indent=2, default=str),
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store",
        },
    )


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_account(db: Db, user: CurrentUser, data: DeleteAccountIn, response: Response) -> None:
    try:
        account.delete_account(db, user, confirm_email=data.confirm_email)
    except InvalidRequestError as error:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(error)) from error
    except ConflictError as error:
        raise HTTPException(status.HTTP_409_CONFLICT, str(error)) from error
    clear_session_cookie(response)


@router.patch("/me")
def update_profile(db: Db, user: CurrentUser, data: ProfileIn) -> UserOut:
    try:
        branding.update_profile(
            db,
            user,
            fields=data.model_fields_set,
            display_name=data.display_name,
            brand_color=data.brand_color,
        )
    except InvalidRequestError as error:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(error)) from error
    return _user_out(user)


@router.put("/me/logo")
async def upload_logo(db: Db, user: CurrentUser, file: UploadFile) -> UserOut:
    # Read one byte more than allowed: enough to know the file is too large.
    data = await file.read(branding.MAX_LOGO_BYTES + 1)
    try:
        branding.set_logo(db, user, data)
    except InvalidRequestError as error:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(error)) from error
    return _user_out(user)


@router.delete("/me/logo")
def delete_logo(db: Db, user: CurrentUser) -> UserOut:
    branding.clear_logo(db, user)
    return _user_out(user)


@router.get(
    "/me/logo",
    response_class=Response,
    responses={200: {"content": {"image/*": {}}, "description": "The user's logo"}},
)
def get_logo(user: CurrentUser) -> Response:
    if user.logo is None or user.logo_content_type is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Nessun logo.")
    return Response(
        content=user.logo,
        media_type=user.logo_content_type,
        headers={
            # Opened directly, an SVG still cannot run scripts or load anything.
            "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "private, max-age=31536000, immutable",
        },
    )


@router.get("/csrf", status_code=status.HTTP_204_NO_CONTENT)
def csrf(request: Request, response: Response) -> None:
    """Sets the CSRF cookie. The frontend calls it once on start-up, signed in or not."""
    ensure_csrf_cookie(request, response)


@router.get("/providers")
def providers() -> ProvidersOut:
    return ProvidersOut(google=get_settings().google_enabled)


@router.post("/register", status_code=status.HTTP_202_ACCEPTED)
def register(db: Db, data: RegisterIn, request: Request) -> MessageOut:
    _limit_email_requests(request)
    service.register(db, data.email, data.password, data.display_name)
    return CHECK_EMAIL


@router.post("/resend-verification", status_code=status.HTTP_202_ACCEPTED)
def resend_verification(db: Db, data: EmailIn, request: Request) -> MessageOut:
    _limit_email_requests(request)
    service.resend_verification(db, data.email)
    return CHECK_EMAIL


@router.post("/verify-email")
def verify_email(db: Db, data: TokenIn, response: Response) -> UserOut:
    try:
        new_session = service.verify_email(db, data.token)
    except InvalidRequestError as error:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(error)) from error
    set_session_cookie(response, new_session)
    return _user_out(new_session.session.user)


@router.post("/login")
def login(db: Db, data: LoginIn, response: Response) -> UserOut:
    key = service.normalize_email(data.email)
    if rate_limit.failed_logins.is_limited(key):
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "Troppi tentativi non riusciti: riprova tra qualche minuto.",
        )
    try:
        new_session = service.login(db, data.email, data.password)
    except service.InvalidCredentialsError as error:
        rate_limit.failed_logins.hit(key)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Email o password non validi.") from error
    except service.AccountSuspendedError as error:
        raise HTTPException(
            status.HTTP_423_LOCKED,
            "Questo account è sospeso: contatta l'amministratore.",
        ) from error
    except service.EmailNotVerifiedError as error:
        # 403 tells the frontend to offer a new confirmation link.
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Devi ancora confermare il tuo indirizzo email."
        ) from error
    rate_limit.failed_logins.reset(key)
    set_session_cookie(response, new_session)
    return _user_out(new_session.session.user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    db: Db,
    response: Response,
    session: Annotated[str | None, Cookie(alias=SESSION_COOKIE)] = None,
) -> None:
    if session:
        service.logout(db, session)
    clear_session_cookie(response)


@router.post("/password-reset/request", status_code=status.HTTP_202_ACCEPTED)
def request_password_reset(db: Db, data: EmailIn, request: Request) -> MessageOut:
    _limit_email_requests(request)
    service.request_password_reset(db, data.email)
    return CHECK_EMAIL


@router.post("/password-reset/confirm", status_code=status.HTTP_204_NO_CONTENT)
def confirm_password_reset(db: Db, data: PasswordResetIn) -> None:
    try:
        service.reset_password(db, data.token, data.password)
    except InvalidRequestError as error:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(error)) from error


# --- Google (OpenID Connect) ------------------------------------------------------------

oauth = OAuth()


def _google() -> Any:
    settings = get_settings()
    if not settings.google_enabled:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Accesso con Google non configurato.")
    client = oauth.create_client("google")
    if client is None:
        oauth.register(
            "google",
            client_id=settings.google_client_id,
            client_secret=settings.google_client_secret,
            server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
            client_kwargs={"scope": "openid email profile"},
        )
        client = oauth.create_client("google")
    return client


@router.get("/google/login")
async def google_login(request: Request) -> Response:
    redirect_uri = f"{get_settings().public_url.rstrip('/')}/api/auth/google/callback"
    response: Response = await _google().authorize_redirect(request, redirect_uri)
    return response


@router.get("/google/callback")
async def google_callback(request: Request, db: Db) -> Response:
    public_url = get_settings().public_url.rstrip("/")
    try:
        token = await _google().authorize_access_token(request)
        new_session = service.sign_in_with_google(db, dict(token.get("userinfo") or {}))
    except (OAuthError, ConflictError, service.AccountSuspendedError):
        return RedirectResponse(f"{public_url}/login?error=google", status.HTTP_303_SEE_OTHER)
    response = RedirectResponse(f"{public_url}/", status.HTTP_303_SEE_OTHER)
    set_session_cookie(response, new_session)
    return response
