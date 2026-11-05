import base64
from datetime import datetime

import httpx2  # what the test client returns
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.export.pdf import render_html
from app.export.report import Branding
from app.services import branding
from app.services.errors import InvalidRequestError
from app.services.export import iteration_report
from tests.test_export import needs_weasyprint

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 64
SVG = (
    b'<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">'
    b'<rect width="10" height="10" fill="url(#g)"/></svg>'
)


# Logo validation


@pytest.mark.parametrize(
    ("data", "media_type"), [(PNG, "image/png"), (JPEG, "image/jpeg"), (SVG, "image/svg+xml")]
)
def test_accepted_logo_types(data: bytes, media_type: str) -> None:
    assert branding.prepare_logo(data)[1] == media_type


def test_a_plain_doctype_is_removed_from_svg() -> None:
    svg = (
        b'<?xml version="1.0"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" '
        b'"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n'
        b'<svg xmlns="http://www.w3.org/2000/svg"></svg>'
    )
    stored, media_type = branding.prepare_logo(svg)
    assert media_type == "image/svg+xml"
    assert b"DOCTYPE" not in stored


@pytest.mark.parametrize(
    "data",
    [
        b"GIF89a" + b"\x00" * 20,
        b"%PDF-1.7 not an image",
        b"<html><body>no</body></html>",
        b"",
        PNG[:4] + b"x" * 10,  # a truncated signature
    ],
)
def test_rejected_logo_types(data: bytes) -> None:
    with pytest.raises(InvalidRequestError):
        branding.prepare_logo(data)


@pytest.mark.parametrize(
    "fragment",
    [
        "<script>alert(1)</script>",
        '<rect onload="alert(1)"/>',
        '<a href="javascript:alert(1)"><rect/></a>',
        "<foreignObject><div/></foreignObject>",
        '<image href="https://example.com/x.png"/>',
        "<image xlink:href='//example.com/x.png'/>",
        '<rect style="fill: url(https://example.com/x)"/>',
        "<style>@import 'https://example.com/x.css';</style>",
        '<image href="file:///etc/passwd"/>',
    ],
)
def test_unsafe_svg_is_rejected(fragment: str) -> None:
    svg = f'<svg xmlns="http://www.w3.org/2000/svg">{fragment}</svg>'.encode()
    with pytest.raises(InvalidRequestError, match="SVG"):
        branding.prepare_logo(svg)


def test_svg_with_entities_is_rejected() -> None:
    svg = b'<?xml version="1.0"?><!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]><svg>&x;</svg>'
    with pytest.raises(InvalidRequestError):
        branding.prepare_logo(svg)


def test_logo_size_limit() -> None:
    with pytest.raises(InvalidRequestError, match="1 MB"):
        branding.prepare_logo(PNG + b"\x00" * branding.MAX_LOGO_BYTES)


# Colour


@pytest.mark.parametrize("color", ["#1d4f7a", "#000000", "#B91C1C"])
def test_dark_enough_colors(color: str) -> None:
    assert branding.normalize_color(color) == color.lower()


@pytest.mark.parametrize("color", ["#ffcc00", "#ffffff", "#7fb3ff"])
def test_too_light_colors(color: str) -> None:
    with pytest.raises(InvalidRequestError, match="troppo chiaro"):
        branding.normalize_color(color)


@pytest.mark.parametrize("color", ["blue", "#12345", "1d4f7a", "#1d4f7g", "#1d4f7a; x"])
def test_malformed_colors(color: str) -> None:
    with pytest.raises(InvalidRequestError, match="#RRGGBB"):
        branding.normalize_color(color)


def test_contrast() -> None:
    assert branding.contrast_with_white("#000000") == pytest.approx(21)
    assert branding.contrast_with_white("#ffffff") == pytest.approx(1)


# API: the installation's brand, managed by administrators


def upload(client: TestClient, data: bytes, name: str = "logo.png") -> httpx2.Response:
    return client.put(
        "/api/admin/site/logo", files={"file": (name, data, "application/octet-stream")}
    )


def test_site_is_public_and_starts_empty(anon_client: TestClient) -> None:
    site = anon_client.get("/api/site").json()
    assert site["brand_color"] is None and site["logo_url"] is None
    assert site["legal"]["complete"] is False and site["legal"]["reviewed"] is False
    assert site["terms_version"]


def test_only_administrators_change_the_brand(client: TestClient, anon_client: TestClient) -> None:
    assert client.put("/api/admin/site/brand", json={"brand_color": "#7a1d4f"}).status_code == 403
    assert upload(client, PNG).status_code == 403
    assert anon_client.put(
        "/api/admin/site/brand", json={"brand_color": "#7a1d4f"}
    ).status_code in (
        401,
        403,
    )


def test_brand_color(admin_client: TestClient) -> None:
    response = admin_client.put("/api/admin/site/brand", json={"brand_color": "#7A1D4F"})
    assert response.status_code == 200 and response.json()["brand_color"] == "#7a1d4f"
    refused = admin_client.put("/api/admin/site/brand", json={"brand_color": "#ffee00"})
    assert refused.status_code == 422 and "troppo chiaro" in refused.json()["detail"]
    cleared = admin_client.put("/api/admin/site/brand", json={"brand_color": ""})
    assert cleared.json()["brand_color"] is None


def test_logo_upload_serve_and_remove(admin_client: TestClient, anon_client: TestClient) -> None:
    response = upload(admin_client, SVG, "logo.svg")
    assert response.status_code == 200
    logo_url = response.json()["logo_url"]
    assert logo_url.startswith("/api/site/logo?v=")

    # Public: the sign-in page and the header show it before anyone signs in.
    served = anon_client.get(logo_url)
    assert served.status_code == 200
    assert served.headers["content-type"] == "image/svg+xml"
    assert "sandbox" in served.headers["content-security-policy"]
    assert served.content == SVG

    assert admin_client.delete("/api/admin/site/logo").json()["logo_url"] is None
    assert anon_client.get("/api/site/logo").status_code == 404


def test_invalid_logo_upload_is_refused(admin_client: TestClient) -> None:
    response = upload(admin_client, b"GIF89a....", "logo.png")
    assert response.status_code == 422
    assert "PNG, JPEG o SVG" in response.json()["detail"]
    assert upload(admin_client, PNG + b"\x00" * branding.MAX_LOGO_BYTES).status_code == 422


def test_profile_only_changes_the_name(client: TestClient) -> None:
    response = client.patch("/api/auth/me", json={"display_name": "Studio Rossi"})
    assert response.status_code == 200
    assert response.json()["display_name"] == "Studio Rossi"
    assert "brand_color" not in response.json() and "logo_url" not in response.json()
    assert client.patch("/api/auth/me", json={"brand_color": "#000000"}).status_code == 422


LEGAL = {
    "name": "Perl Consulting di Esempio",
    "address": "Via Roma 1, 34100 Trieste",
    "vat_id": "IT01234567890",
    "email": "privacy@example.com",
    "pec": "",
    "court": "Trieste",
    "reviewed": False,
}


def test_legal_details(
    admin_client: TestClient, anon_client: TestClient, client: TestClient
) -> None:
    assert client.put("/api/admin/site/legal", json=LEGAL).status_code == 403
    response = admin_client.put("/api/admin/site/legal", json={**LEGAL, "name": "  Spazi  "})
    assert response.status_code == 200
    legal = anon_client.get("/api/site").json()["legal"]
    assert legal["name"] == "Spazi" and legal["complete"] is True
    assert legal["vat_id"] == "IT01234567890" and legal["reviewed"] is False


def test_ai_notice_never_exposes_the_endpoint(
    admin_client: TestClient, anon_client: TestClient
) -> None:
    admin_client.put(
        "/api/admin/ai",
        json={
            "enabled": True,
            "base_url": "https://llm.interno.example/v1",
            "model": "mistral-small",
            "api_key": "chiave-finta-di-test-1234",
            "provider_name": "Fornitore Esempio",
            "server_location": "Francia (UE)",
            "model_kind": "open weight, licenza Apache 2.0",
        },
    )
    notice = anon_client.get("/api/site").json()["ai"]
    assert notice == {
        "available": True,
        "model": "mistral-small",
        "provider_name": "Fornitore Esempio",
        "server_location": "Francia (UE)",
        "model_kind": "open weight, licenza Apache 2.0",
        "location": "remoto",
    }
    raw = anon_client.get("/api/site").text
    assert "llm.interno" not in raw and "chiave-finta" not in raw


# Documents: the installation's brand on every project's documents


@pytest.fixture
def base(client: TestClient) -> str:
    project = client.post("/api/projects", json={"name": "Churn"}).json()
    return f"/api/projects/{project['id']}/iterations/{project['iterations'][0]['id']}"


def test_report_without_branding_keeps_the_default_look(
    client: TestClient, db: Session, base: str
) -> None:
    html = render_html_for(client, db, base)
    assert 'class="brand-logo"' not in html
    assert "h2, .doc-title { color:" not in html


def test_report_carries_the_site_brand(
    client: TestClient, admin_client: TestClient, db: Session, base: str
) -> None:
    admin_client.put("/api/admin/site/brand", json={"brand_color": "#7a1d4f"})
    upload(admin_client, PNG)
    html = render_html_for(client, db, base)
    assert f'src="data:image/png;base64,{base64.b64encode(PNG).decode()}"' in html
    assert "h2, .doc-title { color: #7a1d4f; }" in html


def test_shared_page_carries_the_site_brand(
    client: TestClient, admin_client: TestClient, anon_client: TestClient, base: str
) -> None:
    admin_client.put("/api/admin/site/brand", json={"brand_color": "#7a1d4f"})
    upload(admin_client, SVG, "logo.svg")
    url = client.post(f"{base}/shares", json={"label": "Cliente"}).json()["url"]
    response = anon_client.get("/s/" + url.rsplit("/s/", 1)[1])
    assert ".share-bar { background: #7a1d4f; }" in response.text
    assert 'src="data:image/svg+xml;base64,' in response.text
    assert "img-src data:;" in response.headers["content-security-policy"]


@needs_weasyprint
def test_pdf_with_logo(client: TestClient, admin_client: TestClient, base: str) -> None:
    upload(admin_client, SVG, "logo.svg")
    response = client.get(f"{base}/export.pdf")
    assert response.status_code == 200
    assert response.content.startswith(b"%PDF")


def test_branding_default() -> None:
    assert Branding().logo is None and Branding().color is None


def render_html_for(client: TestClient, db: Session, base: str) -> str:
    """The report HTML, built the way the export endpoint builds it."""
    project_id, iteration_id = (int(part) for part in base.split("/")[3::2])
    user_id = client.get("/api/auth/me").json()["id"]
    report = iteration_report(
        db, project_id, iteration_id, owner_id=user_id, generated_at=datetime(2026, 10, 9)
    )
    return render_html(report)
