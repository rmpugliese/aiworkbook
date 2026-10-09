from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator

Location = Literal["locale", "remoto"]


class AISettingsIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    enabled: bool
    base_url: Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)]
    model: Annotated[str, StringConstraints(strip_whitespace=True, max_length=200)]
    temperature: Annotated[float, Field(ge=0, le=1)] = 0.4
    max_tokens: Annotated[int, Field(ge=50, le=8000)] = 1200
    # None: keep the stored key. A value: replace it. clear_api_key: remove it.
    api_key: Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)] | None = None
    clear_api_key: bool = False

    @field_validator("base_url")
    @classmethod
    def _http_url(cls, value: str) -> str:
        if value and not value.startswith(("http://", "https://")):
            raise ValueError("l'URL deve iniziare con http:// o https://")
        return value.rstrip("/")


class AISettingsOut(BaseModel):
    """The API key itself is never returned."""

    enabled: bool
    base_url: str
    model: str
    has_api_key: bool
    api_key_hint: str | None
    temperature: float
    max_tokens: int
    location: Location | None


class AITestOut(BaseModel):
    ok: bool
    seconds: float | None = None
    detail: str


class AIStatusOut(BaseModel):
    available: bool
    model: str | None
    location: Location | None
    host: str | None


class AssistIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    question_key: Annotated[str, Field(min_length=1, max_length=200)]
    action: Literal["suggest", "improve", "review"]
    text: Annotated[str, Field(max_length=20_000)] = ""
    verdict: Literal["go", "maybe", "no_go"] | None = None
