from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

if TYPE_CHECKING:
    from app.models.user import User


def utcnow() -> datetime:
    return datetime.now(UTC)


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    client_name: Mapped[str | None] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # None only for projects created in local single-user mode, before accounts existed: the
    # first user to confirm an account takes them over.
    owner_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    # The owner's consent to send this project's content to the AI assistant's endpoint.
    ai_enabled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    owner: Mapped["User | None"] = relationship()
    iterations: Mapped[list["Iteration"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="Iteration.number",
    )
    members: Mapped[list["ProjectMember"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="ProjectMember.id",
    )


class ProjectMember(Base):
    """A colleague invited to work on a project. Until an account confirms the invited address,
    the invitation is pending (no user) and gives no access."""

    __tablename__ = "project_members"
    __table_args__ = (UniqueConstraint("project_id", "email"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    email: Mapped[str] = mapped_column(String(320), index=True)
    invited_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    project: Mapped[Project] = relationship(back_populates="members")


class Iteration(Base):
    __tablename__ = "iterations"
    __table_args__ = (UniqueConstraint("project_id", "number"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    number: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(200))
    user_story: Mapped[str | None] = mapped_column(Text)
    template_version: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    # Set the first time the assistant drafts or improves a text here: documents then disclose
    # that AI supported the work (legge 132/2025, art. 13). Never cleared, unlike the AI log.
    ai_assisted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    project: Mapped[Project] = relationship(back_populates="iterations")
    answers: Mapped[list["Answer"]] = relationship(
        back_populates="iteration", cascade="all, delete-orphan", passive_deletes=True
    )


class Answer(Base):
    """One answer to one template question within an iteration."""

    __tablename__ = "answers"
    __table_args__ = (UniqueConstraint("iteration_id", "question_key"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    iteration_id: Mapped[int] = mapped_column(
        ForeignKey("iterations.id", ondelete="CASCADE"), index=True
    )
    question_key: Mapped[str] = mapped_column(String(200))
    text: Mapped[str | None] = mapped_column(Text)
    verdict: Mapped[str | None] = mapped_column(String(10))
    # Selected options (multi_choice) or satisfied criteria (phase_gate).
    choices: Mapped[list[Any] | None] = mapped_column(JSON)
    return_to_phase: Mapped[int | None] = mapped_column(Integer)
    # Who saved it last (owner or collaborator); None if that account was deleted.
    updated_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    iteration: Mapped[Iteration] = relationship(back_populates="answers")
    author: Mapped["User | None"] = relationship()

    @property
    def updated_by_name(self) -> str | None:
        """Who saved it last, as their colleagues see them."""
        if self.author is None:
            return None
        return self.author.display_name or self.author.email
