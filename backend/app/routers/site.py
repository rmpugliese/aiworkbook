"""The installation's brand and legal details: public for the pages, editable by administrators."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.ai.provider import endpoint_location
from app.db import get_db
from app.legal import TERMS_VERSION
from app.models import AISettings, SiteSettings
from app.routers.admin import Admin
from app.schemas.site import (
    AINoticeOut,
    BrandIn,
    DonationIn,
    DonationOut,
    DonationSettingsOut,
    LegalIn,
    LegalOut,
    SiteOut,
)
from app.services import branding
from app.services.errors import InvalidRequestError

Db = Annotated[Session, Depends(get_db)]

router = APIRouter(tags=["site"])


def _legal(row: SiteSettings) -> LegalOut:
    return LegalOut(
        name=row.legal_name,
        address=row.legal_address,
        vat_id=row.legal_vat_id,
        email=row.legal_email,
        pec=row.legal_pec,
        court=row.legal_court,
        reviewed=row.legal_reviewed,
        contact_email=row.contact_email or row.legal_email,
        complete=bool(row.legal_name and row.legal_address and row.legal_email),
    )


def _ai_notice(db: Session) -> AINoticeOut:
    ai = db.get(AISettings, 1)
    available = bool(ai and ai.enabled and ai.base_url and ai.model)
    return AINoticeOut(
        available=available,
        model=ai.model if ai and available else None,
        provider_name=ai.provider_name if ai else "",
        server_location=ai.server_location if ai else "",
        model_kind=ai.model_kind if ai else "",
        location=endpoint_location(ai.base_url) if ai and available else None,
    )


def _donation(row: SiteSettings) -> DonationOut | None:
    if not (row.donation_enabled and row.donation_text and row.donation_url):
        return None
    return DonationOut(text=row.donation_text, url=row.donation_url)


def site_out(db: Session) -> SiteOut:
    row = branding.site(db)
    return SiteOut(
        brand_color=row.brand_color,
        logo_url=(
            f"/api/site/logo?v={int(row.logo_updated_at.timestamp())}"
            if row.logo_updated_at
            else None
        ),
        legal=_legal(row),
        terms_version=TERMS_VERSION,
        ai=_ai_notice(db),
        donation=_donation(row),
    )


@router.get("/api/site")
def get_site(db: Db) -> SiteOut:
    return site_out(db)


@router.get(
    "/api/site/logo",
    response_class=Response,
    responses={200: {"content": {"image/*": {}}, "description": "The installation's logo"}},
)
def get_logo(db: Db) -> Response:
    row = branding.site(db)
    if row.logo is None or row.logo_content_type is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Nessun logo.")
    return Response(
        content=row.logo,
        media_type=row.logo_content_type,
        headers={
            # Opened directly, an SVG still cannot run scripts or load anything.
            "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "public, max-age=31536000, immutable",
        },
    )


@router.put("/api/admin/site/logo")
async def upload_logo(db: Db, _admin: Admin, file: UploadFile) -> SiteOut:
    # Read one byte more than allowed: enough to know the file is too large.
    data = await file.read(branding.MAX_LOGO_BYTES + 1)
    try:
        branding.set_logo(db, data)
    except InvalidRequestError as error:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(error)) from error
    return site_out(db)


@router.delete("/api/admin/site/logo")
def delete_logo(db: Db, _admin: Admin) -> SiteOut:
    branding.clear_logo(db)
    return site_out(db)


@router.put("/api/admin/site/brand")
def update_brand(db: Db, _admin: Admin, data: BrandIn) -> SiteOut:
    try:
        branding.set_brand_color(db, data.brand_color)
    except InvalidRequestError as error:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(error)) from error
    return site_out(db)


@router.put("/api/admin/site/legal")
def update_legal(db: Db, _admin: Admin, data: LegalIn) -> SiteOut:
    row = branding.site(db)
    row.legal_name = data.name
    row.legal_address = data.address
    row.legal_vat_id = data.vat_id
    row.legal_email = data.email
    row.legal_pec = data.pec
    row.legal_court = data.court
    row.legal_reviewed = data.reviewed
    row.contact_email = data.contact_email
    db.commit()
    return site_out(db)


def _donation_settings(row: SiteSettings) -> DonationSettingsOut:
    return DonationSettingsOut(
        enabled=row.donation_enabled, text=row.donation_text, url=row.donation_url
    )


@router.get("/api/admin/site/donation")
def get_donation(db: Db, _admin: Admin) -> DonationSettingsOut:
    return _donation_settings(branding.site(db))


@router.put("/api/admin/site/donation")
def update_donation(db: Db, _admin: Admin, data: DonationIn) -> DonationSettingsOut:
    try:
        row = branding.set_donation(db, enabled=data.enabled, text=data.text, url=data.url)
    except InvalidRequestError as error:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(error)) from error
    return _donation_settings(row)
