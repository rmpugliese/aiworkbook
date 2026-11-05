from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, false
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.project import utcnow


class AISettings(Base):
    """The assistant's endpoint, set by an administrator. A single row (id 1)."""

    __tablename__ = "ai_settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false())
    base_url: Mapped[str] = mapped_column(String(500), default="")
    model: Mapped[str] = mapped_column(String(200), default="")
    api_key_encrypted: Mapped[str | None] = mapped_column(Text)
    api_key_hint: Mapped[str | None] = mapped_column(String(8))  # last characters, for display
    temperature: Mapped[float] = mapped_column(Float, default=0.4)
    max_tokens: Mapped[int] = mapped_column(Integer, default=1200)
    # What the AI notice tells users about the service: who runs it, where, which kind of model.
    provider_name: Mapped[str] = mapped_column(String(200), default="", server_default="")
    server_location: Mapped[str] = mapped_column(String(200), default="", server_default="")
    model_kind: Mapped[str] = mapped_column(String(200), default="", server_default="")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )


class AIRequest(Base):
    """One use of the assistant. Metadata only: never the prompt or the answer."""

    __tablename__ = "ai_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    project_id: Mapped[int | None] = mapped_column(
        ForeignKey("projects.id", ondelete="SET NULL"), index=True
    )
    question_key: Mapped[str] = mapped_column(String(200))
    action: Mapped[str] = mapped_column(String(20))
    model: Mapped[str] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    duration_ms: Mapped[int | None] = mapped_column(Integer)
    prompt_chars: Mapped[int] = mapped_column(Integer, default=0)
    output_chars: Mapped[int] = mapped_column(Integer, default=0)
    prompt_tokens: Mapped[int | None] = mapped_column(Integer)
    completion_tokens: Mapped[int | None] = mapped_column(Integer)
    outcome: Mapped[str] = mapped_column(String(20), default="ok")  # ok | error | cancelled
    error: Mapped[str | None] = mapped_column(String(500))
