from typing import Any

from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import email
from app.models import Answer, ProjectMember
from tests.conftest import new_client, sign_in

TEXT = "p1.objectives.business_objectives.problem"
OWNER = "consulente@example.com"
COLLEAGUE = "altro@example.com"


def new_project(client: TestClient) -> tuple[str, str]:
    """A project of the signed-in user: its URL and its first iteration's URL."""
    project = client.post("/api/projects", json={"name": "Churn", "client_name": "ACME"}).json()
    url = f"/api/projects/{project['id']}"
    return url, f"{url}/iterations/{project['iterations'][0]['id']}"


def invite(client: TestClient, url: str, address: str) -> Any:
    return client.post(f"{url}/members", json={"email": address})


def shared_project(client: TestClient, other_client: TestClient) -> tuple[str, str]:
    url, iteration = new_project(client)
    assert invite(client, url, COLLEAGUE).status_code == 201
    return url, iteration


# --- Inviting ---------------------------------------------------------------------------


def test_invited_colleague_sees_the_shared_project(
    client: TestClient, other_client: TestClient
) -> None:
    client.patch("/api/auth/me", json={"display_name": "Roberto"})
    url, _ = new_project(client)
    response = invite(client, url, " Altro@Example.com ")

    assert response.status_code == 201
    assert response.json()["notified"] is True
    assert response.json()["member"]["pending"] is False
    assert email.outbox[-1].to == COLLEAGUE
    assert "Roberto ti ha aggiunto" in email.outbox[-1].subject

    [listed] = other_client.get("/api/projects").json()
    assert listed["name"] == "Churn" and listed["shared_by"] == "Roberto"
    assert other_client.get(url).json()["shared_by"] == "Roberto"
    assert client.get("/api/projects").json()[0]["shared_by"] is None

    members = other_client.get(f"{url}/members").json()
    assert members["owner"]["email"] == OWNER
    assert [m["email"] for m in members["members"]] == [COLLEAGUE]
    assert members["can_manage"] is False and members["limit"] == 5


def test_an_unknown_address_gets_access_only_after_confirming_it(
    client: TestClient, sessions: Any
) -> None:
    url, _ = new_project(client)
    response = invite(client, url, "nuova@example.com")
    assert response.json()["member"]["pending"] is True
    assert "iscriviti" in email.outbox[-1].text

    with new_client(sessions) as newcomer:
        newcomer.post(
            "/api/auth/register",
            json={
                "email": "nuova@example.com",
                "password": "password-molto-lunga",
                "accept_terms": True,
            },
        )
        token = email.outbox[-1].text.split("token=")[1].split()[0]
        assert newcomer.post("/api/auth/verify-email", json={"token": token}).status_code == 200
        assert [p["name"] for p in newcomer.get("/api/projects").json()] == ["Churn"]
    assert client.get(f"{url}/members").json()["members"][0]["pending"] is False


def test_an_unconfirmed_account_gets_no_access(client: TestClient, sessions: Any) -> None:
    from app.services.auth import register

    with sessions() as db:
        register(db, "lenta@example.com", "password-molto-lunga", None)
    url, _ = new_project(client)
    assert invite(client, url, "lenta@example.com").json()["member"]["pending"] is True


def test_invitation_limits(client: TestClient) -> None:
    url, _ = new_project(client)
    assert invite(client, url, OWNER).status_code == 422
    for n in range(5):
        assert invite(client, url, f"collega{n}@example.com").status_code == 201
    assert invite(client, url, "collega0@example.com").status_code == 409
    assert invite(client, url, "sesto@example.com").status_code == 409
    assert invite(client, url, "non-una-email").status_code == 422


# --- What a collaborator can do ---------------------------------------------------------


def test_collaborator_works_on_the_workbook(client: TestClient, other_client: TestClient) -> None:
    url, iteration = shared_project(client, other_client)

    saved = other_client.put(f"{iteration}/answers/{TEXT}", json={"text": "Ridurre gli abbandoni"})
    assert saved.status_code == 200
    assert other_client.get(f"{iteration}/answers").status_code == 200
    assert other_client.patch(iteration, json={"user_story": "Come analista"}).status_code == 200
    assert other_client.post(f"{url}/iterations", json={"title": "Seconda"}).status_code == 201
    assert other_client.get(f"{url}/export").status_code == 200
    # The assistant answers the collaborator (here: not configured), not "no such project".
    assist = {"question_key": TEXT, "action": "suggest"}
    assert other_client.post(f"{iteration}/assist", json=assist).status_code == 409


def test_collaborator_cannot_do_what_belongs_to_the_owner(
    client: TestClient, other_client: TestClient
) -> None:
    url, iteration = shared_project(client, other_client)

    assert other_client.patch(url, json={"name": "Altro"}).status_code == 404
    assert other_client.post(f"{url}/archive").status_code == 404
    assert other_client.post(f"{url}/ai/enable").status_code == 404
    assert client.post(f"{url}/ai/enable").status_code == 200
    assert other_client.post(f"{url}/ai/disable").status_code == 404
    assert other_client.get(f"{iteration}/shares").status_code == 404
    assert other_client.post(f"{iteration}/shares", json={"label": "x"}).status_code == 404
    assert invite(other_client, url, "terzo@example.com").status_code == 404
    owner_project = client.get(url).json()
    assert owner_project["name"] == "Churn" and owner_project["archived_at"] is None
    assert owner_project["ai_enabled_at"] is not None

    client.post(f"{url}/archive")
    delete = {"confirm_name": "Churn"}
    assert other_client.request("DELETE", url, json=delete).status_code == 404
    assert other_client.post(f"{url}/unarchive").status_code == 404
    assert client.request("DELETE", url, json=delete).status_code == 204


def test_strangers_still_see_nothing(client: TestClient, sessions: Any, db: Session) -> None:
    from tests.conftest import make_user

    url, iteration = new_project(client)
    invite(client, url, COLLEAGUE)
    make_user(db, "estraneo@example.com")
    with new_client(sessions) as stranger:
        sign_in(stranger, "estraneo@example.com")
        assert stranger.get("/api/projects").json() == []
        assert stranger.get(url).status_code == 404
        assert stranger.get(f"{iteration}/answers").status_code == 404
        assert stranger.get(f"{url}/members").status_code == 404


# --- Leaving and removing ---------------------------------------------------------------


def test_removed_or_leaving_collaborators_lose_access(
    client: TestClient, other_client: TestClient
) -> None:
    url, _ = shared_project(client, other_client)
    member_id = client.get(f"{url}/members").json()["members"][0]["id"]

    assert other_client.delete(f"{url}/members/{member_id}").status_code == 204  # leaves
    assert other_client.get(url).status_code == 404

    invite(client, url, COLLEAGUE)
    member_id = client.get(f"{url}/members").json()["members"][0]["id"]
    assert client.delete(f"{url}/members/{member_id}").status_code == 204  # removed
    assert other_client.get(url).status_code == 404


def test_a_collaborator_cannot_remove_others(client: TestClient, other_client: TestClient) -> None:
    url, _ = shared_project(client, other_client)
    invite(client, url, "terzo@example.com")
    third = client.get(f"{url}/members").json()["members"][1]["id"]
    assert other_client.delete(f"{url}/members/{third}").status_code == 404


def test_deleting_the_collaborator_account_keeps_the_answers(
    client: TestClient, other_client: TestClient, db: Session
) -> None:
    url, iteration = shared_project(client, other_client)
    other_client.put(f"{iteration}/answers/{TEXT}", json={"text": "Scritta dal collega"})
    other_client.request("DELETE", "/api/auth/me", json={"confirm_email": COLLEAGUE})

    [answer] = client.get(f"{iteration}/answers").json()
    assert answer["text"] == "Scritta dal collega" and answer["updated_by_id"] is None
    assert db.scalar(select(func.count()).select_from(ProjectMember)) == 0


# --- Who changed what, and conflicts ----------------------------------------------------


def test_answers_record_their_last_author(client: TestClient, other_client: TestClient) -> None:
    other_client.patch("/api/auth/me", json={"display_name": "Mario"})
    _, iteration = shared_project(client, other_client)
    other_client.put(f"{iteration}/answers/{TEXT}", json={"text": "Bozza"})

    [answer] = client.get(f"{iteration}/answers").json()
    assert answer["updated_by_name"] == "Mario"
    assert answer["updated_by_id"] == other_client.get("/api/auth/me").json()["id"]


def test_a_newer_answer_by_someone_else_is_a_conflict(
    client: TestClient, other_client: TestClient, db: Session
) -> None:
    _, iteration = shared_project(client, other_client)
    first = client.put(f"{iteration}/answers/{TEXT}", json={"text": "Versione del proprietario"})
    base = first.json()["updated_at"]

    # The colleague starts from that version and saves.
    theirs = other_client.put(
        f"{iteration}/answers/{TEXT}",
        json={"text": "Versione del collega", "base_updated_at": base},
    )
    assert theirs.status_code == 200

    # The owner, still on the old version, is stopped and shown the colleague's text.
    mine = client.put(
        f"{iteration}/answers/{TEXT}", json={"text": "Mia modifica", "base_updated_at": base}
    )
    assert mine.status_code == 409
    assert mine.json()["current"]["text"] == "Versione del collega"
    assert db.scalar(select(Answer.text)) == "Versione del collega"

    # Keeping their own version means saving again from the colleague's.
    kept = client.put(
        f"{iteration}/answers/{TEXT}",
        json={"text": "Mia modifica", "base_updated_at": theirs.json()["updated_at"]},
    )
    assert kept.status_code == 200


def test_no_conflict_with_yourself_or_without_a_base(
    client: TestClient, other_client: TestClient
) -> None:
    _, iteration = shared_project(client, other_client)
    first = client.put(f"{iteration}/answers/{TEXT}", json={"text": "Uno"})
    client.put(f"{iteration}/answers/{TEXT}", json={"text": "Due"})
    stale = {"text": "Tre", "base_updated_at": first.json()["updated_at"]}
    assert client.put(f"{iteration}/answers/{TEXT}", json=stale).status_code == 200

    # A first answer written meanwhile by the colleague, while I started from none.
    other_client.put(f"{iteration}/answers/p1.objectives.cost_benefit.roi", json={"text": "Suo"})
    fresh = {"text": "Mio", "base_updated_at": None}
    assert (
        client.put(f"{iteration}/answers/p1.objectives.cost_benefit.roi", json=fresh).status_code
        == 409
    )
    assert (
        client.put(
            f"{iteration}/answers/p1.objectives.cost_benefit.roi", json={"text": "Mio"}
        ).status_code
        == 200
    )
