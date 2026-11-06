import json
import time
from collections.abc import AsyncIterator, Iterator
from contextlib import contextmanager
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session as DbSession

from app.ai.dependencies import ProviderFactory, get_provider_factory
from app.ai.provider import AIServiceError, Completion
from app.auth.web import CurrentUser
from app.db import get_db
from app.routers.admin import Admin
from app.schemas.ai import AISettingsIn, AISettingsOut, AIStatusOut, AITestOut, AssistIn
from app.services import ai as service
from app.services.errors import ConflictError, InvalidRequestError, NotFoundError

Db = Annotated[DbSession, Depends(get_db)]
Factory = Annotated[ProviderFactory, Depends(get_provider_factory)]

router = APIRouter(tags=["ai"])


@contextmanager
def _errors() -> Iterator[None]:
    try:
        yield
    except NotFoundError as error:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(error)) from error
    except ConflictError as error:
        raise HTTPException(status.HTTP_409_CONFLICT, str(error)) from error
    except InvalidRequestError as error:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(error)) from error
    except service.RateLimitedError as error:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            f"Hai raggiunto il limite di {service.HOURLY_LIMIT} richieste all'ora all'assistente.",
        ) from error


# --- Administrators ---------------------------------------------------------------------


@router.get("/api/admin/ai")
def get_ai_settings(db: Db, admin: Admin) -> AISettingsOut:
    return service.settings_out(db)


@router.put("/api/admin/ai")
def update_ai_settings(db: Db, admin: Admin, data: AISettingsIn) -> AISettingsOut:
    return service.update_settings(db, data)


@router.post("/api/admin/ai/test")
async def test_ai_connection(db: Db, admin: Admin, factory: Factory) -> AITestOut:
    with _errors():
        row = await run_in_threadpool(service.configured_settings, db)
        provider = factory(row)
    try:
        seconds = await provider.ping()
    except AIServiceError as error:
        return AITestOut(ok=False, detail=str(error))
    return AITestOut(ok=True, seconds=round(seconds, 2), detail=f"Il modello {row.model} risponde.")


# --- Users ------------------------------------------------------------------------------


@router.get("/api/ai/status")
def ai_status(db: Db, user: CurrentUser) -> AIStatusOut:
    return service.status(db)


def _event(name: str, data: dict[str, object]) -> str:
    return f"event: {name}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


@router.post(
    "/api/projects/{project_id}/iterations/{iteration_id}/assist",
    response_class=StreamingResponse,
    responses={200: {"content": {"text/event-stream": {}}, "description": "Server-sent events"}},
)
async def assist(
    db: Db,
    user: CurrentUser,
    factory: Factory,
    project_id: int,
    iteration_id: int,
    data: AssistIn,
) -> StreamingResponse:
    """Streams `delta` events with text, then `done`, or a single `error` event."""
    with _errors():
        prepared = await run_in_threadpool(
            service.prepare_assist,
            db,
            user,
            project_id,
            iteration_id,
            question_key=data.question_key,
            action=data.action,
            text=data.text,
            verdict=data.verdict,
            instructions=data.instructions,
        )
        provider = factory(prepared.settings)
    engine = db.get_bind()

    async def events() -> AsyncIterator[str]:
        log = prepared.log
        completion = Completion()
        started = time.monotonic()
        written = 0
        try:
            async for piece in provider.stream(prepared.messages, completion):
                written += len(piece)
                yield _event("delta", {"text": piece})
            log.outcome = "ok"
            yield _event("done", {})
        except AIServiceError as error:
            log.outcome, log.error = "error", str(error)[:500]
            yield _event("error", {"detail": str(error)})
        except BaseException:
            log.outcome = "cancelled"  # the browser stopped reading
            raise
        finally:
            log.duration_ms = int((time.monotonic() - started) * 1000)
            log.output_chars = written
            log.prompt_tokens = completion.usage.prompt_tokens
            log.completion_tokens = completion.usage.completion_tokens
            with DbSession(bind=engine) as session:
                service.save_log(session, log, iteration_id=prepared.iteration_id)

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
