"""The AI assistant: configuration, per-project consent, request checks and the request log."""

from dataclasses import dataclass
from datetime import timedelta
from urllib.parse import urlparse

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session as DbSession

from app.ai import secrets
from app.ai.prompts import Action, Located, build_messages, locate
from app.ai.provider import LLMProvider, Message, OpenAICompatibleProvider, endpoint_location
from app.models import AIRequest, AISettings, Iteration, Project, User
from app.models.project import utcnow
from app.schemas.ai import AISettingsIn, AISettingsOut, AIStatusOut
from app.services.answers import list_answers
from app.services.errors import ConflictError, InvalidRequestError, NotFoundError
from app.services.projects import get_iteration, get_project
from app.workbook.loader import load_template

HOURLY_LIMIT = 30


class RateLimitedError(Exception):
    pass


def _row(db: DbSession) -> AISettings:
    row = db.get(AISettings, 1)
    if row is None:
        row = AISettings(id=1, enabled=False, base_url="", model="")
        db.add(row)
        db.commit()
    return row


def _configured(row: AISettings) -> bool:
    return row.enabled and bool(row.base_url.strip()) and bool(row.model.strip())


# --- Configuration (administrators) -----------------------------------------------------


def settings_out(db: DbSession) -> AISettingsOut:
    row = _row(db)
    return AISettingsOut(
        enabled=row.enabled,
        base_url=row.base_url,
        model=row.model,
        has_api_key=row.api_key_encrypted is not None,
        api_key_hint=row.api_key_hint,
        temperature=row.temperature,
        max_tokens=row.max_tokens,
        location=endpoint_location(row.base_url) if row.base_url else None,
        provider_name=row.provider_name,
        server_location=row.server_location,
        model_kind=row.model_kind,
    )


def update_settings(db: DbSession, data: AISettingsIn) -> AISettingsOut:
    row = _row(db)
    row.enabled = data.enabled
    row.base_url = data.base_url
    row.model = data.model
    row.temperature = data.temperature
    row.max_tokens = data.max_tokens
    row.provider_name = data.provider_name
    row.server_location = data.server_location
    row.model_kind = data.model_kind
    if data.clear_api_key:
        row.api_key_encrypted = None
        row.api_key_hint = None
    elif data.api_key:
        row.api_key_encrypted = secrets.encrypt(data.api_key)
        row.api_key_hint = data.api_key[-4:]
    db.commit()
    return settings_out(db)


def build_provider(row: AISettings) -> LLMProvider:
    api_key = secrets.decrypt(row.api_key_encrypted) if row.api_key_encrypted else None
    if row.api_key_encrypted and api_key is None:
        raise ConflictError("La chiave API salvata non è più leggibile: inseriscila di nuovo.")
    return OpenAICompatibleProvider(
        base_url=row.base_url,
        model=row.model,
        api_key=api_key,
        temperature=row.temperature,
        max_tokens=row.max_tokens,
    )


def configured_settings(db: DbSession) -> AISettings:
    row = _row(db)
    if not row.base_url.strip() or not row.model.strip():
        raise ConflictError("Indica l'URL dell'endpoint e il modello.")
    return row


# --- What users see ---------------------------------------------------------------------


def status(db: DbSession) -> AIStatusOut:
    row = _row(db)
    available = _configured(row)
    return AIStatusOut(
        available=available,
        model=row.model if available else None,
        location=endpoint_location(row.base_url) if available else None,
        host=_host(row.base_url) if available else None,
    )


def _host(base_url: str) -> str:
    return urlparse(base_url).netloc


def set_project_consent(db: DbSession, project_id: int, *, user_id: int, enabled: bool) -> Project:
    # Only the owner decides whether the project's content may go to the AI endpoint.
    project = get_project(db, project_id, user_id=user_id, owner_only=True)
    project.ai_enabled_at = utcnow() if enabled else None
    db.commit()
    return get_project(db, project_id, user_id=user_id)


# --- Assisting --------------------------------------------------------------------------


@dataclass(frozen=True)
class PreparedAssist:
    settings: AISettings
    messages: list[Message]
    log: AIRequest
    iteration_id: int


def prepare_assist(
    db: DbSession,
    user: User,
    project_id: int,
    iteration_id: int,
    *,
    question_key: str,
    action: Action,
    text: str,
    verdict: str | None,
    instructions: str = "",
) -> PreparedAssist:
    project = get_project(db, project_id, user_id=user.id)
    iteration = get_iteration(db, project_id, iteration_id, user_id=user.id)
    row = _row(db)
    if not _configured(row):
        raise ConflictError("L'assistente AI non è configurato: chiedi all'amministratore.")
    if project.ai_enabled_at is None:
        raise ConflictError("L'assistente non è attivo per questo progetto.")
    template = load_template(iteration.template_version)
    here: Located | None = locate(template, question_key)
    if here is None:
        raise NotFoundError(f"question {question_key} is not in the template")
    if action == "improve" and not text.strip():
        raise InvalidRequestError("Scrivi prima un testo da migliorare.")

    hour_ago = utcnow() - timedelta(hours=1)
    recent = db.scalar(
        select(func.count())
        .select_from(AIRequest)
        .where(AIRequest.user_id == user.id, AIRequest.created_at > hour_ago)
    )
    if (recent or 0) >= HOURLY_LIMIT:
        raise RateLimitedError

    messages = build_messages(
        action=action,
        project=project,
        iteration=iteration,
        template=template,
        answers=list_answers(db, project_id, iteration_id, user_id=user.id),
        here=here,
        current_text=text,
        current_verdict=verdict,
        instructions=instructions,
    )
    log = AIRequest(
        user_id=user.id,
        project_id=project.id,
        question_key=question_key,
        action=action,
        model=row.model,
        prompt_chars=sum(len(message["content"]) for message in messages),
    )
    return PreparedAssist(settings=row, messages=messages, log=log, iteration_id=iteration.id)


def save_log(db: DbSession, log: AIRequest, *, iteration_id: int) -> None:
    db.add(log)
    # A draft or an improved text (not a critique) means AI supported the iteration's content.
    if log.outcome == "ok" and log.output_chars > 0 and log.action in ("suggest", "improve"):
        db.execute(
            update(Iteration)
            .where(Iteration.id == iteration_id, Iteration.ai_assisted_at.is_(None))
            # Keep updated_at: nothing the user wrote has changed.
            .values(ai_assisted_at=utcnow(), updated_at=Iteration.updated_at)
        )
    db.commit()
