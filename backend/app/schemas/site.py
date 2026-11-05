from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, StringConstraints

Short = Annotated[str, StringConstraints(strip_whitespace=True, max_length=100)]
Line = Annotated[str, StringConstraints(strip_whitespace=True, max_length=320)]


class LegalOut(BaseModel):
    """The data controller, as the legal pages show it."""

    name: str
    address: str
    vat_id: str
    email: str
    pec: str
    court: str
    reviewed: bool
    # Where to write for information: the contact email, or else the privacy one.
    contact_email: str
    # False while the essentials (name, address, privacy email) are missing.
    complete: bool


class LegalIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: Line
    address: Line
    vat_id: Short
    email: Line
    pec: Line
    court: Short
    reviewed: bool
    contact_email: Line = ""


class AINoticeOut(BaseModel):
    """What the AI notice tells users. Never the endpoint's address or key."""

    available: bool
    model: str | None
    provider_name: str
    server_location: str
    model_kind: str
    location: Literal["locale", "remoto"] | None


class SiteOut(BaseModel):
    """Public: what every page needs before and after signing in."""

    brand_color: str | None
    # Changes whenever the logo does, so browsers never show a stale cached image.
    logo_url: str | None
    legal: LegalOut
    terms_version: str
    ai: AINoticeOut


class BrandIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # Empty or null: back to the default colour.
    brand_color: Annotated[str, StringConstraints(strip_whitespace=True, max_length=7)] | None
