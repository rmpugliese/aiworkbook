from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app import email
from app.services import branding
from tests.test_email_smtp import FakeSMTP, smtp, use  # noqa: F401  (fixture)

IDEA = {"kind": "idea", "message": "Mi piacerebbe esportare anche in Word."}


def set_contact(db: Session, contact: str = "", legal: str = "") -> None:
    row = branding.site(db)
    row.contact_email = contact
    row.legal_email = legal
    db.commit()


def test_a_suggestion_reaches_the_contact_address(client: TestClient, db: Session) -> None:
    set_contact(db, contact="info@example.com", legal="privacy@example.com")
    response = client.post("/api/feedback", json=IDEA)
    assert response.status_code == 204, response.text
    [sent] = email.outbox
    assert sent.to == "info@example.com"
    assert sent.subject == "Suggerimento: idea"
    assert sent.reply_to == "consulente@example.com"
    assert "consulente@example.com" in sent.text
    assert IDEA["message"] in sent.text


def test_falls_back_to_the_privacy_address(client: TestClient, db: Session) -> None:
    set_contact(db, legal="privacy@example.com")
    assert client.post("/api/feedback", json={**IDEA, "kind": "problem"}).status_code == 204
    assert email.outbox[0].to == "privacy@example.com"
    assert email.outbox[0].subject == "Suggerimento: problema"


def test_without_an_address_suggestions_are_off(client: TestClient, db: Session) -> None:
    set_contact(db)
    assert client.post("/api/feedback", json=IDEA).status_code == 503
    assert email.outbox == []


def test_requires_sign_in(anon_client: TestClient, db: Session) -> None:
    set_contact(db, contact="info@example.com")
    assert anon_client.post("/api/feedback", json=IDEA).status_code in (401, 403)
    assert email.outbox == []


@pytest.mark.parametrize(
    "body",
    [
        {"kind": "spam", "message": "Un messaggio abbastanza lungo."},
        {"kind": "idea", "message": "   corto   "},
        {"kind": "idea", "message": "x" * 4001},
        {"kind": "idea", "message": "Un messaggio valido.", "extra": 1},
    ],
)
def test_rejects_invalid_suggestions(client: TestClient, db: Session, body: Any) -> None:
    set_contact(db, contact="info@example.com")
    assert client.post("/api/feedback", json=body).status_code == 422
    assert email.outbox == []


def test_five_suggestions_an_hour(client: TestClient, db: Session) -> None:
    set_contact(db, contact="info@example.com")
    for _ in range(5):
        assert client.post("/api/feedback", json=IDEA).status_code == 204
    assert client.post("/api/feedback", json=IDEA).status_code == 429
    assert len(email.outbox) == 5


def test_reply_to_header_over_smtp(
    smtp: type[FakeSMTP],  # noqa: F811
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    sent: list[Any] = []
    monkeypatch.setattr(FakeSMTP, "send_message", lambda self, message: sent.append(message))
    use(monkeypatch)
    email.send_feedback("info@example.com", "other", "Ada", "ada@example.com", "Ciao a tutti!")
    assert sent[0]["Reply-To"] == "ada@example.com"
    assert sent[0]["Subject"] == "Suggerimento: altro"
