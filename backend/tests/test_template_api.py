from fastapi.testclient import TestClient


def test_get_current_template(client: TestClient) -> None:
    response = client.get("/api/template")

    assert response.status_code == 200
    body = response.json()
    assert body["version"] == 1
    assert len(body["phases"]) == 6


def test_get_template_by_version(client: TestClient) -> None:
    response = client.get("/api/template/1")

    assert response.status_code == 200
    assert response.json()["phases"][0]["title"] == "Comprensione del business"


def test_unknown_template_version_returns_404(client: TestClient) -> None:
    assert client.get("/api/template/99").status_code == 404
