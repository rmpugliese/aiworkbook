"""Read-only links to an iteration.

The token is shown once, at creation; the database keeps only its hash. Every way a link can stop
working (unknown, revoked, expired, archived project) is reported as the same NotFoundError, so a
visitor cannot tell them apart.
"""

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Literal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.security import new_token, token_hash
from app.models import Answer, Iteration, Project, ShareLink
from app.models.project import utcnow
from app.services.errors import ConflictError, NotFoundError
from app.services.projects import get_iteration

LinkStatus = Literal["active", "expired", "revoked"]


def aware(value: datetime) -> datetime:
    # SQLite returns naive datetimes, stored in UTC.
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value


def link_status(link: ShareLink) -> LinkStatus:
    if link.revoked_at is not None:
        return "revoked"
    if link.expires_at is not None and aware(link.expires_at) <= utcnow():
        return "expired"
    return "active"


def list_links(db: Session, project_id: int, iteration_id: int, *, user_id: int) -> list[ShareLink]:
    get_iteration(db, project_id, iteration_id, user_id=user_id, owner_only=True)
    return list(
        db.scalars(
            select(ShareLink)
            .where(ShareLink.iteration_id == iteration_id)
            .order_by(ShareLink.created_at.desc(), ShareLink.id.desc())
        )
    )


def create_link(
    db: Session,
    project_id: int,
    iteration_id: int,
    *,
    user_id: int,
    label: str,
    expires_in_days: int | None,
) -> tuple[ShareLink, str]:
    """Returns the new link and its token, which is not stored anywhere."""
    get_iteration(db, project_id, iteration_id, user_id=user_id, owner_only=True)
    token = new_token()
    now = utcnow()
    link = ShareLink(
        iteration_id=iteration_id,
        created_by=user_id,
        label=label,
        token_hash=token_hash(token),
        created_at=now,
        expires_at=now + timedelta(days=expires_in_days) if expires_in_days else None,
    )
    db.add(link)
    db.commit()
    return link, token


def _owned_link(
    db: Session, project_id: int, iteration_id: int, link_id: int, *, user_id: int
) -> ShareLink:
    get_iteration(db, project_id, iteration_id, user_id=user_id, owner_only=True)
    link = db.get(ShareLink, link_id)
    if link is None or link.iteration_id != iteration_id:
        raise NotFoundError(f"share link {link_id} not found")
    return link


def revoke_link(
    db: Session, project_id: int, iteration_id: int, link_id: int, *, user_id: int
) -> ShareLink:
    link = _owned_link(db, project_id, iteration_id, link_id, user_id=user_id)
    if link.revoked_at is None:
        link.revoked_at = utcnow()
        db.commit()
    return link


def delete_link(
    db: Session, project_id: int, iteration_id: int, link_id: int, *, user_id: int
) -> None:
    link = _owned_link(db, project_id, iteration_id, link_id, user_id=user_id)
    if link_status(link) == "active":
        raise ConflictError("Revoca il link prima di eliminarlo.")
    db.delete(link)
    db.commit()


@dataclass(frozen=True)
class SharedIteration:
    project: Project
    iteration: Iteration
    answers: list[Answer]


def resolve(db: Session, token: str) -> SharedIteration:
    """The iteration a visitor's token opens, counting the visit."""
    link = db.scalar(select(ShareLink).where(ShareLink.token_hash == token_hash(token)))
    if link is None or link_status(link) != "active":
        raise NotFoundError("share link not available")
    iteration = db.get(Iteration, link.iteration_id)
    if iteration is None or iteration.project.archived_at is not None:
        raise NotFoundError("share link not available")
    link.last_accessed_at = utcnow()
    link.access_count += 1
    db.commit()
    answers = list(db.scalars(select(Answer).where(Answer.iteration_id == iteration.id)))
    return SharedIteration(project=iteration.project, iteration=iteration, answers=answers)
