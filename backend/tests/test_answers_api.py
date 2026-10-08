from typing import Any

import pytest
from fastapi.testclient import TestClient

TEXT = "p1.objectives.business_objectives.problem"
PATTERNS = "p1.cognitive.ai_patterns.patterns"
FACTOR = "p1.go_no_go.business_feasibility.problem_definition"
GATE_1 = "p1.gate.decision.outcome"
GATE_3 = "p3.gate.decision.outcome"


@pytest.fixture
def base(client: TestClient) -> str:
    project = client.post("/api/projects", json={"name": "Churn"}).json()
    return f"/api/projects/{project['id']}/iterations/{project['iterations'][0]['id']}"


def put(client: TestClient, base: str, key: str, **fields: Any) -> Any:
    return client.put(f"{base}/answers/{key}", json=fields)


def answers(client: TestClient, base: str) -> dict[str, dict[str, Any]]:
    return {a["question_key"]: a for a in client.get(f"{base}/answers").json()}


def test_no_answers_at_first(client: TestClient, base: str) -> None:
    assert client.get(f"{base}/answers").json() == []


def test_save_and_read_each_question_type(client: TestClient, base: str) -> None:
    assert put(client, base, TEXT, text="Ridurre gli abbandoni").status_code == 200
    put(client, base, PATTERNS, choices=["predictive", "anomalies"], text="Note")
    put(client, base, FACTOR, verdict="maybe", text="Da chiarire con il cliente")
    put(client, base, GATE_3, verdict="no_go", choices=["data_ready"], return_to_phase=2)

    saved = answers(client, base)

    assert saved[TEXT]["text"] == "Ridurre gli abbandoni"
    assert saved[PATTERNS]["choices"] == ["predictive", "anomalies"]
    assert (saved[FACTOR]["verdict"], saved[FACTOR]["text"]) == (
        "maybe",
        "Da chiarire con il cliente",
    )
    gate = saved[GATE_3]
    assert (gate["verdict"], gate["choices"], gate["return_to_phase"]) == (
        "no_go",
        ["data_ready"],
        2,
    )


def test_saving_again_replaces_the_answer(client: TestClient, base: str) -> None:
    put(client, base, FACTOR, verdict="go", text="Chiaro")
    put(client, base, FACTOR, verdict="no_go")

    assert answers(client, base)[FACTOR]["verdict"] == "no_go"
    assert answers(client, base)[FACTOR]["text"] is None


def test_empty_answer_is_deleted(client: TestClient, base: str) -> None:
    put(client, base, TEXT, text="Bozza")

    response = put(client, base, TEXT, text="   ")

    assert response.status_code == 200
    assert response.json()["updated_at"] is None
    assert answers(client, base) == {}


def test_unknown_question_returns_404(client: TestClient, base: str) -> None:
    assert put(client, base, "p1.nope.nope.nope", text="x").status_code == 404


@pytest.mark.parametrize(
    ("key", "fields"),
    [
        (TEXT, {"verdict": "go"}),
        (TEXT, {"choices": ["predictive"]}),
        (FACTOR, {"choices": ["x"]}),
        (FACTOR, {"verdict": "yes"}),
        (PATTERNS, {"choices": ["not_a_pattern"]}),
        (PATTERNS, {"choices": ["predictive", "predictive"]}),
        (PATTERNS, {"return_to_phase": 1}),
        (GATE_3, {"choices": ["data_needs_known"]}),  # a phase II criterion
        (GATE_3, {"return_to_phase": 3}),
        (GATE_1, {"return_to_phase": 1}),
        (TEXT, {"text": "x", "extra": 1}),
    ],
)
def test_rejects_fields_the_question_does_not_take(
    client: TestClient, base: str, key: str, fields: dict[str, Any]
) -> None:
    assert put(client, base, key, **fields).status_code == 422


def test_iteration_of_another_project_returns_404(client: TestClient, base: str) -> None:
    other = client.post("/api/projects", json={"name": "Altro"}).json()
    iteration_id = base.rsplit("/", 1)[1]
    wrong = f"/api/projects/{other['id']}/iterations/{iteration_id}"

    assert client.get(f"{wrong}/answers").status_code == 404
    assert put(client, wrong, TEXT, text="x").status_code == 404


def test_saving_updates_iteration_and_project_timestamps(client: TestClient, base: str) -> None:
    project_url = base.split("/iterations/")[0]
    before = client.get(project_url).json()

    put(client, base, TEXT, text="Nuovo testo")

    after = client.get(project_url).json()
    assert after["updated_at"] > before["updated_at"]
    assert after["iterations"][0]["updated_at"] > before["iterations"][0]["updated_at"]
