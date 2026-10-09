from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints

from app.schemas.projects import UtcDatetime

Password = Annotated[str, Field(min_length=10, max_length=128)]
DisplayName = Annotated[str, StringConstraints(strip_whitespace=True, max_length=200)]


class _Input(BaseModel):
    model_config = ConfigDict(extra="forbid")


class RegisterIn(_Input):
    email: EmailStr
    password: Password
    display_name: DisplayName | None = None


class LoginIn(_Input):
    email: EmailStr
    password: Annotated[str, Field(max_length=128)]


class EmailIn(_Input):
    email: EmailStr


class TokenIn(_Input):
    token: Annotated[str, Field(min_length=1, max_length=200)]


class PasswordResetIn(TokenIn):
    password: Password


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    display_name: str | None
    has_password: bool
    google_linked: bool
    is_admin: bool
    brand_color: str | None
    # Changes whenever the logo does, so browsers never show a stale cached image.
    logo_url: str | None


class ProfileIn(_Input):
    """Only the fields sent are changed; an empty value clears the field."""

    display_name: DisplayName | None = None
    brand_color: Annotated[str, StringConstraints(strip_whitespace=True, max_length=7)] | None = (
        None
    )


class AdminUserOut(BaseModel):
    id: int
    email: str
    display_name: str | None
    is_admin: bool
    created_at: UtcDatetime
    email_verified_at: UtcDatetime | None
    suspended_at: UtcDatetime | None
    last_seen_at: UtcDatetime | None
    project_count: int
    google_linked: bool


class ProvidersOut(BaseModel):
    google: bool


class MessageOut(BaseModel):
    detail: str
