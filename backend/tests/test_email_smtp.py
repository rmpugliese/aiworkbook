import smtplib
from typing import Any

import pytest

from app import email
from app.config import Settings


class FakeSMTP:
    instances: list["FakeSMTP"] = []

    def __init__(self, host: str, port: int, timeout: float) -> None:
        self.host, self.port = host, port
        self.calls: list[str] = []
        FakeSMTP.instances.append(self)

    def __enter__(self) -> "FakeSMTP":
        return self

    def __exit__(self, *_: object) -> None:
        pass

    def starttls(self) -> None:
        self.calls.append("starttls")

    def login(self, user: str, password: str) -> None:
        self.calls.append(f"login:{user}")

    def send_message(self, message: Any) -> None:
        self.calls.append(f"send:{message['To']}")


class FakeSSL(FakeSMTP):
    pass


@pytest.fixture
def smtp(monkeypatch: pytest.MonkeyPatch) -> type[FakeSMTP]:
    FakeSMTP.instances.clear()
    monkeypatch.setattr(smtplib, "SMTP", FakeSMTP)
    monkeypatch.setattr(smtplib, "SMTP_SSL", FakeSSL)
    return FakeSMTP


def use(monkeypatch: pytest.MonkeyPatch, **overrides: Any) -> None:
    settings = Settings(
        email_backend="smtp",
        smtp_host="smtp.example.com",
        smtp_username="u@example.com",
        smtp_password="p",
        **overrides,
    )
    monkeypatch.setattr(email, "get_settings", lambda: settings)


def test_starttls_on_587(smtp: type[FakeSMTP], monkeypatch: pytest.MonkeyPatch) -> None:
    use(monkeypatch, smtp_port=587)
    email.send_email("a@example.com", "Oggetto", "Testo")
    sent = smtp.instances[-1]
    assert type(sent) is FakeSMTP and sent.port == 587
    assert sent.calls == ["starttls", "login:u@example.com", "send:a@example.com"]


def test_implicit_tls_on_465(smtp: type[FakeSMTP], monkeypatch: pytest.MonkeyPatch) -> None:
    use(monkeypatch, smtp_port=465, smtp_ssl=True)
    email.send_email("a@example.com", "Oggetto", "Testo")
    sent = smtp.instances[-1]
    assert type(sent) is FakeSSL and sent.port == 465
    assert sent.calls == ["login:u@example.com", "send:a@example.com"]  # no STARTTLS


class RefusingSMTP(FakeSMTP):
    def login(self, user: str, password: str) -> None:
        raise smtplib.SMTPServerDisconnected("Connection unexpectedly closed")


def test_a_failed_delivery_is_a_clear_503(
    anon_client: Any, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(smtplib, "SMTP", RefusingSMTP)
    use(monkeypatch, smtp_port=587)
    response = anon_client.post(
        "/api/auth/register",
        json={
            "email": "nuovo@example.com",
            "password": "password-molto-lunga",
            "accept_terms": True,
        },
    )
    assert response.status_code == 503
    assert "Non è stato possibile inviare l'email" in response.json()["detail"]


def test_links_without_query_have_no_question_mark() -> None:
    from app.services.auth import _link

    assert _link("/login").endswith("/login")
    assert _link("/verify-email", token="abc").endswith("/verify-email?token=abc")
