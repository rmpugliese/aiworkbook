"""Renders a report to HTML (Jinja2) and to PDF (WeasyPrint)."""

import re
from functools import cache
from pathlib import Path

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


def render_html(report: Report) -> str:
    template = _environment().get_template("report.html.j2")
    return template.render(
        r=report,
        css=(TEMPLATES_DIR / "report.css").read_text(encoding="utf-8"),
        app_name=APP_NAME,
        generated_on=report.generated_at.strftime("%d/%m/%Y"),
        VERDICT_LABEL=VERDICT_LABEL,
    )


def render_pdf(report: Report) -> bytes:
    # Imported here: WeasyPrint needs system libraries (Pango) that only PDF generation uses.
    from weasyprint import HTML

    pdf: bytes = HTML(string=render_html(report)).write_pdf()
    return pdf


_UNSAFE = re.compile(r'[\\/:*?"<>|\x00-\x1f]+')


def pdf_filename(report: Report) -> str:
    """For example "Churn - Iterazione 1 - 2026-10-08.pdf"."""
    parts = [report.project_name, report.iteration_title, report.generated_at.strftime("%Y-%m-%d")]
    name = " - ".join(_UNSAFE.sub(" ", part).strip() for part in parts)
    return re.sub(r"\s+", " ", name)[:150] + ".pdf"
