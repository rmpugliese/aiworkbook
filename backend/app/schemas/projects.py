from datetime import UTC, datetime
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, StringConstraints

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
OptionalName = Annotated[str, StringConstraints(strip_whitespace=True, max_length=200)]
IterationStatus = Literal["draft", "completed"]


def _as_utc(value: datetime) -> datetime:
    # SQLite returns naive datetimes: they are stored in UTC, so mark them as such.
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value


UtcDatetime = Annotated[datetime, AfterValidator(_as_utc)]


class _Input(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ProjectCreate(_Input):
    name: Name
    client_name: OptionalName | None = None
    description: str | None = None


class ProjectUpdate(_Input):
    name: Name | None = None
    client_name: OptionalName | None = None
    description: str | None = None


class ProjectDelete(_Input):
    confirm_name: str


class IterationCreate(_Input):
    title: Name
    user_story: str | None = None
    copy_from_iteration_id: int | None = None


class IterationUpdate(_Input):
    title: Name | None = None
    user_story: str | None = None
    status: IterationStatus | None = None


class _Output(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class IterationOut(_Output):
    id: int
    project_id: int
    number: int
    title: str
    user_story: str | None
    template_version: int
    status: IterationStatus
    created_at: UtcDatetime
    updated_at: UtcDatetime


class ProjectSummary(_Output):
    id: int
    name: str
    client_name: str | None
    description: str | None
    created_at: UtcDatetime
    updated_at: UtcDatetime
    archived_at: UtcDatetime | None
    ai_enabled_at: UtcDatetime | None
    iteration_count: Annotated[int, Field(ge=0)]


class ProjectOut(ProjectSummary):
    iterations: list[IterationOut]
