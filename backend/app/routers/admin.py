from collections.abc import Iterator
from contextlib import contextmanager
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DbSession

from app.auth.web import CurrentUser
from app.db import get_db
from app.models import User
from app.schemas.auth import AdminUserOut
from app.services import admin as service
from app.services.errors import ConflictError, NotFoundError


def require_admin(user: CurrentUser) -> User:
    if not user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Riservato agli amministratori.")
    return user


Admin = Annotated[User, Depends(require_admin)]
Db = Annotated[DbSession, Depends(get_db)]

router = APIRouter(prefix="/api/admin", tags=["admin"])


@contextmanager
def _errors() -> Iterator[None]:
    try:
        yield
    except NotFoundError as error:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(error)) from error
    except ConflictError as error:
        raise HTTPException(status.HTTP_409_CONFLICT, str(error)) from error


def _out(summary: service.UserSummary) -> AdminUserOut:
    user = summary.user
    return AdminUserOut(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        is_admin=user.is_admin,
        created_at=user.created_at,
        email_verified_at=user.email_verified_at,
        suspended_at=user.suspended_at,
        last_seen_at=summary.last_seen_at,
        project_count=summary.project_count,
        google_linked=user.google_sub is not None,
    )


def _summary_of(db: DbSession, user_id: int) -> AdminUserOut:
    return next(_out(s) for s in service.list_users(db) if s.user.id == user_id)


@router.get("/users")
def list_users(db: Db, admin: Admin) -> list[AdminUserOut]:
    return [_out(summary) for summary in service.list_users(db)]


@router.post("/users/{user_id}/confirm-email")
def confirm_email(db: Db, admin: Admin, user_id: int) -> AdminUserOut:
    with _errors():
        service.confirm_email(db, user_id)
    return _summary_of(db, user_id)


@router.post("/users/{user_id}/suspend")
def suspend(db: Db, admin: Admin, user_id: int) -> AdminUserOut:
    with _errors():
        service.suspend(db, user_id, admin=admin)
    return _summary_of(db, user_id)


@router.post("/users/{user_id}/reactivate")
def reactivate(db: Db, admin: Admin, user_id: int) -> AdminUserOut:
    with _errors():
        service.reactivate(db, user_id)
    return _summary_of(db, user_id)


@router.post("/users/{user_id}/resend-verification", status_code=status.HTTP_204_NO_CONTENT)
def resend_verification(db: Db, admin: Admin, user_id: int) -> None:
    with _errors():
        service.resend_verification(db, user_id)
