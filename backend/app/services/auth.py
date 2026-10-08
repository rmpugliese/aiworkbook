"""Accounts: sign-up with email confirmation, sign-in, sessions, password reset, Google."""

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from urllib.parse import urlencode

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session as DbSession

from app import email
from app.auth.security import hash_password, new_token, token_hash, verify_password
from app.config import get_settings
from app.models import EmailToken, Project, Session, User
from app.models.project import utcnow
from app.services.errors import ConflictError, InvalidRequestError

VERIFY_EMAIL = "verify_email"
RESET_PASSWORD = "reset_password"
TOKEN_LIFETIME = {VERIFY_EMAIL: timedelta(hours=24), RESET_PASSWORD: timedelta(hours=1)}
SESSION_REFRESH = timedelta(days=1)


class InvalidCredentialsError(Exception):
    """Wrong email or password (deliberately not saying which)."""


class EmailNotVerifiedError(Exception):
    """Right password, but the email address is not confirmed yet."""


class AccountSuspendedError(Exception):
    """An administrator suspended this account."""


@dataclass(frozen=True)
class NewSession:
    token: str  # goes in the cookie; only its hash is stored
    session: Session


def normalize_email(address: str) -> str:
    return address.strip().lower()


def _aware(value: datetime) -> datetime:
    # SQLite returns naive datetimes; they are stored in UTC.
    return value if value.tzinfo else value.replace(tzinfo=UTC)


def _link(path: str, **query: str) -> str:
    return f"{get_settings().public_url.rstrip('/')}{path}?{urlencode(query)}"


def _issue_token(db: DbSession, user: User, purpose: str) -> str:
    token = new_token()
    db.add(
        EmailToken(
            user_id=user.id,
            purpose=purpose,
            token_hash=token_hash(token),
            expires_at=utcnow() + TOKEN_LIFETIME[purpose],
        )
    )
    return token


def _consume_token(db: DbSession, token: str, purpose: str) -> User:
    record = db.scalar(select(EmailToken).where(EmailToken.token_hash == token_hash(token)))
    if (
        record is None
        or record.purpose != purpose
        or record.used_at is not None
        or _aware(record.expires_at) < utcnow()
    ):
        raise InvalidRequestError("Il link non è valido o è scaduto.")
    record.used_at = utcnow()
    user = db.get(User, record.user_id)
    assert user is not None  # tokens are deleted with their user
    return user


def _user_by_email(db: DbSession, address: str) -> User | None:
    return db.scalar(select(User).where(User.email == normalize_email(address)))


# --- Sign-up and confirmation -----------------------------------------------------------


def register(db: DbSession, address: str, password: str, display_name: str | None) -> None:
    """Same outcome whether or not the address is taken: the email tells the owner."""
    existing = _user_by_email(db, address)
    if existing is not None:
        email.send_already_registered(existing.email, _link("/login"), _link("/forgot-password"))
        return
    user = User(
        email=normalize_email(address),
        password_hash=hash_password(password),
        display_name=(display_name or "").strip() or None,
    )
    db.add(user)
    db.flush()
    token = _issue_token(db, user, VERIFY_EMAIL)
    db.commit()
    email.send_verification(user.email, _link("/verify-email", token=token))


def resend_verification(db: DbSession, address: str) -> None:
    user = _user_by_email(db, address)
    if user is None or user.email_verified_at is not None:
        return
    token = _issue_token(db, user, VERIFY_EMAIL)
    db.commit()
    email.send_verification(user.email, _link("/verify-email", token=token))


def verify_email(db: DbSession, token: str) -> NewSession:
    user = _consume_token(db, token, VERIFY_EMAIL)
    _mark_verified(db, user)
    db.commit()
    return create_session(db, user)


def _mark_verified(db: DbSession, user: User) -> None:
    if user.email_verified_at is None:
        user.email_verified_at = utcnow()
        db.flush()
        _set_up_first_account(db, user)


def _set_up_first_account(db: DbSession, user: User) -> None:
    """The first confirmed account administers the app and takes over the projects created in
    single-user local mode."""
    verified = db.scalar(select(func.count()).where(User.email_verified_at.is_not(None)))
    if verified == 1:
        user.is_admin = True
        # Keep updated_at as it was: a change of owner is not an edit of the project.
        db.execute(
            update(Project)
            .where(Project.owner_id.is_(None))
            .values(owner_id=user.id, updated_at=Project.updated_at)
        )


# --- Sign-in, sessions ------------------------------------------------------------------


def login(db: DbSession, address: str, password: str) -> NewSession:
    user = _user_by_email(db, address)
    if not verify_password(password, user.password_hash if user else None) or user is None:
        raise InvalidCredentialsError
    if user.email_verified_at is None:
        raise EmailNotVerifiedError
    if user.suspended_at is not None:
        raise AccountSuspendedError
    return create_session(db, user)


def create_session(db: DbSession, user: User) -> NewSession:
    token = new_token()
    now = utcnow()
    session = Session(
        id=token_hash(token),
        user_id=user.id,
        created_at=now,
        last_seen_at=now,
        expires_at=now + timedelta(days=get_settings().session_days),
    )
    db.add(session)
    db.commit()
    return NewSession(token=token, session=session)


def user_for_session(db: DbSession, token: str) -> User | None:
    """The signed-in user, extending the session at most once a day while it is used."""
    session = db.get(Session, token_hash(token))
    now = utcnow()
    if session is None or _aware(session.expires_at) < now or session.user.suspended_at:
        return None
    if now - _aware(session.last_seen_at) > SESSION_REFRESH:
        session.last_seen_at = now
        session.expires_at = now + timedelta(days=get_settings().session_days)
        db.commit()
    return session.user


def logout(db: DbSession, token: str) -> None:
    session = db.get(Session, token_hash(token))
    if session is not None:
        db.delete(session)
        db.commit()


# --- Password reset ---------------------------------------------------------------------


def request_password_reset(db: DbSession, address: str) -> None:
    user = _user_by_email(db, address)
    if user is None:
        return
    token = _issue_token(db, user, RESET_PASSWORD)
    db.commit()
    email.send_password_reset(user.email, _link("/reset-password", token=token))


def reset_password(db: DbSession, token: str, password: str) -> None:
    user = _consume_token(db, token, RESET_PASSWORD)
    user.password_hash = hash_password(password)
    # Opening the link proves the address, and every other session must end.
    _mark_verified(db, user)
    for session in list(user.sessions):
        db.delete(session)
    db.commit()


# --- Google -----------------------------------------------------------------------------


def sign_in_with_google(db: DbSession, claims: dict[str, object]) -> NewSession:
    """`claims` are the verified ID token claims returned by Google."""
    subject = str(claims.get("sub") or "")
    address = str(claims.get("email") or "")
    if not subject or not address or claims.get("email_verified") is not True:
        raise ConflictError("Google non ha confermato questo indirizzo email.")

    user = db.scalar(select(User).where(User.google_sub == subject)) or _user_by_email(db, address)
    if user is None:
        user = User(email=normalize_email(address), display_name=_name(claims))
        db.add(user)
        db.flush()
    if user.google_sub is None:
        user.google_sub = subject
    elif user.google_sub != subject:
        raise ConflictError("Questo account è già collegato a un altro profilo Google.")
    if user.suspended_at is not None:
        raise AccountSuspendedError
    if user.display_name is None:
        user.display_name = _name(claims)
    _mark_verified(db, user)
    db.commit()
    return create_session(db, user)


def _name(claims: dict[str, object]) -> str | None:
    name = claims.get("name")
    return str(name) if name else None
