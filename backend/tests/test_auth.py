import re
from datetime import timedelta
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import email
from app.auth.web import CSRF_HEADER, SESSION_COOKIE
from app.cli import main as cli_main
from app.models import EmailToken, Iteration, Project, User
from app.models import Session as UserSession
from app.models.project import utcnow
from tests.conftest import PASSWORD, make_user

NEW = {"email": "Nuova@Example.com", "password": "password-molto-lunga", "display_name": "Ada"}


def link_token(path: str) -> str:
    """The token from the last email's link to `path`."""
    match = re.search(rf"{path}\?token=([\w-]+)", email.outbox[-1].text)
    assert match, email.outbox[-1].text
    return match.group(1)


def register(client: TestClient, **fields: Any) -> Any:
    return client.post("/api/auth/register", json={**NEW, **fields})


def login(client: TestClient, address: str, password: str = PASSWORD) -> Any:
    return client.post("/api/auth/login", json={"email": address, "password": password})


# --- Sign-up and confirmation -----------------------------------------------------------


def test_register_sends_a_confirmation_link_and_does_not_sign_in(anon_client: TestClient) -> None:
    response = register(anon_client)

    assert response.status_code == 202
    assert email.outbox[-1].to == "nuova@example.com"
    assert "/verify-email?token=" in email.outbox[-1].text
    assert anon_client.get("/api/auth/me").status_code == 401


def test_registering_a_taken_address_looks_the_same_but_warns_the_owner(
    anon_client: TestClient, db: Session
) -> None:
    make_user(db, "nuova@example.com")

    response = register(anon_client)

    assert response.status_code == 202
    assert response.json() == register(anon_client, email="libera@example.com").json()
    assert email.outbox[0].subject == "Hai già un account"


def test_password_must_be_long_enough(anon_client: TestClient) -> None:
    assert register(anon_client, password="corta").status_code == 422


def test_confirming_signs_in_and_works_only_once(anon_client: TestClient) -> None:
    register(anon_client)
    token = link_token("/verify-email")

    response = anon_client.post("/api/auth/verify-email", json={"token": token})

    assert response.status_code == 200
    assert response.json()["email"] == "nuova@example.com"
    assert response.json()["display_name"] == "Ada"
    assert anon_client.get("/api/auth/me").status_code == 200
    assert anon_client.post("/api/auth/verify-email", json={"token": token}).status_code == 400


def test_expired_confirmation_link_is_rejected(anon_client: TestClient, db: Session) -> None:
    register(anon_client)
    token = link_token("/verify-email")
    for record in db.scalars(select(EmailToken)):
        record.expires_at = utcnow() - timedelta(minutes=1)
    db.commit()

    assert anon_client.post("/api/auth/verify-email", json={"token": token}).status_code == 400


def test_login_needs_a_confirmed_email(anon_client: TestClient) -> None:
    register(anon_client)

    assert login(anon_client, NEW["email"], NEW["password"]).status_code == 403
    anon_client.post("/api/auth/resend-verification", json={"email": NEW["email"]})
    anon_client.post("/api/auth/verify-email", json={"token": link_token("/verify-email")})
    assert login(anon_client, NEW["email"], NEW["password"]).status_code == 200


# --- Sign-in, sessions ------------------------------------------------------------------


def test_wrong_credentials_get_the_same_generic_error(anon_client: TestClient, db: Session) -> None:
    make_user(db)

    wrong_password = login(anon_client, "consulente@example.com", "password-sbagliata")
    unknown_email = login(anon_client, "nessuno@example.com")

    assert wrong_password.status_code == unknown_email.status_code == 401
    assert wrong_password.json() == unknown_email.json()


def test_login_is_case_insensitive_and_sets_an_httponly_cookie(
    anon_client: TestClient, db: Session
) -> None:
    make_user(db)

    response = login(anon_client, "Consulente@Example.com")

    assert response.status_code == 200
    cookie = response.headers["set-cookie"]
    assert cookie.startswith(f"{SESSION_COOKIE}=") and "HttpOnly" in cookie
    assert "samesite=lax" in cookie.lower()


def test_logout_ends_the_session(client: TestClient) -> None:
    assert client.post("/api/auth/logout").status_code == 204
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/projects").status_code == 401


def test_expired_session_is_rejected(client: TestClient, db: Session) -> None:
    for session in db.scalars(select(UserSession)):
        session.expires_at = utcnow() - timedelta(seconds=1)
    db.commit()

    assert client.get("/api/auth/me").status_code == 401


def test_session_is_extended_while_in_use(client: TestClient, db: Session) -> None:
    [session] = db.scalars(select(UserSession)).all()
    session.last_seen_at = utcnow() - timedelta(days=2)
    session.expires_at = utcnow() + timedelta(days=1)
    db.commit()

    client.get("/api/auth/me")

    db.expire_all()
    assert session.expires_at.replace(tzinfo=None) > (utcnow() + timedelta(days=29)).replace(
        tzinfo=None
    )


def test_the_database_stores_only_a_hash_of_the_session_token(
    client: TestClient, db: Session
) -> None:
    token = client.cookies[SESSION_COOKIE]

    [session] = db.scalars(select(UserSession)).all()
    assert session.id != token and len(session.id) == 64


# --- Password reset ---------------------------------------------------------------------


def test_password_reset_changes_the_password_and_ends_other_sessions(
    client: TestClient, anon_client: TestClient
) -> None:
    anon_client.post("/api/auth/password-reset/request", json={"email": "consulente@example.com"})
    token = link_token("/reset-password")

    payload = {"token": token, "password": "nuova-password-sicura"}
    response = anon_client.post("/api/auth/password-reset/confirm", json=payload)

    assert response.status_code == 204
    assert client.get("/api/auth/me").status_code == 401  # the other session is gone
    assert login(anon_client, "consulente@example.com").status_code == 401
    assert login(anon_client, "consulente@example.com", "nuova-password-sicura").status_code == 200
    assert anon_client.post("/api/auth/password-reset/confirm", json=payload).status_code == 400


def test_reset_request_for_an_unknown_address_looks_the_same(anon_client: TestClient) -> None:
    response = anon_client.post(
        "/api/auth/password-reset/request", json={"email": "nessuno@example.com"}
    )

    assert response.status_code == 202
    assert email.outbox == []


# --- CSRF and rate limiting -------------------------------------------------------------


@pytest.mark.parametrize("header", [None, "valore-diverso"])
def test_unsafe_requests_need_the_csrf_header(client: TestClient, header: str | None) -> None:
    if header is None:
        del client.headers[CSRF_HEADER]
    else:
        client.headers[CSRF_HEADER] = header

    assert client.post("/api/projects", json={"name": "X"}).status_code == 403
    assert client.get("/api/projects").status_code == 200  # reads are not affected


def test_repeated_failed_logins_are_throttled(anon_client: TestClient, db: Session) -> None:
    make_user(db)
    for _ in range(5):
        assert login(anon_client, "consulente@example.com", "password-sbagliata").status_code == 401

    assert login(anon_client, "consulente@example.com").status_code == 429


def test_email_requests_are_throttled(anon_client: TestClient) -> None:
    for index in range(5):
        assert register(anon_client, email=f"u{index}@example.com").status_code == 202

    assert register(anon_client, email="u5@example.com").status_code == 429


# --- Ownership of local projects ----------------------------------------------------------


def test_the_first_confirmed_user_takes_over_projects_from_local_mode(
    anon_client: TestClient, db: Session
) -> None:
    edited = utcnow() - timedelta(days=3)
    project = Project(name="Progetto locale", updated_at=edited)
    project.iterations.append(
        Iteration(number=1, title="Iterazione 1", template_version=1, status="draft")
    )
    db.add(project)
    db.commit()
    register(anon_client)

    anon_client.post("/api/auth/verify-email", json={"token": link_token("/verify-email")})

    [listed] = anon_client.get("/api/projects").json()
    assert (listed["name"], listed["iteration_count"]) == ("Progetto locale", 1)
    assert listed["updated_at"].startswith(edited.date().isoformat())


def test_later_users_do_not_get_local_projects(
    client: TestClient, anon_client: TestClient, db: Session
) -> None:
    db.add(Project(name="Progetto orfano"))
    db.commit()
    register(anon_client)

    anon_client.post("/api/auth/verify-email", json={"token": link_token("/verify-email")})

    assert anon_client.get("/api/projects").json() == []


# --- Google -------------------------------------------------------------------------------


GOOGLE = {"sub": "google-123", "email": "Ada@Example.com", "email_verified": True, "name": "Ada L."}


def test_google_creates_a_confirmed_account(db: Session) -> None:
    from app.services.auth import sign_in_with_google

    new_session = sign_in_with_google(db, GOOGLE)

    user = new_session.session.user
    assert (user.email, user.display_name, user.google_sub) == (
        "ada@example.com",
        "Ada L.",
        "google-123",
    )
    assert user.email_verified_at is not None and user.password_hash is None


def test_google_links_an_existing_unconfirmed_account(db: Session) -> None:
    from app.services.auth import sign_in_with_google

    existing = make_user(db, "ada@example.com", verified=False)

    user = sign_in_with_google(db, GOOGLE).session.user

    assert user.id == existing.id and user.google_sub == "google-123"
    assert user.email_verified_at is not None


def test_google_without_a_verified_email_is_refused(db: Session) -> None:
    from app.services.auth import sign_in_with_google
    from app.services.errors import ConflictError

    with pytest.raises(ConflictError):
        sign_in_with_google(db, {**GOOGLE, "email_verified": False})
    assert db.scalar(select(User)) is None


def test_google_callback_signs_in_and_redirects_home(
    anon_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app.config import get_settings
    from app.routers import auth as auth_router

    settings = get_settings()
    monkeypatch.setattr(settings, "google_client_id", "id")
    monkeypatch.setattr(settings, "google_client_secret", "secret")

    class FakeGoogle:
        async def authorize_access_token(self, request: object) -> dict[str, object]:
            return {"userinfo": GOOGLE}

    monkeypatch.setattr(auth_router, "_google", lambda: FakeGoogle())

    response = anon_client.get("/api/auth/google/callback", follow_redirects=False)

    assert response.status_code == 303
    assert response.headers["location"] == f"{settings.public_url}/"
    assert anon_client.get("/api/auth/me").json()["email"] == "ada@example.com"
    assert anon_client.get("/api/auth/providers").json() == {"google": True}


def test_google_is_hidden_when_not_configured(anon_client: TestClient) -> None:
    assert anon_client.get("/api/auth/providers").json() == {"google": False}
    assert anon_client.get("/api/auth/google/login").status_code == 404


# --- CLI ----------------------------------------------------------------------------------


def test_cli_creates_a_confirmed_user(
    monkeypatch: pytest.MonkeyPatch, sessions: Any, db: Session, capsys: pytest.CaptureFixture[str]
) -> None:
    import app.cli

    monkeypatch.setattr(app.cli, "SessionLocal", sessions)

    cli_main(["create-user", "--email", "Cli@Example.com", "--password", PASSWORD, "--verified"])

    assert "Created user cli@example.com" in capsys.readouterr().out
    user = db.scalar(select(User).where(User.email == "cli@example.com"))
    assert user is not None and user.email_verified_at is not None
