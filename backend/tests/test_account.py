import json
from datetime import timedelta

from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session, sessionmaker

from app.legal import TERMS_VERSION
from app.models import AIRequest, Answer, EmailToken, Iteration, Project, ShareLink, User
from app.models import Session as UserSession
from app.models.project import utcnow
from app.services import account
from tests.conftest import make_user, new_client, sign_in

TEXT = "p1.objectives.business_objectives.problem"
SIGN_UP = {"email": "nuovo@example.com", "password": "password-molto-lunga"}


def seed_project(client: TestClient) -> str:
    project = client.post("/api/projects", json={"name": "Churn", "client_name": "ACME"}).json()
    base = f"/api/projects/{project['id']}/iterations/{project['iterations'][0]['id']}"
    client.put(f"{base}/answers/{TEXT}", json={"text": "Ridurre gli abbandoni"})
    client.post(f"{base}/shares", json={"label": "Cliente ACME"})
    return base


def count(db: Session, model: type) -> int:
    return db.scalar(select(func.count()).select_from(model)) or 0


# Terms


def test_sign_up_requires_accepting_the_terms(anon_client: TestClient, db: Session) -> None:
    assert anon_client.post("/api/auth/register", json=SIGN_UP).status_code == 422
    response = anon_client.post("/api/auth/register", json={**SIGN_UP, "accept_terms": False})
    assert response.status_code == 422
    assert (
        anon_client.post("/api/auth/register", json={**SIGN_UP, "accept_terms": True}).status_code
        == 202
    )
    user = db.scalars(select(User).where(User.email == "nuovo@example.com")).one()
    assert user.terms_version == TERMS_VERSION
    assert user.terms_accepted_at is not None


def test_users_without_the_current_terms_must_accept_them(
    sessions: sessionmaker[Session], db: Session
) -> None:
    user = make_user(db, "vecchio@example.com")
    user.terms_version = "2020-01-01"
    db.commit()
    with new_client(sessions) as client:
        sign_in(client, "vecchio@example.com")
        assert client.get("/api/auth/me").json()["terms_current"] is False
        accepted = client.post("/api/auth/me/accept-terms").json()
        assert accepted["terms_current"] is True
    db.refresh(user)
    assert user.terms_version == TERMS_VERSION


# Export


def test_export_contains_all_and_only_the_users_data(
    client: TestClient, other_client: TestClient
) -> None:
    seed_project(client)
    other_client.post("/api/projects", json={"name": "Progetto altrui"})
    client.patch("/api/auth/me", json={"brand_color": "#1d4f7a"})

    response = client.get("/api/auth/me/export")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/json")
    assert response.headers["content-disposition"].startswith("attachment;")
    assert response.headers["cache-control"] == "no-store"
    data = json.loads(response.content)

    assert data["account"]["email"] == "consulente@example.com"
    assert data["brand"]["color"] == "#1d4f7a"
    assert [p["name"] for p in data["projects"]] == ["Churn"]
    iteration = data["projects"][0]["iterations"][0]
    assert iteration["answers"][0] == {
        **iteration["answers"][0],
        "question_key": TEXT,
        "text": "Ridurre gli abbandoni",
    }
    assert iteration["share_links"][0]["label"] == "Cliente ACME"
    # No secrets: neither hashes nor tokens.
    raw = response.text
    assert "password" not in raw and "token" not in raw and "hash" not in raw
    assert "Progetto altrui" not in raw


def test_export_requires_a_session(anon_client: TestClient) -> None:
    assert anon_client.get("/api/auth/me/export").status_code == 401


# Deletion


def test_delete_account_needs_the_right_email(client: TestClient) -> None:
    response = client.request("DELETE", "/api/auth/me", json={"confirm_email": "altro@x.it"})
    assert response.status_code == 422
    assert client.get("/api/auth/me").status_code == 200


def test_delete_account_removes_everything_it_owns(
    client: TestClient, other_client: TestClient, db: Session
) -> None:
    seed_project(client)
    other_base = seed_project(other_client)
    db.add(
        AIRequest(
            user_id=client.get("/api/auth/me").json()["id"],
            question_key=TEXT,
            action="suggest",
            model="m",
        )
    )
    db.commit()

    response = client.request(
        "DELETE", "/api/auth/me", json={"confirm_email": " Consulente@Example.com "}
    )
    assert response.status_code == 204
    assert client.get("/api/auth/me").status_code == 401  # signed out

    db.expire_all()
    emails = db.scalars(select(User.email)).all()
    assert emails == ["altro@example.com"]
    assert count(db, Project) == 1
    assert count(db, Iteration) == 1
    assert count(db, Answer) == 1
    assert count(db, ShareLink) == 1
    assert count(db, AIRequest) == 0
    assert db.scalars(select(UserSession.user_id)).all() == [db.scalars(select(User.id)).one()]
    # The other user's work is untouched.
    assert other_client.get(f"{other_base}/answers").json()[0]["text"] == "Ridurre gli abbandoni"


def test_the_only_administrator_cannot_delete_their_account(
    admin_client: TestClient, db: Session
) -> None:
    response = admin_client.request(
        "DELETE", "/api/auth/me", json={"confirm_email": "admin@example.com"}
    )
    assert response.status_code == 409
    make_user(db, "secondo-admin@example.com", admin=True)
    response = admin_client.request(
        "DELETE", "/api/auth/me", json={"confirm_email": "admin@example.com"}
    )
    assert response.status_code == 204


# Retention


def test_cleanup_removes_only_what_has_expired(db: Session) -> None:
    user = make_user(db)
    now = utcnow()
    db.add_all(
        [
            UserSession(id="a" * 64, user_id=user.id, expires_at=now - timedelta(days=1)),
            UserSession(id="b" * 64, user_id=user.id, expires_at=now + timedelta(days=1)),
            EmailToken(
                user_id=user.id,
                purpose="verify_email",
                token_hash="1" * 64,
                expires_at=now + timedelta(days=1),
                used_at=now,
            ),
            EmailToken(
                user_id=user.id,
                purpose="verify_email",
                token_hash="2" * 64,
                expires_at=now - timedelta(hours=1),
            ),
            EmailToken(
                user_id=user.id,
                purpose="reset_password",
                token_hash="3" * 64,
                expires_at=now + timedelta(hours=1),
            ),
            AIRequest(
                user_id=user.id,
                question_key=TEXT,
                action="suggest",
                model="m",
                created_at=now - timedelta(days=400),
            ),
            AIRequest(
                user_id=user.id,
                question_key=TEXT,
                action="suggest",
                model="m",
                created_at=now - timedelta(days=10),
            ),
        ]
    )
    db.commit()

    assert account.cleanup(db) == {"sessions": 1, "email_tokens": 2, "ai_requests": 1}
    assert db.scalars(select(UserSession.id)).all() == ["b" * 64]
    assert db.scalars(select(EmailToken.token_hash)).all() == ["3" * 64]
    assert count(db, AIRequest) == 1
