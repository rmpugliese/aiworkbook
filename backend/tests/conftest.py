from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401  (registers the tables on Base.metadata)
from app.db import Base, get_db
from app.main import create_app


def _client_for(engine: Engine) -> Iterator[TestClient]:
    testing_session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

    def override_get_db() -> Iterator[Session]:
        with testing_session() as session:
            yield session

    app = create_app()
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    engine.dispose()


@pytest.fixture
def client() -> Iterator[TestClient]:
    # In-memory SQLite on a single shared connection, so every session sees the same database.
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    yield from _client_for(engine)


@pytest.fixture
def client_without_db() -> Iterator[TestClient]:
    yield from _client_for(create_engine("sqlite:////nonexistent-dir/unreachable.db"))


@pytest.fixture
def db(client: TestClient) -> Iterator[Session]:
    """A session on the same database the client uses, to seed and inspect data."""
    override = client.app.dependency_overrides[get_db]  # type: ignore[attr-defined]
    yield from override()
