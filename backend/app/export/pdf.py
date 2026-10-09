"""Renders a report to HTML (Jinja2) and to PDF (WeasyPrint)."""

import re
from dataclasses import dataclass
from functools import cache
from pathlib import Path
from urllib.parse import quote

from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.export.report import VERDICT_LABEL, Report

TEMPLATES_DIR = Path(__file__).parent / "templates"
APP_NAME = "AI Project Workbook"


@cache
def _environment() -> Environment:
    # Autoescape: answers are user input and must never become markup.
    return Environment(
        loader=FileSystemLoader(TEMPLATES_DIR),
        autoescape=select_autoescape(["html", "j2"]),
        trim_blocks=True,
        lstrip_blocks=True,
    )


@dataclass(frozen=True)
class SharedPage:
    """What the shared page adds to the report: a bar with the download link."""

    pdf_url: str
    updated_on: str


def render_html(report: Report, shared: SharedPage | None = None) -> str:
    template = _environment().get_template("report.html.j2")
    return template.render(
        r=report,
        css=(TEMPLATES_DIR / "report.css").read_text(encoding="utf-8"),
        app_name=APP_NAME,
        generated_on=report.generated_at.strftime("%d/%m/%Y"),
        VERDICT_LABEL=VERDICT_LABEL,
        shared=shared,
    )


def render_not_found() -> str:
    return _environment().get_template("share_not_found.html.j2").render(app_name=APP_NAME)


def render_pdf(report: Report) -> bytes:
    # Imported here: WeasyPrint needs system libraries (Pango) that only PDF generation uses.
    from weasyprint import HTML, URLFetcher

    # Everything the report needs is inline (CSS, logo as a data: URI): never go online or read
    # local files, whatever a user-supplied image might reference.
    offline = URLFetcher(allowed_protocols=["data"])
    pdf: bytes = HTML(string=render_html(report), url_fetcher=offline).write_pdf()
    return pdf


_UNSAFE = re.compile(r'[\\/:*?"<>|\x00-\x1f]+')


def pdf_filename(report: Report) -> str:
    """For example "Churn - Iterazione 1 - 2026-10-08.pdf"."""
    parts = [report.project_name, report.iteration_title, report.generated_at.strftime("%Y-%m-%d")]
    name = " - ".join(_UNSAFE.sub(" ", part).strip() for part in parts)
    return re.sub(r"\s+", " ", name)[:150] + ".pdf"


def attachment_header(filename: str) -> str:
    """RFC 6266: an ASCII fallback plus the UTF-8 name for accented project names."""
    ascii_name = filename.encode("ascii", "replace").decode()
    return f"attachment; filename=\"{ascii_name}\"; filename*=UTF-8''{quote(filename)}"
