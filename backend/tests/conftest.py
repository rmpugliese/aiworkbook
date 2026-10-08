import os

# Before anything imports the settings: emails go to an in-memory outbox during tests.
os.environ["APP_ENV"] = "test"
os.environ["APP_EMAIL_BACKEND"] = "memory"

from collections.abc import Iterator  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import Engine, create_engine  # noqa: E402
from sqlalchemy.orm import Session, sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

import app.models  # noqa: E402, F401  (registers the tables on Base.metadata)
from app import email  # noqa: E402
from app.auth import rate_limit  # noqa: E402
from app.auth.security import hash_password  # noqa: E402
from app.auth.web import CSRF_COOKIE, CSRF_HEADER  # noqa: E402
from app.db import Base, get_db  # noqa: E402
from app.main import create_app  # noqa: E402
from app.models import User  # noqa: E402
from app.models.project import utcnow  # noqa: E402

PASSWORD = "una-password-lunga"


@pytest.fixture(autouse=True)
def _clean_state() -> Iterator[None]:
    email.outbox.clear()
    rate_limit.failed_logins.reset()
    rate_limit.email_requests.reset()
    yield


@pytest.fixture
def engine() -> Iterator[Engine]:
    # In-memory SQLite on a single shared connection, so every session sees the same database.
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def sessions(engine: Engine) -> sessionmaker[Session]:
    return sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


@pytest.fixture
def db(sessions: sessionmaker[Session]) -> Iterator[Session]:
    """A session on the same database the clients use, to seed and inspect data."""
    with sessions() as session:
        yield session


def new_client(sessions: sessionmaker[Session]) -> TestClient:
    """An anonymous browser: it has the CSRF cookie and sends it back like the frontend does."""

    def override_get_db() -> Iterator[Session]:
        with sessions() as session:
            yield session

    app = create_app()
    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    client.get("/api/auth/csrf")
    client.headers[CSRF_HEADER] = client.cookies[CSRF_COOKIE]
    return client


def make_user(
    db: Session,
    email_address: str = "consulente@example.com",
    *,
    verified: bool = True,
    admin: bool = False,
) -> User:
    user = User(
        email=email_address,
        password_hash=hash_password(PASSWORD),
        email_verified_at=utcnow() if verified else None,
        is_admin=admin,
    )
    db.add(user)
    db.commit()
    return user


def sign_in(client: TestClient, email_address: str) -> TestClient:
    response = client.post("/api/auth/login", json={"email": email_address, "password": PASSWORD})
    assert response.status_code == 200, response.text
    return client


@pytest.fixture
def anon_client(sessions: sessionmaker[Session]) -> Iterator[TestClient]:
    with new_client(sessions) as client:
        yield client


@pytest.fixture
def client(sessions: sessionmaker[Session], db: Session) -> Iterator[TestClient]:
    """Signed in as a confirmed user: what most API tests need."""
    make_user(db)
    with new_client(sessions) as client:
        yield sign_in(client, "consulente@example.com")


@pytest.fixture
def other_client(sessions: sessionmaker[Session], db: Session) -> Iterator[TestClient]:
    """A second, separate user, to check that data stays isolated."""
    make_user(db, "altro@example.com")
    with new_client(sessions) as client:
        yield sign_in(client, "altro@example.com")


@pytest.fixture
def admin_client(sessions: sessionmaker[Session], db: Session) -> Iterator[TestClient]:
    make_user(db, "admin@example.com", admin=True)
    with new_client(sessions) as client:
        yield sign_in(client, "admin@example.com")


@pytest.fixture
def client_without_db() -> Iterator[TestClient]:
    app = create_app()
    unreachable = sessionmaker(bind=create_engine("sqlite:////nonexistent-dir/unreachable.db"))

    def override_get_db() -> Iterator[Session]:
        with unreachable() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
