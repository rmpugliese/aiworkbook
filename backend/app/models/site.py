from datetime import datetime

from sqlalchemy import Boolean, DateTime, LargeBinary, String, Text, false
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.project import utcnow


class SiteSettings(Base):
    """The installation's brand and legal details, set by an administrator. A single row (id 1)."""

    __tablename__ = "site_settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    # Brand: in the header for everyone, on sign-in and legal pages, PDFs and shared pages.
    brand_color: Mapped[str | None] = mapped_column(String(7))
    logo: Mapped[bytes | None] = mapped_column(LargeBinary, deferred=True)
    logo_content_type: Mapped[str | None] = mapped_column(String(40))
    logo_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # The data controller named in the privacy notice and the terms of use.
    legal_name: Mapped[str] = mapped_column(String(320), default="", server_default="")
    legal_address: Mapped[str] = mapped_column(String(320), default="", server_default="")
    legal_vat_id: Mapped[str] = mapped_column(String(100), default="", server_default="")
    legal_email: Mapped[str] = mapped_column(String(320), default="", server_default="")
    legal_pec: Mapped[str] = mapped_column(String(320), default="", server_default="")
    # For general questions, in the footer ("Contatti"); the privacy email when empty.
    contact_email: Mapped[str] = mapped_column(String(320), default="", server_default="")
    legal_court: Mapped[str] = mapped_column(String(100), default="", server_default="")
    # Until a lawyer has reviewed the texts, the legal pages say they are drafts.
    legal_reviewed: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false())
    legal_notes: Mapped[str | None] = mapped_column(Text)
    # An optional invitation to donate to an organisation, shown in the profile next to the
    # user's logo. Shown only when enabled and both text and link are set.
    donation_enabled: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false())
    donation_text: Mapped[str] = mapped_column(Text, default="", server_default="")
    donation_url: Mapped[str] = mapped_column(String(500), default="", server_default="")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )
