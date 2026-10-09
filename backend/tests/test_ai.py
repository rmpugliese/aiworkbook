"""The assistant's API, with a fake provider: no real endpoint is ever called."""

import json
from collections.abc import AsyncIterator, Iterator
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.dependencies import get_provider_factory
from app.ai.provider import AIServiceError, Completion, Message, Usage
from app.models import AIRequest, AISettings
from app.services import ai as ai_service

TEXT = "p1.objectives.business_objectives.problem"
FACTOR = "p1.go_no_go.business_feasibility.problem_definition"


class FakeProvider:
    def __init__(self, pieces: list[str], error: str | None = None) -> None:
        self.model = "finto"
        self.pieces = pieces
        self.error = error
        self.calls: list[list[Message]] = []

    async def stream(self, messages: list[Message], completion: Completion) -> AsyncIterator[str]:
        self.calls.append(messages)
        for piece in self.pieces:
            yield piece
        if self.error:
            raise AIServiceError(self.error)
        completion.usage = Usage(prompt_tokens=200, completion_tokens=12)

    async def ping(self) -> float:
        if self.error:
            raise AIServiceError(self.error)
        return 0.12


@pytest.fixture
def fake(client: TestClient, admin_client: TestClient) -> Iterator[FakeProvider]:
    provider = FakeProvider(["Ridurre ", "gli abbandoni ", "del 15%."])
    for c in (client, admin_client):
        c.app.dependency_overrides[get_provider_factory] = lambda: lambda row: provider  # type: ignore[attr-defined]
    yield provider


def configure(admin_client: TestClient, **fields: Any) -> Any:
    body = {
        "enabled": True,
        "base_url": "http://localhost:11434/v1",
        "model": "llama3.1:8b",
        **fields,
    }
    return admin_client.put("/api/admin/ai", json=body)


@pytest.fixture
def project(client: TestClient) -> dict[str, Any]:
    created: dict[str, Any] = client.post(
        "/api/projects", json={"name": "Churn", "client_name": "ACME Spa"}
    ).json()
    created["base"] = f"/api/projects/{created['id']}/iterations/{created['iterations'][0]['id']}"
    return created


def assist(client: TestClient, project: dict[str, Any], **fields: Any) -> Any:
    body = {"question_key": TEXT, "action": "suggest", **fields}
    return client.post(f"{project['base']}/assist", json=body)


def events(response: Any) -> list[tuple[str, dict[str, Any]]]:
    parsed = []
    for block in response.text.strip().split("\n\n"):
        name, data = block.split("\n", 1)
        parsed.append((name.removeprefix("event: "), json.loads(data.removeprefix("data: "))))
    return parsed


def ready(admin_client: TestClient, client: TestClient, project: dict[str, Any]) -> None:
    configure(admin_client)
    client.post(f"/api/projects/{project['id']}/ai/enable")


# --- Configuration --------------------------------------------------------------------


def test_admin_configures_the_endpoint_and_the_key_is_never_returned(
    admin_client: TestClient, db: Session
) -> None:
    response = configure(admin_client, api_key="sk-segretissima-1234")

    body = response.json()
    assert response.status_code == 200
    assert body["has_api_key"] is True and body["api_key_hint"] == "1234"
    assert body["location"] == "locale"
    assert "sk-segretissima" not in response.text
    assert "sk-segretissima" not in admin_client.get("/api/admin/ai").text
    stored = db.get(AISettings, 1)
    assert stored is not None and stored.api_key_encrypted
    assert "sk-segretissima" not in stored.api_key_encrypted


def test_the_key_is_kept_replaced_or_cleared(admin_client: TestClient) -> None:
    configure(admin_client, api_key="prima-chiave-aaaa")

    assert configure(admin_client).json()["api_key_hint"] == "aaaa"  # kept
    assert configure(admin_client, api_key="nuova-bbbb").json()["api_key_hint"] == "bbbb"
    assert configure(admin_client, clear_api_key=True).json()["has_api_key"] is False


def test_the_stored_key_decrypts_for_the_provider(admin_client: TestClient, db: Session) -> None:
    configure(admin_client, api_key="sk-originale")
    row = db.get(AISettings, 1)
    assert row is not None

    provider = ai_service.build_provider(row)

    assert provider._headers["Authorization"] == "Bearer sk-originale"  # type: ignore[attr-defined]


def test_invalid_url_is_rejected(admin_client: TestClient) -> None:
    assert configure(admin_client, base_url="localhost:11434").status_code == 422


def test_only_administrators_configure_the_assistant(client: TestClient) -> None:
    assert client.get("/api/admin/ai").status_code == 403
    assert client.put("/api/admin/ai", json={}).status_code == 403


def test_connection_test(admin_client: TestClient, fake: FakeProvider) -> None:
    configure(admin_client)
    assert admin_client.post("/api/admin/ai/test").json()["ok"] is True

    fake.error = "Impossibile raggiungere l'assistente."
    result = admin_client.post("/api/admin/ai/test").json()
    assert result == {
        "ok": False,
        "seconds": None,
        "detail": "Impossibile raggiungere l'assistente.",
    }


def test_users_see_whether_the_assistant_is_available(
    admin_client: TestClient, client: TestClient
) -> None:
    assert client.get("/api/ai/status").json()["available"] is False
    configure(admin_client, base_url="https://openrouter.ai/api/v1")

    status = client.get("/api/ai/status").json()
    assert status == {
        "available": True,
        "model": "llama3.1:8b",
        "location": "remoto",
        "host": "openrouter.ai",
    }


# --- Consent and checks ------------------------------------------------------------------


def test_consent_is_per_project_and_off_by_default(
    client: TestClient, project: dict[str, Any]
) -> None:
    assert project["ai_enabled_at"] is None
    enabled = client.post(f"/api/projects/{project['id']}/ai/enable").json()
    assert enabled["ai_enabled_at"] is not None
    disabled = client.post(f"/api/projects/{project['id']}/ai/disable").json()
    assert disabled["ai_enabled_at"] is None


def test_assist_needs_configuration_and_consent(
    admin_client: TestClient, client: TestClient, project: dict[str, Any], fake: FakeProvider
) -> None:
    assert assist(client, project).status_code == 409  # not configured
    configure(admin_client)
    response = assist(client, project)
    assert response.status_code == 409
    assert "non è attivo per questo progetto" in response.json()["detail"]
    assert fake.calls == []


def test_improve_needs_some_text(
    admin_client: TestClient, client: TestClient, project: dict[str, Any], fake: FakeProvider
) -> None:
    ready(admin_client, client, project)

    assert assist(client, project, action="improve", text="  ").status_code == 422


def test_unknown_question_and_other_users_projects_are_404(
    admin_client: TestClient,
    client: TestClient,
    other_client: TestClient,
    project: dict[str, Any],
    fake: FakeProvider,
) -> None:
    ready(admin_client, client, project)

    assert assist(client, project, question_key="p1.x.y.z").status_code == 404
    other_client.app.dependency_overrides[get_provider_factory] = lambda: lambda row: fake  # type: ignore[attr-defined]
    assert assist(other_client, project).status_code == 404
    assert other_client.post(f"/api/projects/{project['id']}/ai/enable").status_code == 404


# --- Assisting --------------------------------------------------------------------------


def test_suggest_streams_the_proposal_and_logs_only_metadata(
    admin_client: TestClient,
    client: TestClient,
    project: dict[str, Any],
    fake: FakeProvider,
    db: Session,
) -> None:
    ready(admin_client, client, project)

    response = assist(client, project, text="Bozza iniziale")

    assert response.headers["content-type"].startswith("text/event-stream")
    assert events(response) == [
        ("delta", {"text": "Ridurre "}),
        ("delta", {"text": "gli abbandoni "}),
        ("delta", {"text": "del 15%."}),
        ("done", {}),
    ]
    [log] = db.scalars(select(AIRequest)).all()
    assert (log.action, log.question_key, log.outcome, log.model) == (
        "suggest",
        TEXT,
        "ok",
        "llama3.1:8b",
    )
    assert log.output_chars == len("Ridurre gli abbandoni del 15%.")
    assert log.prompt_chars > 0 and log.completion_tokens == 12
    columns = {c.name for c in AIRequest.__table__.columns}
    assert not columns & {"prompt", "content", "text", "answer"}


def test_the_prompt_carries_the_project_context(
    admin_client: TestClient, client: TestClient, project: dict[str, Any], fake: FakeProvider
) -> None:
    ready(admin_client, client, project)
    client.patch(
        project["base"], json={"user_story": "Come venditore voglio prevenire gli abbandoni"}
    )
    client.put(
        f"{project['base']}/answers/{FACTOR}", json={"verdict": "maybe", "text": "Da chiarire"}
    )

    assist(client, project, action="review", text="Il mio testo")

    system, user = fake.calls[0]
    assert system["role"] == "system" and "CPMAI" in system["content"]
    content = user["content"]
    for expected in [
        "PROGETTO: Churn",
        "Cliente: ACME Spa",
        "User story: Come venditore voglio prevenire gli abbandoni",
        "Quale problema volete risolvere con l'AI in questa iterazione?",
        "Guida del task:",
        "Verdetto: MAYBE",
        "Da chiarire",
        "Il mio testo",
        "revisione critica",
    ]:
        assert expected in content, expected


def test_long_context_is_truncated(
    admin_client: TestClient,
    client: TestClient,
    project: dict[str, Any],
    fake: FakeProvider,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    import app.ai.prompts as prompts

    monkeypatch.setattr(prompts, "CONTEXT_LIMIT", 300)
    ready(admin_client, client, project)
    for key in [
        "p1.objectives.success_criteria.measures",
        "p1.objectives.cost_benefit.budget",
        "p1.objectives.cost_benefit.roi",
    ]:
        client.put(f"{project['base']}/answers/{key}", json={"text": "x" * 150})

    assist(client, project)

    assert "(elenco troncato per lunghezza)" in fake.calls[0][1]["content"]


def test_service_errors_arrive_as_an_error_event_and_are_logged(
    admin_client: TestClient,
    client: TestClient,
    project: dict[str, Any],
    fake: FakeProvider,
    db: Session,
) -> None:
    ready(admin_client, client, project)
    fake.pieces, fake.error = [], "Il modello non ha risposto in tempo: riprova."

    response = assist(client, project)

    assert events(response) == [
        ("error", {"detail": "Il modello non ha risposto in tempo: riprova."})
    ]
    [log] = db.scalars(select(AIRequest)).all()
    assert log.outcome == "error" and log.error is not None


def test_hourly_limit(
    admin_client: TestClient,
    client: TestClient,
    project: dict[str, Any],
    fake: FakeProvider,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(ai_service, "HOURLY_LIMIT", 2)
    ready(admin_client, client, project)

    assert assist(client, project).status_code == 200
    assert assist(client, project).status_code == 200
    assert assist(client, project).status_code == 429
