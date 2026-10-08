"""Account administration. Deliberately no access to other users' projects or answers."""

from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session as DbSession

from app.models import Project, Session, User
from app.models.project import utcnow
from app.services import auth
from app.services.errors import ConflictError, NotFoundError


@dataclass(frozen=True)
class UserSummary:
    user: User
    project_count: int
    last_seen_at: datetime | None


def list_users(db: DbSession) -> list[UserSummary]:
    projects = select(func.count(Project.id)).where(Project.owner_id == User.id).scalar_subquery()
    last_seen = (
        select(func.max(Session.last_seen_at)).where(Session.user_id == User.id).scalar_subquery()
    )
    rows = db.execute(select(User, projects, last_seen).order_by(User.created_at, User.id)).all()
    return [UserSummary(user, count or 0, seen) for user, count, seen in rows]


def _get(db: DbSession, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise NotFoundError(f"user {user_id} not found")
    return user


def confirm_email(db: DbSession, user_id: int) -> User:
    user = _get(db, user_id)
    if user.email_verified_at is None:
        user.email_verified_at = utcnow()
        db.commit()
    return user


def suspend(db: DbSession, user_id: int, *, admin: User) -> User:
    user = _get(db, user_id)
    if user.id == admin.id:
        raise ConflictError("Non puoi sospendere il tuo stesso account.")
    if user.suspended_at is None:
        user.suspended_at = utcnow()
        # Sign the user out everywhere, right now.
        db.execute(delete(Session).where(Session.user_id == user.id))
        db.commit()
    return user


def reactivate(db: DbSession, user_id: int) -> User:
    user = _get(db, user_id)
    user.suspended_at = None
    db.commit()
    return user


def resend_verification(db: DbSession, user_id: int) -> None:
    user = _get(db, user_id)
    if user.email_verified_at is not None:
        raise ConflictError("L'email di questo account è già confermata.")
    auth.resend_verification(db, user.email)
