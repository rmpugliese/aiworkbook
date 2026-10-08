"""A user never sees or changes another user's data: it looks like it does not exist (404)."""

from fastapi.testclient import TestClient

TEXT = "p1.objectives.business_objectives.problem"


def test_projects_are_private_to_their_owner(client: TestClient, other_client: TestClient) -> None:
    mine = client.post("/api/projects", json={"name": "Mio"}).json()
    other_client.post("/api/projects", json={"name": "Suo"})
    project_url = f"/api/projects/{mine['id']}"
    iteration_url = f"{project_url}/iterations/{mine['iterations'][0]['id']}"
    client.put(f"{iteration_url}/answers/{TEXT}", json={"text": "Riservato"})

    assert [p["name"] for p in client.get("/api/projects").json()] == ["Mio"]
    assert [p["name"] for p in other_client.get("/api/projects").json()] == ["Suo"]

    for method, url, body in [
        ("GET", project_url, None),
        ("PATCH", project_url, {"name": "Rubato"}),
        ("POST", f"{project_url}/archive", None),
        ("DELETE", project_url, {"confirm_name": "Mio"}),
        ("POST", f"{project_url}/iterations", {"title": "Intrusa"}),
        ("GET", iteration_url, None),
        ("PATCH", iteration_url, {"title": "Intrusa"}),
        ("GET", f"{iteration_url}/answers", None),
        ("PUT", f"{iteration_url}/answers/{TEXT}", {"text": "Sovrascritto"}),
        ("GET", f"{iteration_url}/export.pdf", None),
    ]:
        response = other_client.request(method, url, json=body)
        assert response.status_code == 404, (method, url, response.status_code)

    answers = client.get(f"{iteration_url}/answers").json()
    assert answers[0]["text"] == "Riservato"
    assert client.get(project_url).json()["name"] == "Mio"


def test_cannot_copy_an_iteration_from_another_users_project(
    client: TestClient, other_client: TestClient
) -> None:
    mine = client.post("/api/projects", json={"name": "Mio"}).json()
    theirs = other_client.post("/api/projects", json={"name": "Suo"}).json()

    response = client.post(
        f"/api/projects/{mine['id']}/iterations",
        json={"title": "Copia", "copy_from_iteration_id": theirs["iterations"][0]["id"]},
    )

    assert response.status_code == 404


def test_project_api_needs_a_signed_in_user(anon_client: TestClient) -> None:
    assert anon_client.get("/api/projects").status_code == 401
    assert anon_client.post("/api/projects", json={"name": "X"}).status_code == 401
    # Public: health check and the workbook template.
    assert anon_client.get("/api/health").status_code == 200
    assert anon_client.get("/api/template").status_code == 200
