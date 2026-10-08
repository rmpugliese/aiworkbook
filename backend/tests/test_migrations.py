"""Migrations must keep existing data, including rows that depend on rebuilt tables."""

from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, text

BACKEND = Path(__file__).resolve().parents[1]
BEFORE_ACCOUNTS = "d70d099255aa"  # projects, iterations, answers; no users yet


def alembic_config(database_url: str, monkeypatch: pytest.MonkeyPatch) -> Config:
    from app.config import get_settings

    # env.py reads the URL from the settings.
    monkeypatch.setattr(get_settings(), "database_url", database_url)
    config = Config(str(BACKEND / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND / "migrations"))
    return config


def test_upgrading_keeps_iterations_and_answers(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    url = f"sqlite:///{tmp_path / 'existing.db'}"
    config = alembic_config(url, monkeypatch)
    command.upgrade(config, BEFORE_ACCOUNTS)
    engine = create_engine(url)
    with engine.begin() as db:
        db.execute(
            text(
                "INSERT INTO projects (id, name, created_at, updated_at) "
                "VALUES (1, 'Esistente', '2026-10-01 10:00:00', '2026-10-01 10:00:00')"
            )
        )
        db.execute(
            text(
                "INSERT INTO iterations (id, project_id, number, title, template_version, status,"
                " created_at, updated_at) VALUES (1, 1, 1, 'Iterazione 1', 1, 'draft',"
                " '2026-10-01 10:00:00', '2026-10-01 10:00:00')"
            )
        )
        db.execute(
            text(
                "INSERT INTO answers (iteration_id, question_key, text, updated_at)"
                " VALUES (1, 'p1.a.b.c', 'Risposta', '2026-10-01 10:00:00')"
            )
        )

    command.upgrade(config, "head")
    command.downgrade(config, BEFORE_ACCOUNTS)
    command.upgrade(config, "head")

    with engine.connect() as db:
        assert db.execute(text("SELECT count(*) FROM iterations")).scalar() == 1
        assert db.execute(text("SELECT text FROM answers")).scalar() == "Risposta"
        assert db.execute(text("SELECT owner_id FROM projects")).scalar() is None
    engine.dispose()


def test_upgrading_makes_the_first_confirmed_user_administrator(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    url = f"sqlite:///{tmp_path / 'accounts.db'}"
    config = alembic_config(url, monkeypatch)
    command.upgrade(config, "d2f25440b7ec")  # accounts, before administrators
    engine = create_engine(url)
    with engine.begin() as db:
        for user_id, address, verified in [
            (1, "mai.confermato@example.com", None),
            (2, "secondo@example.com", "2026-10-03 09:00:00"),
            (3, "primo@example.com", "2026-10-02 09:00:00"),
        ]:
            db.execute(
                text(
                    "INSERT INTO users (id, email, email_verified_at, created_at)"
                    " VALUES (:id, :email, :verified, '2026-10-01 09:00:00')"
                ),
                {"id": user_id, "email": address, "verified": verified},
            )

    command.upgrade(config, "head")

    with engine.connect() as db:
        admins = db.execute(text("SELECT email FROM users WHERE is_admin")).scalars().all()
    assert admins == ["primo@example.com"]
    engine.dispose()
