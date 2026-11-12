from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, StringConstraints


class FeedbackIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: Literal["idea", "problem", "other"]
    message: Annotated[
        str, StringConstraints(strip_whitespace=True, min_length=10, max_length=4000)
    ]
