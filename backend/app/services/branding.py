"""The installation's brand: a logo and a main colour, shown in the app and on every document.

Logos are recognised by their content, never by the file name. SVG is accepted only as plain
vector markup: no scripts, event handlers, `javascript:` links or DTDs (which could pull external
entities while the PDF is rendered). It is always displayed through `<img>` as well, where SVG
cannot run code, so these checks are a second line of defence.
"""

import base64
import re

from sqlalchemy.orm import Session

from app.export.report import Branding
from app.models import SiteSettings, User
from app.models.project import utcnow
from app.services.errors import InvalidRequestError

MAX_LOGO_BYTES = 1024 * 1024
MIN_CONTRAST = 4.5  # WCAG AA for normal text: buttons and the shared page's bar use white text

_HEX = re.compile(r"^#[0-9a-fA-F]{6}$")
_SVG_ROOT = re.compile(
    r"^\s*(<\?xml[^>]*\?>\s*)?(<!--.*?-->\s*)*<svg[\s>]", re.DOTALL | re.IGNORECASE
)
# Editors such as Illustrator add a plain DOCTYPE: harmless without an internal subset, so it is
# removed. One with an internal subset ("[...]") can declare entities and is refused below.
_PLAIN_DOCTYPE = re.compile(r"<!DOCTYPE[^\[>]*>\s*", re.IGNORECASE)
_SVG_FORBIDDEN = re.compile(
    r"<!DOCTYPE|<!ENTITY|<script|<foreignObject|\bon[a-z]+\s*=|javascript:|data:text/html"
    # Anything fetched from elsewhere: linked images, fonts or stylesheets.
    r"|(?:href\s*=\s*[\"']\s*|url\(\s*[\"']?\s*|@import\s*[\"']?\s*)(?:[a-z]+:(?!#)|//)",
    re.IGNORECASE,
)


def prepare_logo(data: bytes) -> tuple[bytes, str]:
    """The logo to store and its media type, or InvalidRequestError if it is not a safe image."""
    if not data:
        raise InvalidRequestError("Il file è vuoto.")
    if len(data) > MAX_LOGO_BYTES:
        raise InvalidRequestError("Il logo supera 1 MB: usa un'immagine più leggera.")
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return data, "image/png"
    if data.startswith(b"\xff\xd8\xff"):
        return data, "image/jpeg"
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError:
        text = None
    if text is not None:
        text = _PLAIN_DOCTYPE.sub("", text, count=1)
    if text is not None and _SVG_ROOT.match(text):
        if _SVG_FORBIDDEN.search(text):
            raise InvalidRequestError(
                "Questo SVG contiene script, risorse esterne o dichiarazioni non ammesse: "
                "esportalo di nuovo come SVG semplice, oppure usa un PNG."
            )
        return text.encode(), "image/svg+xml"
    raise InvalidRequestError("Formato non supportato: usa un'immagine PNG, JPEG o SVG.")


def site(db: Session) -> SiteSettings:
    """The installation's settings row, created on first use."""
    row = db.get(SiteSettings, 1)
    if row is None:
        row = SiteSettings(id=1)
        db.add(row)
        db.commit()
    return row


def set_logo(db: Session, data: bytes) -> SiteSettings:
    row = site(db)
    row.logo, row.logo_content_type = prepare_logo(data)
    row.logo_updated_at = utcnow()
    db.commit()
    return row


def clear_logo(db: Session) -> SiteSettings:
    row = site(db)
    row.logo = None
    row.logo_content_type = None
    row.logo_updated_at = None
    db.commit()
    return row


def set_brand_color(db: Session, value: str | None) -> SiteSettings:
    row = site(db)
    row.brand_color = normalize_color(value)
    db.commit()
    return row


def logo_data_uri(row: SiteSettings) -> str | None:
    if row.logo is None or row.logo_content_type is None:
        return None
    return f"data:{row.logo_content_type};base64,{base64.b64encode(row.logo).decode()}"


def document_branding(db: Session) -> Branding:
    """The brand on every PDF and shared page: the installation's."""
    row = site(db)
    return Branding(logo=logo_data_uri(row), color=row.brand_color)


def _luminance(hex_color: str) -> float:
    def channel(value: int) -> float:
        c = value / 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

    r, g, b = (int(hex_color[i : i + 2], 16) for i in (1, 3, 5))
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)


def contrast_with_white(hex_color: str) -> float:
    return 1.05 / (_luminance(hex_color) + 0.05)


def normalize_color(value: str | None) -> str | None:
    """A valid brand colour in lowercase, None to clear it, or InvalidRequestError."""
    if value is None or not value.strip():
        return None
    value = value.strip()
    if not _HEX.match(value):
        raise InvalidRequestError("Il colore deve essere nel formato #RRGGBB, es. #1d4f7a.")
    ratio = contrast_with_white(value)
    if ratio < MIN_CONTRAST:
        raise InvalidRequestError(
            f"Colore troppo chiaro: il testo bianco avrebbe un contrasto di {ratio:.1f}:1 "
            f"(serve almeno {MIN_CONTRAST}:1). Scegli una tonalità più scura."
        )
    return value.lower()


def update_profile(db: Session, user: User, *, display_name: str | None) -> User:
    user.display_name = display_name or None
    db.commit()
    return user
