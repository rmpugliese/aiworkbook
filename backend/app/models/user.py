from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, LargeBinary, String, false
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.project import utcnow


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True)  # stored lowercase
    display_name: Mapped[str | None] = mapped_column(String(200))
    password_hash: Mapped[str | None] = mapped_column(String(255))  # None: Google-only account
    google_sub: Mapped[str | None] = mapped_column(String(255), unique=True)
    email_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    # Administrators manage accounts; they never get access to other users' projects.
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false())
    suspended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # The consultant's brand, shown on their reports and shared pages. The logo is small (at most
    # 1 MB) and lives in the database, so it follows the backups and needs no file storage.
    brand_color: Mapped[str | None] = mapped_column(String(7))
    logo: Mapped[bytes | None] = mapped_column(LargeBinary, deferred=True)
    logo_content_type: Mapped[str | None] = mapped_column(String(40))
    logo_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # When the user accepted the terms and privacy notice, and which version (app/legal.py).
    terms_accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    terms_version: Mapped[str | None] = mapped_column(String(20))

    sessions: Mapped[list["Session"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )


class Session(Base):
    """A signed-in browser. Only the SHA-256 of the cookie token is stored."""

    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    user: Mapped[User] = relationship(back_populates="sessions")


class EmailToken(Base):
    """A single-use link sent by email: email confirmation or password reset."""

    __tablename__ = "email_tokens"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    purpose: Mapped[str] = mapped_column(String(20))  # "verify_email" | "reset_password"
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
