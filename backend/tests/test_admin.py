from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import email
from app.cli import main as cli_main
from app.models import User
from tests.conftest import PASSWORD, make_user
from tests.test_auth import link_token, register


def users_by_email(admin_client: TestClient) -> dict[str, dict[str, Any]]:
    response = admin_client.get("/api/admin/users")
    assert response.status_code == 200
    return {user["email"]: user for user in response.json()}


def login(client: TestClient, address: str) -> int:
    response = client.post("/api/auth/login", json={"email": address, "password": PASSWORD})
    return response.status_code


def test_the_first_confirmed_account_becomes_administrator(anon_client: TestClient) -> None:
    register(anon_client)
    response = anon_client.post(
        "/api/auth/verify-email", json={"token": link_token("/verify-email")}
    )

    assert response.json()["is_admin"] is True


def test_later_accounts_are_not_administrators(client: TestClient, anon_client: TestClient) -> None:
    register(anon_client)
    response = anon_client.post(
        "/api/auth/verify-email", json={"token": link_token("/verify-email")}
    )

    assert response.json()["is_admin"] is False
    assert client.get("/api/auth/me").json()["is_admin"] is False


def test_admin_api_is_reserved_to_administrators(
    client: TestClient, anon_client: TestClient
) -> None:
    assert client.get("/api/admin/users").status_code == 403
    assert anon_client.get("/api/admin/users").status_code == 401


def test_lists_accounts_with_their_activity(
    admin_client: TestClient, client: TestClient, db: Session
) -> None:
    client.post("/api/projects", json={"name": "Primo"})
    client.post("/api/projects", json={"name": "Secondo"})
    make_user(db, "nuovo@example.com", verified=False)

    users = users_by_email(admin_client)

    assert set(users) == {"admin@example.com", "consulente@example.com", "nuovo@example.com"}
    assert users["consulente@example.com"]["project_count"] == 2
    assert users["consulente@example.com"]["last_seen_at"] is not None
    assert users["nuovo@example.com"]["email_verified_at"] is None
    assert users["admin@example.com"]["is_admin"] is True


def test_admin_confirms_an_email_by_hand(
    admin_client: TestClient, anon_client: TestClient, db: Session
) -> None:
    user = make_user(db, "nuovo@example.com", verified=False)
    assert login(anon_client, "nuovo@example.com") == 403

    response = admin_client.post(f"/api/admin/users/{user.id}/confirm-email")

    assert response.json()["email_verified_at"] is not None
    assert login(anon_client, "nuovo@example.com") == 200


def test_suspension_signs_out_and_blocks_sign_in_until_reactivated(
    admin_client: TestClient, client: TestClient, anon_client: TestClient
) -> None:
    target = users_by_email(admin_client)["consulente@example.com"]["id"]

    suspended = admin_client.post(f"/api/admin/users/{target}/suspend")

    assert suspended.json()["suspended_at"] is not None
    assert client.get("/api/auth/me").status_code == 401  # signed out at once
    assert login(anon_client, "consulente@example.com") == 423

    admin_client.post(f"/api/admin/users/{target}/reactivate")
    assert login(anon_client, "consulente@example.com") == 200


def test_admin_cannot_suspend_their_own_account(admin_client: TestClient) -> None:
    me = admin_client.get("/api/auth/me").json()["id"]

    assert admin_client.post(f"/api/admin/users/{me}/suspend").status_code == 409


def test_admin_resends_the_confirmation_link(admin_client: TestClient, db: Session) -> None:
    pending = make_user(db, "nuovo@example.com", verified=False)
    confirmed = make_user(db, "attivo@example.com")

    sent = admin_client.post(f"/api/admin/users/{pending.id}/resend-verification")

    assert sent.status_code == 204
    assert email.outbox[-1].to == "nuovo@example.com"
    resend = admin_client.post(f"/api/admin/users/{confirmed.id}/resend-verification")
    assert resend.status_code == 409


def test_unknown_user_returns_404(admin_client: TestClient) -> None:
    assert admin_client.post("/api/admin/users/999/suspend").status_code == 404


def test_administrators_do_not_see_other_users_projects(
    admin_client: TestClient, client: TestClient
) -> None:
    project = client.post("/api/projects", json={"name": "Riservato"}).json()

    assert admin_client.get("/api/projects").json() == []
    assert admin_client.get(f"/api/projects/{project['id']}").status_code == 404


def test_cli_makes_an_existing_user_administrator(
    monkeypatch: pytest.MonkeyPatch, sessions: Any, db: Session
) -> None:
    import app.cli

    monkeypatch.setattr(app.cli, "SessionLocal", sessions)
    make_user(db, "futuro.admin@example.com")

    cli_main(["make-admin", "--email", "Futuro.Admin@example.com"])

    db.expire_all()
    user = db.scalar(select(User).where(User.email == "futuro.admin@example.com"))
    assert user is not None and user.is_admin
