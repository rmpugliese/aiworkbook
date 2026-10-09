from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, StringConstraints

from app.schemas.projects import UtcDatetime
from app.services.sharing import LinkStatus


class ShareLinkIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]
    expires_in_days: Literal[7, 30, 90] | None = None


class ShareLinkOut(BaseModel):
    """A link as listed to its owner: never the token itself."""

    id: int
    label: str
    status: LinkStatus
    created_at: UtcDatetime
    expires_at: UtcDatetime | None
    revoked_at: UtcDatetime | None
    last_accessed_at: UtcDatetime | None
    access_count: int


class ShareLinkCreated(ShareLinkOut):
    """Returned once, at creation: the only time the full URL is available."""

    url: str
