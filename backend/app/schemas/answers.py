from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.schemas.projects import UtcDatetime

Verdict = Literal["go", "maybe", "no_go"]


class AnswerIn(BaseModel):
    """A full replacement of one answer. Empty fields are null (or an empty list)."""

    model_config = ConfigDict(extra="forbid")

    text: str | None = None
    verdict: Verdict | None = None
    choices: list[str] | None = None
    return_to_phase: int | None = None
    # The version the edit starts from (its updated_at, or null for no answer yet). When given,
    # a newer answer saved by someone else is a conflict instead of being overwritten.
    base_updated_at: UtcDatetime | None = None


class AnswerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    question_key: str
    text: str | None
    verdict: Verdict | None
    choices: list[str] | None
    return_to_phase: int | None
    updated_at: UtcDatetime | None
    updated_by_id: int | None = None
    updated_by_name: str | None = None


class AnswerConflictOut(BaseModel):
    detail: str
    current: AnswerOut
