"""The user's rights over their own data: a full export (portability) and account deletion."""

import base64
from datetime import datetime, timedelta
from typing import Any, cast

from sqlalchemy import CursorResult, Delete, delete, func, or_, select
from sqlalchemy.orm import Session as DbSession

from app.models import AIRequest, Answer, EmailToken, Iteration, Project, Session, ShareLink, User
from app.models.project import utcnow
from app.services.auth import normalize_email
from app.services.branding import prepare_logo
from app.services.errors import ConflictError, InvalidRequestError
from app.services.sharing import link_status
from app.workbook.loader import find_question

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


def _parse_time(value: object) -> datetime | None:
    return datetime.fromisoformat(value) if isinstance(value, str) else None


def export_project(db: DbSession, project: Project) -> dict[str, Any]:
    """One project in a file of its own, to move it to another account or installation."""
    return {
        "format": EXPORT_FORMAT,
        "kind": "project",
        "exported_at": _iso(utcnow()),
        "project": _project(db, project),
    }


def _import_project(
    db: DbSession, user: User, source: dict[str, Any], counts: dict[str, int]
) -> Project:
    project = Project(
        name=source["name"],
        client_name=source.get("client_name"),
        description=source.get("description"),
        owner_id=user.id,
        created_at=_parse_time(source.get("created_at")) or utcnow(),
        archived_at=_parse_time(source.get("archived_at")),
    )
    db.add(project)
    db.flush()
    counts["projects"] += 1
    for item in source.get("iterations", []):
        iteration = Iteration(
            project_id=project.id,
            number=item["number"],
            title=item["title"],
            user_story=item.get("user_story"),
            template_version=item["template_version"],
            status=item.get("status", "draft"),
            created_at=_parse_time(item.get("created_at")) or utcnow(),
        )
        db.add(iteration)
        db.flush()
        counts["iterations"] += 1
        for answer in item.get("answers", []):
            if find_question(iteration.template_version, answer["question_key"]) is None:
                counts["skipped_answers"] += 1
                continue
            db.add(
                Answer(
                    iteration_id=iteration.id,
                    question_key=answer["question_key"],
                    text=answer.get("text"),
                    verdict=answer.get("verdict"),
                    choices=answer.get("choices"),
                    return_to_phase=answer.get("return_to_phase"),
                    updated_at=_parse_time(answer.get("updated_at")) or utcnow(),
                )
            )
            counts["answers"] += 1
        # The iteration was last touched when its source was, not now.
        iteration.updated_at = _parse_time(item.get("updated_at")) or utcnow()
    project.updated_at = _parse_time(source.get("updated_at")) or utcnow()
    return project


def import_projects(
    db: DbSession, user: User, data: dict[str, Any], *, brand: bool = False
) -> tuple[list[Project], dict[str, int]]:
    """Adds the projects of an exported file to the user's account, all or nothing.

    The file is either one project ("Esporta progetto") or a whole account ("Scarica i miei
    dati"). Projects are added, never merged. Share links are not recreated (their tokens are not
    in the export) and the AI consent is not carried over: the owner gives it again here. Answers
    to questions the template does not know are skipped. With `brand`, the logo and colour of an
    account export are copied where the user has none.
    """
    if data.get("format") != EXPORT_FORMAT:
        raise InvalidRequestError("File non riconosciuto: usa un file esportato da questa app.")
    if isinstance(data.get("project"), dict):
        sources = [data["project"]]
    elif isinstance(data.get("projects"), list) and data["projects"]:
        sources = data["projects"]
    else:
        raise InvalidRequestError("Il file non contiene progetti.")
    counts = {"projects": 0, "iterations": 0, "answers": 0, "skipped_answers": 0}
    projects = [_import_project(db, user, source, counts) for source in sources]

    exported_brand = data.get("brand") or {}
    if brand and user.brand_color is None and exported_brand.get("color"):
        user.brand_color = exported_brand["color"]
    logo = exported_brand.get("logo")
    if brand and user.logo is None and logo:
        user.logo, user.logo_content_type = prepare_logo(base64.b64decode(logo["base64"]))
        user.logo_updated_at = utcnow()
    db.commit()
    return projects, counts
