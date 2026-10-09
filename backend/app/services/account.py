"""The user's rights over their own data: a full export (portability) and account deletion."""

import base64
from datetime import datetime, timedelta
from typing import Any, cast

from sqlalchemy import CursorResult, Delete, delete, func, or_, select
from sqlalchemy.orm import Session as DbSession

from app.models import AIRequest, Answer, EmailToken, Iteration, Project, Session, ShareLink, User
from app.models.project import utcnow
from app.services.auth import normalize_email
from app.services.errors import ConflictError, InvalidRequestError
from app.services.sharing import link_status

EXPORT_FORMAT = 1
AI_LOG_RETENTION = timedelta(days=365)


def _iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def export_data(db: DbSession, user: User) -> dict[str, Any]:
    """Everything stored about the user, except secrets (password hash, session and link tokens)."""
    projects = db.scalars(
        select(Project).where(Project.owner_id == user.id).order_by(Project.id)
    ).all()
    return {
        "format": EXPORT_FORMAT,
        "exported_at": _iso(utcnow()),
        "account": {
            "email": user.email,
            "display_name": user.display_name,
            "created_at": _iso(user.created_at),
            "email_verified_at": _iso(user.email_verified_at),
            "google_linked": user.google_sub is not None,
            "is_admin": user.is_admin,
            "terms_accepted_at": _iso(user.terms_accepted_at),
            "terms_version": user.terms_version,
        },
        "brand": {
            "color": user.brand_color,
            "logo": (
                {
                    "content_type": user.logo_content_type,
                    "base64": base64.b64encode(user.logo).decode(),
                }
                if user.logo is not None
                else None
            ),
        },
        "projects": [_project(db, project) for project in projects],
        "ai_requests": [
            {
                "created_at": _iso(request.created_at),
                "project_id": request.project_id,
                "question_key": request.question_key,
                "action": request.action,
                "model": request.model,
                "outcome": request.outcome,
                "prompt_chars": request.prompt_chars,
                "output_chars": request.output_chars,
            }
            for request in db.scalars(
                select(AIRequest).where(AIRequest.user_id == user.id).order_by(AIRequest.id)
            )
        ],
    }


def _project(db: DbSession, project: Project) -> dict[str, Any]:
    return {
        "id": project.id,
        "name": project.name,
        "client_name": project.client_name,
        "description": project.description,
        "created_at": _iso(project.created_at),
        "updated_at": _iso(project.updated_at),
        "archived_at": _iso(project.archived_at),
        "ai_enabled_at": _iso(project.ai_enabled_at),
        "iterations": [_iteration(db, iteration) for iteration in project.iterations],
    }


def _iteration(db: DbSession, iteration: Iteration) -> dict[str, Any]:
    answers = db.scalars(
        select(Answer).where(Answer.iteration_id == iteration.id).order_by(Answer.question_key)
    )
    links = db.scalars(
        select(ShareLink).where(ShareLink.iteration_id == iteration.id).order_by(ShareLink.id)
    )
    return {
        "number": iteration.number,
        "title": iteration.title,
        "user_story": iteration.user_story,
        "status": iteration.status,
        "template_version": iteration.template_version,
        "created_at": _iso(iteration.created_at),
        "updated_at": _iso(iteration.updated_at),
        "answers": [
            {
                "question_key": answer.question_key,
                "text": answer.text,
                "verdict": answer.verdict,
                "choices": answer.choices,
                "return_to_phase": answer.return_to_phase,
                "updated_at": _iso(answer.updated_at),
            }
            for answer in answers
        ],
        # The links' tokens are not stored, so they cannot be exported.
        "share_links": [
            {
                "label": link.label,
                "status": link_status(link),
                "created_at": _iso(link.created_at),
                "expires_at": _iso(link.expires_at),
                "revoked_at": _iso(link.revoked_at),
                "access_count": link.access_count,
                "last_accessed_at": _iso(link.last_accessed_at),
            }
            for link in links
        ],
    }


def delete_account(db: DbSession, user: User, *, confirm_email: str) -> None:
    """Deletes the user and, through the database's cascades, everything they own."""
    if normalize_email(confirm_email) != user.email:
        raise InvalidRequestError("L'email di conferma non corrisponde a quella dell'account.")
    if user.is_admin:
        other_admins = db.scalar(
            select(func.count()).select_from(User).where(User.is_admin, User.id != user.id)
        )
        if not other_admins:
            raise ConflictError(
                "Sei l'unico amministratore: nomina un altro amministratore prima di eliminare "
                "il tuo account."
            )
    db.delete(user)
    db.commit()


def cleanup(db: DbSession) -> dict[str, int]:
    """Removes what is no longer needed: expired sessions, spent email links, old AI logs."""
    now = utcnow()

    def count(statement: Delete) -> int:
        result = cast(CursorResult[Any], db.execute(statement))
        return result.rowcount

    removed = {
        "sessions": count(delete(Session).where(Session.expires_at < now)),
        "email_tokens": count(
            delete(EmailToken).where(
                or_(EmailToken.used_at.is_not(None), EmailToken.expires_at < now)
            )
        ),
        "ai_requests": count(
            delete(AIRequest).where(AIRequest.created_at < now - AI_LOG_RETENTION)
        ),
    }
    db.commit()
    return removed
