"""Suggestions from signed-in users, emailed to the installation's contact address."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import email
from app.auth import rate_limit
from app.auth.web import CurrentUser
from app.db import get_db
from app.schemas.feedback import FeedbackIn
from app.services import branding

Db = Annotated[Session, Depends(get_db)]

router = APIRouter(tags=["feedback"])


@router.post("/api/feedback", status_code=status.HTTP_204_NO_CONTENT)
def send_feedback(db: Db, user: CurrentUser, data: FeedbackIn) -> None:
    site = branding.site(db)
    recipient = site.contact_email or site.legal_email
    if not recipient:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, "I suggerimenti non sono ancora attivi."
        )
    key = str(user.id)
    if rate_limit.feedback.is_limited(key):
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS, "Hai inviato molti suggerimenti: riprova tra un'ora."
        )
    # The message is not stored or logged: it only travels in the email.
    email.send_feedback(
        recipient,
        data.kind,
        sender_name=user.display_name or user.email,
        sender_email=user.email,
        message=data.message,
    )
    rate_limit.feedback.hit(key)
