"""Encryption at rest for the assistant's API key."""

import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken

from app.config import get_settings


def _fernet() -> Fernet:
    # A dedicated key derived from APP_SECRET_KEY: changing the secret makes stored keys
    # unreadable, and the administrator simply enters the API key again.
    digest = hashlib.sha256(b"ai-api-key:" + get_settings().secret_key.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


def encrypt(value: str) -> str:
    return _fernet().encrypt(value.encode()).decode()


def decrypt(value: str) -> str | None:
    """None when the stored key can no longer be read (the secret key changed)."""
    try:
        return _fernet().decrypt(value.encode()).decode()
    except InvalidToken:
        return None
