from typing import Any

from fastapi.testclient import TestClient


def create_project(client: TestClient, **fields: Any) -> dict[str, Any]:
    response = client.post("/api/projects", json={"name": "Churn", **fields})
    assert response.status_code == 201, response.text
    project: dict[str, Any] = response.json()
    return project


def delete(client: TestClient, project_id: int, confirm_name: str) -> int:
    response = client.request(
        "DELETE", f"/api/projects/{project_id}", json={"confirm_name": confirm_name}
    )
    return response.status_code


def test_create_project_also_creates_the_first_iteration(client: TestClient) -> None:
    project = create_project(client, client_name="ACME", description="Previsione abbandoni")

    assert project["name"] == "Churn"
    assert project["client_name"] == "ACME"
    assert project["archived_at"] is None
    assert project["iteration_count"] == 1
    [iteration] = project["iterations"]
    assert iteration["number"] == 1
    assert iteration["title"] == "Iterazione 1"
    assert iteration["template_version"] == 1
    assert iteration["status"] == "draft"


def test_project_name_is_trimmed_and_required(client: TestClient) -> None:
    assert create_project(client, name="  Churn  ")["name"] == "Churn"
    assert client.post("/api/projects", json={"name": "   "}).status_code == 422
    assert client.post("/api/projects", json={"name": "x" * 201}).status_code == 422
    assert client.post("/api/projects", json={"name": "A", "owner": 1}).status_code == 422


def test_list_returns_active_projects_most_recent_first(client: TestClient) -> None:
    first = create_project(client, name="Primo")
    second = create_project(client, name="Secondo")
    client.patch(f"/api/projects/{first['id']}", json={"description": "aggiornato"})

    names = [project["name"] for project in client.get("/api/projects").json()]

    assert names == ["Primo", "Secondo"]
    assert second["id"] != first["id"]


def test_update_project(client: TestClient) -> None:
    project = create_project(client, client_name="ACME")

    response = client.patch(
        f"/api/projects/{project['id']}", json={"name": "Churn 2026", "client_name": ""}
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Churn 2026"
    assert response.json()["client_name"] is None


def test_archive_and_unarchive(client: TestClient) -> None:
    project = create_project(client)

    archived = client.post(f"/api/projects/{project['id']}/archive").json()
    assert archived["archived_at"] is not None
    assert client.get("/api/projects").json() == []
    assert [p["id"] for p in client.get("/api/projects?archived=true").json()] == [project["id"]]

    client.post(f"/api/projects/{project['id']}/unarchive")
    assert [p["id"] for p in client.get("/api/projects").json()] == [project["id"]]


def test_delete_requires_archiving_and_the_exact_name(client: TestClient) -> None:
    project = create_project(client)

    assert delete(client, project["id"], "Churn") == 409
    client.post(f"/api/projects/{project['id']}/archive")
    assert delete(client, project["id"], "churn") == 422
    assert delete(client, project["id"], "Churn") == 204
    assert client.get(f"/api/projects/{project['id']}").status_code == 404


def test_unknown_project_returns_404(client: TestClient) -> None:
    assert client.get("/api/projects/999").status_code == 404
    assert client.patch("/api/projects/999", json={"name": "X"}).status_code == 404
    assert client.post("/api/projects/999/archive").status_code == 404


def test_timestamps_are_returned_in_utc(client: TestClient) -> None:
    project = create_project(client)

    assert project["created_at"].endswith("Z") or project["created_at"].endswith("+00:00")
