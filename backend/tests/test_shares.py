from collections.abc import Iterator
from datetime import timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session, sessionmaker

from app.auth import rate_limit
from app.auth.security import token_hash
from app.export.pdf import render_html
from app.models import ShareLink
from app.models.project import utcnow
from app.services.export import iteration_report
from tests.test_export import needs_weasyprint

TEXT = "p1.objectives.business_objectives.problem"


@pytest.fixture
def base(client: TestClient) -> str:
    project = client.post("/api/projects", json={"name": "Churn", "client_name": "ACME"}).json()
    iteration_id = project["iterations"][0]["id"]
    path = f"/api/projects/{project['id']}/iterations/{iteration_id}"
    client.patch(path, json={"user_story": "Come venditore voglio <b>anticipare</b> gli abbandoni"})
    response = client.put(f"{path}/answers/{TEXT}", json={"text": "Ridurre gli abbandoni"})
    assert response.status_code == 200
    return path


def create(client: TestClient, base: str, **fields: object) -> dict[str, object]:
    response = client.post(f"{base}/shares", json={"label": "Mario · ACME", **fields})
    assert response.status_code == 201, response.text
    data: dict[str, object] = response.json()
    return data


def token_of(link: dict[str, object]) -> str:
    return str(link["url"]).rsplit("/s/", 1)[1]


def test_link_is_shown_once_and_only_its_hash_is_stored(
    client: TestClient, base: str, db: Session
) -> None:
    link = create(client, base)
    assert str(link["url"]).startswith("http://localhost:5173/s/")
    token = token_of(link)
    assert len(token) >= 43  # 32 random bytes, URL-safe base64
    assert link["status"] == "active"
    assert link["expires_at"] is None

    stored = db.scalars(select(ShareLink)).one()
    assert stored.token_hash == token_hash(token)
    assert token not in stored.token_hash

    listed = client.get(f"{base}/shares").json()
    assert len(listed) == 1
    assert "url" not in listed[0]
    assert token not in str(listed)


def test_expiry_and_validation(client: TestClient, base: str) -> None:
    link = create(client, base, expires_in_days=7)
    assert link["expires_at"] is not None
    assert client.post(f"{base}/shares", json={"label": " "}).status_code == 422
    assert (
        client.post(f"{base}/shares", json={"label": "X", "expires_in_days": 3}).status_code == 422
    )


def test_shared_page_shows_the_report_read_only(
    client: TestClient, anon_client: TestClient, base: str
) -> None:
    token = token_of(create(client, base))
    response = anon_client.get(f"/s/{token}")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    page = response.text
    assert "Churn" in page and "ACME" in page
    assert "Ridurre gli abbandoni" in page
    assert "Non compilato" in page
    assert "Documento in sola lettura" in page
    assert f'href="/s/{token}/pdf"' in page
    # User input is escaped; the page has no forms, scripts or the consultant's email.
    assert "&lt;b&gt;anticipare&lt;/b&gt;" in page
    assert "<form" not in page and "<script" not in page and "<input" not in page
    assert "consulente@example.com" not in page


def test_shared_page_is_always_up_to_date(
    client: TestClient, anon_client: TestClient, base: str
) -> None:
    token = token_of(create(client, base))
    client.put(f"{base}/answers/{TEXT}", json={"text": "Versione nuova"})
    page = anon_client.get(f"/s/{token}").text
    assert "Versione nuova" in page
    assert "Ridurre gli abbandoni" not in page


def test_security_headers(client: TestClient, anon_client: TestClient, base: str) -> None:
    token = token_of(create(client, base))
    for path in (f"/s/{token}", "/s/sconosciuto"):
        headers = anon_client.get(path).headers
        assert headers["x-robots-tag"] == "noindex, nofollow"
        assert headers["referrer-policy"] == "no-referrer"
        assert headers["cache-control"] == "no-store"
        assert "default-src 'none'" in headers["content-security-policy"]
        assert headers["x-frame-options"] == "DENY"


def test_visits_are_counted(
    client: TestClient, anon_client: TestClient, base: str, db: Session
) -> None:
    token = token_of(create(client, base))
    anon_client.get(f"/s/{token}")
    anon_client.get(f"/s/{token}")
    link = client.get(f"{base}/shares").json()[0]
    assert link["access_count"] == 2
    assert link["last_accessed_at"] is not None


def _assert_unavailable(anon_client: TestClient, token: str) -> None:
    response = anon_client.get(f"/s/{token}")
    assert response.status_code == 404
    assert "Link non valido o non più disponibile" in response.text
    assert anon_client.get(f"/s/{token}/pdf").status_code == 404


def test_unknown_token(anon_client: TestClient) -> None:
    _assert_unavailable(anon_client, "token-inventato")


def test_revoked_link_stops_working(client: TestClient, anon_client: TestClient, base: str) -> None:
    link = create(client, base)
    token = token_of(link)
    revoked = client.post(f"{base}/shares/{link['id']}/revoke")
    assert revoked.status_code == 200
    assert revoked.json()["status"] == "revoked"
    _assert_unavailable(anon_client, token)


def test_expired_link_stops_working(
    client: TestClient, anon_client: TestClient, base: str, db: Session
) -> None:
    link = create(client, base, expires_in_days=7)
    stored = db.get(ShareLink, link["id"])
    assert stored is not None
    stored.expires_at = utcnow() - timedelta(minutes=1)
    db.commit()
    assert client.get(f"{base}/shares").json()[0]["status"] == "expired"
    _assert_unavailable(anon_client, token_of(link))


def test_archived_project_suspends_its_links(
    client: TestClient, anon_client: TestClient, base: str
) -> None:
    token = token_of(create(client, base))
    project_path = base.split("/iterations")[0]
    client.post(f"{project_path}/archive")
    _assert_unavailable(anon_client, token)
    client.post(f"{project_path}/unarchive")
    assert anon_client.get(f"/s/{token}").status_code == 200


def test_deleting_the_project_deletes_its_links(
    client: TestClient, anon_client: TestClient, base: str, db: Session
) -> None:
    token = token_of(create(client, base))
    project_path = base.split("/iterations")[0]
    client.post(f"{project_path}/archive")
    response = client.request("DELETE", project_path, json={"confirm_name": "Churn"})
    assert response.status_code == 204
    assert db.scalars(select(ShareLink)).all() == []
    _assert_unavailable(anon_client, token)


def test_only_inactive_links_can_be_deleted(client: TestClient, base: str) -> None:
    link = create(client, base)
    assert client.delete(f"{base}/shares/{link['id']}").status_code == 409
    client.post(f"{base}/shares/{link['id']}/revoke")
    assert client.delete(f"{base}/shares/{link['id']}").status_code == 204
    assert client.get(f"{base}/shares").json() == []


def test_token_grants_no_access_to_the_api(
    client: TestClient, anon_client: TestClient, base: str
) -> None:
    token = token_of(create(client, base))
    anon_client.get(f"/s/{token}")
    assert anon_client.get(base).status_code == 401
    assert anon_client.put(f"{base}/answers/{TEXT}", json={"text": "x"}).status_code == 401
    assert anon_client.post(f"/s/{token}").status_code == 405
    assert anon_client.put(f"/s/{token}").status_code == 405


def test_other_users_links_are_not_found(
    client: TestClient, other_client: TestClient, base: str
) -> None:
    link = create(client, base)
    assert other_client.get(f"{base}/shares").status_code == 404
    assert other_client.post(f"{base}/shares", json={"label": "X"}).status_code == 404
    assert other_client.post(f"{base}/shares/{link['id']}/revoke").status_code == 404
    assert other_client.delete(f"{base}/shares/{link['id']}").status_code == 404
    assert client.get(f"{base}/shares").json()[0]["status"] == "active"


def test_link_of_another_iteration_is_not_found(client: TestClient, base: str) -> None:
    link = create(client, base)
    project_path = base.split("/iterations")[0]
    other = client.post(f"{project_path}/iterations", json={"title": "Seconda"}).json()
    other_base = f"{project_path}/iterations/{other['id']}"
    assert client.post(f"{other_base}/shares/{link['id']}/revoke").status_code == 404


def test_rate_limit_per_ip(client: TestClient, anon_client: TestClient, base: str) -> None:
    token = token_of(create(client, base))
    for _ in range(rate_limit.shared_pages.limit):
        anon_client.get("/s/tentativo")
    assert anon_client.get(f"/s/{token}").status_code == 429


@needs_weasyprint
def test_shared_pdf(client: TestClient, anon_client: TestClient, base: str) -> None:
    token = token_of(create(client, base))
    response = anon_client.get(f"/s/{token}/pdf")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")
    assert "Churn - Iterazione 1" in response.headers["content-disposition"]
    assert response.headers["x-robots-tag"] == "noindex, nofollow"


def test_the_owners_pdf_has_no_share_bar(client: TestClient, base: str, db: Session) -> None:
    project_id, iteration_id = (int(part) for part in base.split("/")[3::2])
    user_id = client.get("/api/auth/me").json()["id"]
    report = iteration_report(db, project_id, iteration_id, owner_id=user_id, generated_at=utcnow())
    assert 'class="share-bar"' not in render_html(report)


def test_shared_pages_set_no_cookies(
    client: TestClient, sessions: sessionmaker[Session], base: str
) -> None:
    """As the cookie policy says: whoever opens a shared link leaves no trace in the browser."""
    from fastapi.testclient import TestClient as Browser

    from app.db import get_db
    from app.main import create_app

    token = token_of(create(client, base))
    app = create_app()

    def override() -> Iterator[Session]:
        with sessions() as session:
            yield session

    app.dependency_overrides[get_db] = override
    with Browser(app) as visitor:
        for path in (f"/s/{token}", "/s/sconosciuto"):
            assert "set-cookie" not in visitor.get(path).headers
        assert not visitor.cookies
