"""Password hashing and random tokens."""

import hashlib
import hmac
import secrets

from pwdlib import PasswordHash

_hasher = PasswordHash.recommended()  # Argon2id

# A valid hash compared against when the account does not exist, so a login attempt takes the
# same time whether or not the email is registered.
_DUMMY_HASH = _hasher.hash(secrets.token_urlsafe(16))


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str | None) -> bool:
    if password_hash is None:
        _hasher.verify(password, _DUMMY_HASH)
        return False
    return _hasher.verify(password, password_hash)


def new_token() -> str:
    """256 random bits, URL-safe: for session cookies and email links."""
    return secrets.token_urlsafe(32)


def token_hash(token: str) -> str:
    """What the database stores instead of the token itself."""
    return hashlib.sha256(token.encode()).hexdigest()


def tokens_match(a: str, b: str) -> bool:
    return hmac.compare_digest(a.encode(), b.encode())
