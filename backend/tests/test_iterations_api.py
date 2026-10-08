from typing import Any

from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Answer


def create_project(client: TestClient) -> dict[str, Any]:
    project: dict[str, Any] = client.post("/api/projects", json={"name": "Churn"}).json()
    return project


def create_iteration(client: TestClient, project_id: int, **fields: Any) -> dict[str, Any]:
    response = client.post(
        f"/api/projects/{project_id}/iterations", json={"title": "Nuova", **fields}
    )
    assert response.status_code == 201, response.text
    iteration: dict[str, Any] = response.json()
    return iteration


def test_iterations_are_numbered_per_project(client: TestClient) -> None:
    project = create_project(client)
    other = create_project(client)

    assert create_iteration(client, project["id"])["number"] == 2
    assert create_iteration(client, project["id"])["number"] == 3
    assert create_iteration(client, other["id"])["number"] == 2

    detail = client.get(f"/api/projects/{project['id']}").json()
    assert [i["number"] for i in detail["iterations"]] == [1, 2, 3]
    assert detail["iteration_count"] == 3


def test_new_empty_iteration_has_no_answers(client: TestClient, db: Session) -> None:
    project = create_project(client)
    source_id = project["iterations"][0]["id"]
    db.add(Answer(iteration_id=source_id, question_key="p1.a.b.c", text="Risposta"))
    db.commit()

    iteration = create_iteration(client, project["id"])

    count = db.scalar(select(func.count()).where(Answer.iteration_id == iteration["id"]))
    assert count == 0


def test_copy_duplicates_answers_and_user_story(client: TestClient, db: Session) -> None:
    project = create_project(client)
    source = project["iterations"][0]
    client.patch(
        f"/api/projects/{project['id']}/iterations/{source['id']}",
        json={"user_story": "Come responsabile vendite…"},
    )
    db.add_all(
        [
            Answer(iteration_id=source["id"], question_key="p1.a.b.text", text="Testo"),
            Answer(
                iteration_id=source["id"],
                question_key="p2.gate.decision.outcome",
                verdict="no_go",
                choices=["data_needs_known"],
                return_to_phase=1,
            ),
        ]
    )
    db.commit()

    copy = create_iteration(client, project["id"], copy_from_iteration_id=source["id"])

    assert copy["user_story"] == "Come responsabile vendite…"
    copied = {
        a.question_key: a
        for a in db.scalars(select(Answer).where(Answer.iteration_id == copy["id"]))
    }
    assert copied["p1.a.b.text"].text == "Testo"
    gate = copied["p2.gate.decision.outcome"]
    assert (gate.verdict, gate.choices, gate.return_to_phase) == ("no_go", ["data_needs_known"], 1)


def test_copy_keeps_an_explicit_user_story(client: TestClient) -> None:
    project = create_project(client)
    source = project["iterations"][0]
    client.patch(
        f"/api/projects/{project['id']}/iterations/{source['id']}", json={"user_story": "Vecchia"}
    )

    copy = create_iteration(
        client, project["id"], copy_from_iteration_id=source["id"], user_story="Nuova storia"
    )

    assert copy["user_story"] == "Nuova storia"


def test_cannot_copy_from_another_project(client: TestClient) -> None:
    project = create_project(client)
    other = create_project(client)

    response = client.post(
        f"/api/projects/{project['id']}/iterations",
        json={"title": "Copia", "copy_from_iteration_id": other["iterations"][0]["id"]},
    )

    assert response.status_code == 404


def test_iteration_must_belong_to_the_project(client: TestClient) -> None:
    project = create_project(client)
    other = create_project(client)
    iteration_id = other["iterations"][0]["id"]

    assert client.get(f"/api/projects/{project['id']}/iterations/{iteration_id}").status_code == 404
    assert client.get(f"/api/projects/{other['id']}/iterations/{iteration_id}").status_code == 200


def test_update_iteration(client: TestClient) -> None:
    project = create_project(client)
    iteration = project["iterations"][0]
    url = f"/api/projects/{project['id']}/iterations/{iteration['id']}"

    response = client.patch(url, json={"title": "Pilota", "status": "completed"})

    assert response.status_code == 200
    assert response.json()["title"] == "Pilota"
    assert response.json()["status"] == "completed"
    assert client.patch(url, json={"status": "archived"}).status_code == 422


def test_deleting_a_project_deletes_iterations_and_answers(client: TestClient, db: Session) -> None:
    project = create_project(client)
    iteration_id = project["iterations"][0]["id"]
    db.add(Answer(iteration_id=iteration_id, question_key="p1.a.b.c", text="Risposta"))
    db.commit()
    client.post(f"/api/projects/{project['id']}/archive")

    client.request("DELETE", f"/api/projects/{project['id']}", json={"confirm_name": "Churn"})

    db.expire_all()
    assert db.scalar(select(func.count()).select_from(Answer)) == 0
