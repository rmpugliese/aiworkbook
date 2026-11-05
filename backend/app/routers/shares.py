"""Read-only sharing: the owner's link management under /api, and the public pages under /s."""

from collections.abc import Iterator
from contextlib import contextmanager
from datetime import datetime
from typing import Annotated
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.auth import rate_limit
from app.auth.web import CurrentUser
from app.config import get_settings
from app.db import get_db
from app.export.pdf import (
    SharedPage,
    attachment_header,
    pdf_filename,
    render_html,
    render_not_found,
    render_pdf,
)
from app.export.report import Report, build_report
from app.models import ShareLink
from app.schemas.shares import ShareLinkCreated, ShareLinkIn, ShareLinkOut
from app.services import sharing as service
from app.services.branding import document_branding
from app.services.errors import ConflictError, NotFoundError
from app.services.sharing import SharedIteration
from app.workbook.loader import load_template

Db = Annotated[Session, Depends(get_db)]

router = APIRouter(
    prefix="/api/projects/{project_id}/iterations/{iteration_id}/shares", tags=["shares"]
)
public_router = APIRouter(prefix="/s", tags=["shared"], include_in_schema=False)


@contextmanager
def _errors() -> Iterator[None]:
    try:
        yield
    except NotFoundError as error:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(error)) from error
    except ConflictError as error:
        raise HTTPException(status.HTTP_409_CONFLICT, str(error)) from error


def _out(link: ShareLink) -> ShareLinkOut:
    return ShareLinkOut(
        id=link.id,
        label=link.label,
        status=service.link_status(link),
        created_at=link.created_at,
        expires_at=link.expires_at,
        revoked_at=link.revoked_at,
        last_accessed_at=link.last_accessed_at,
        access_count=link.access_count,
    )


def share_url(token: str) -> str:
    return f"{get_settings().public_url.rstrip('/')}/s/{token}"


@router.get("")
def list_links(db: Db, user: CurrentUser, project_id: int, iteration_id: int) -> list[ShareLinkOut]:
    with _errors():
        links = service.list_links(db, project_id, iteration_id, owner_id=user.id)
    return [_out(link) for link in links]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_link(
    db: Db, user: CurrentUser, project_id: int, iteration_id: int, data: ShareLinkIn
) -> ShareLinkCreated:
    with _errors():
        link, token = service.create_link(
            db,
            project_id,
            iteration_id,
            owner_id=user.id,
            label=data.label,
            expires_in_days=data.expires_in_days,
        )
    return ShareLinkCreated(**_out(link).model_dump(), url=share_url(token))


@router.post("/{link_id}/revoke")
def revoke_link(
    db: Db, user: CurrentUser, project_id: int, iteration_id: int, link_id: int
) -> ShareLinkOut:
    with _errors():
        link = service.revoke_link(db, project_id, iteration_id, link_id, owner_id=user.id)
    return _out(link)


@router.delete("/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_link(
    db: Db, user: CurrentUser, project_id: int, iteration_id: int, link_id: int
) -> None:
    with _errors():
        service.delete_link(db, project_id, iteration_id, link_id, owner_id=user.id)


# Public pages: no session, nothing to modify, and nothing that leaks to other sites.
_PUBLIC_HEADERS = {
    "X-Robots-Tag": "noindex, nofollow",
    "Referrer-Policy": "no-referrer",
    "Cache-Control": "no-store",
    "Content-Security-Policy": (
        "default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; "
        "form-action 'none'; "
        "frame-ancestors 'none'"
    ),
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
}


def _limit(limiter: rate_limit.RateLimiter, request: Request) -> None:
    key = request.client.host if request.client else "unknown"
    if limiter.is_limited(key):
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "Troppe richieste: riprova tra un po'.",
            headers=_PUBLIC_HEADERS,
        )
    limiter.hit(key)


def _not_found() -> HTMLResponse:
    return HTMLResponse(render_not_found(), status.HTTP_404_NOT_FOUND, headers=_PUBLIC_HEADERS)


def _report(db: Session, shared: SharedIteration) -> Report:
    return build_report(
        project=shared.project,
        iteration=shared.iteration,
        template=load_template(shared.iteration.template_version),
        answers=shared.answers,
        generated_at=datetime.now().astimezone(),
        branding=document_branding(db),
    )


def _last_update(shared: SharedIteration) -> datetime:
    times = [shared.iteration.updated_at, *(answer.updated_at for answer in shared.answers)]
    return max(service.aware(time) for time in times)


@public_router.get("/{token}", response_class=HTMLResponse)
def shared_page(db: Db, request: Request, token: str) -> HTMLResponse:
    _limit(rate_limit.shared_pages, request)
    try:
        shared = service.resolve(db, token)
    except NotFoundError:
        return _not_found()
    page = SharedPage(
        pdf_url=f"/s/{quote(token)}/pdf",
        updated_on=_last_update(shared).astimezone().strftime("%d/%m/%Y %H:%M"),
    )
    return HTMLResponse(render_html(_report(db, shared), shared=page), headers=_PUBLIC_HEADERS)


@public_router.get("/{token}/pdf", response_model=None)
def shared_pdf(db: Db, request: Request, token: str) -> Response:
    _limit(rate_limit.shared_pdfs, request)
    try:
        shared = service.resolve(db, token)
    except NotFoundError:
        return _not_found()
    report = _report(db, shared)
    return Response(
        content=render_pdf(report),
        media_type="application/pdf",
        headers={**_PUBLIC_HEADERS, "Content-Disposition": attachment_header(pdf_filename(report))},
    )
