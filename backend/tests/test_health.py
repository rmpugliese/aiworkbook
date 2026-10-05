from importlib.metadata import version

from fastapi.testclient import TestClient


def test_health_ok(client: TestClient) -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": version("app"), "database": "ok"}


def test_health_degraded_when_database_unreachable(client_without_db: TestClient) -> None:
    response = client_without_db.get("/api/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "degraded"
    assert body["database"] == "error"
    assert body["version"] == version("app")
