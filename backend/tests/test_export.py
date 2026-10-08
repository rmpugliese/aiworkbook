import io
from datetime import datetime
from typing import Any, cast
from urllib.parse import unquote

import pytest
from fastapi.testclient import TestClient
from pypdf import PdfReader
from pypdf.generic import DictionaryObject
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.export.pdf import pdf_filename, render_html
from app.models import User
from app.services.export import iteration_report
from app.workbook.go_no_go import phase_one_outcome
from app.workbook.loader import current_template
from app.workbook.schema import GoNoGoQuestion

TEXT = "p1.objectives.business_objectives.problem"
PATTERNS = "p1.cognitive.ai_patterns.patterns"
FACTOR = "p1.go_no_go.business_feasibility.problem_definition"
GATE_3 = "p3.gate.decision.outcome"
WHEN = datetime(2026, 10, 8, 9, 30)


def weasyprint_available() -> bool:
    try:
        import weasyprint  # noqa: F401
    except OSError:  # Pango and friends are missing on this machine
        return False
    return True


needs_weasyprint = pytest.mark.skipif(
    not weasyprint_available(), reason="WeasyPrint system libraries (Pango) not installed"
)


@pytest.fixture
def ids(client: TestClient) -> tuple[int, int]:
    project = client.post(
        "/api/projects", json={"name": "Churn ÀÉ", "client_name": "ACME Spa"}
    ).json()
    iteration_id = project["iterations"][0]["id"]
    base = f"/api/projects/{project['id']}/iterations/{iteration_id}"
    client.patch(base, json={"user_story": "Come venditore voglio <b>anticipare</b> gli abbandoni"})

    def put(key: str, **fields: Any) -> None:
        assert client.put(f"{base}/answers/{key}", json=fields).status_code == 200

    put(TEXT, text="Ridurre gli abbandoni\nentro 12 mesi")
    put(PATTERNS, choices=["predictive"], text="Modello di churn")
    put(FACTOR, verdict="maybe", text="Da confermare")
    put(
        GATE_3,
        verdict="no_go",
        choices=["data_ready"],
        return_to_phase=2,
        text="Pipeline non realizzabile",
    )
    return project["id"], iteration_id


def owner_id(db: Session) -> int:
    user = db.scalar(select(User).where(User.email == "consulente@example.com"))
    assert user is not None
    return user.id


def html_for(db: Session, ids: tuple[int, int]) -> str:
    return render_html(iteration_report(db, *ids, owner_id=owner_id(db), generated_at=WHEN))


def test_phase_one_outcome_follows_the_nine_factors() -> None:
    template = current_template()
    factors = [q.key for q in template.questions() if isinstance(q, GoNoGoQuestion)]

    assert phase_one_outcome(template, {}).verdict is None
    all_go = dict.fromkeys(factors, "go")
    assert phase_one_outcome(template, all_go).verdict == "go"
    assert phase_one_outcome(template, {**all_go, factors[3]: "maybe"}).verdict == "maybe"
    worst = {**all_go, factors[3]: "maybe", factors[8]: "no_go"}
    assert phase_one_outcome(template, worst).verdict == "no_go"


def test_report_presents_each_answer_type(db: Session, ids: tuple[int, int]) -> None:
    report = iteration_report(db, *ids, owner_id=owner_id(db), generated_at=WHEN)
    questions = {q.key: q for p in report.phases for t in p.tasks for q in t.questions}

    assert questions[TEXT].answer.text == "Ridurre gli abbandoni\nentro 12 mesi"
    assert questions[PATTERNS].answer.chosen == ["Analisi predittiva e supporto alle decisioni"]
    assert questions[FACTOR].answer.verdict == "maybe"
    gate = questions[GATE_3].answer
    assert gate.verdict == "no_go"
    assert gate.return_to == "Fase II · Comprensione dei dati"
    assert len(gate.chosen) == 1 and len(gate.unmet) == 5
    assert questions["p2.ml_data.edge.needs"].answer.empty
    assert report.phases[2].status == "no_go"
    assert report.phase_one.answered == 1 and report.phase_one.verdict is None


def test_html_has_every_section_and_marks_missing_answers(
    db: Session, ids: tuple[int, int]
) -> None:
    html = html_for(db, ids)

    for heading in ["Indice", "User story", "Riepilogo Go/No-Go", "Esito delle fasi"]:
        assert heading in html
    for roman in ["I", "II", "III", "IV", "V", "VI"]:
        assert f"Fase {roman} ·" in html
    assert "Ridurre gli abbandoni\nentro 12 mesi" in html
    assert "Non compilato" in html
    assert "da completare (1 di 9)" in html
    assert "Si torna a: Fase II · Comprensione dei dati" in html


def test_user_text_is_escaped(db: Session, ids: tuple[int, int]) -> None:
    html = html_for(db, ids)

    assert "<b>anticipare</b>" not in html
    assert "&lt;b&gt;anticipare&lt;/b&gt;" in html


def test_stylesheet_is_not_escaped(db: Session, ids: tuple[int, int]) -> None:
    # Escaped quotes inside <style> silently break fonts, page headers and the page numbers.
    html = html_for(db, ids)

    assert 'content: "Pagina " counter(page)' in html
    assert "&#34;" not in html.split("</style>")[0]


def test_filename_is_readable_and_safe(db: Session, ids: tuple[int, int]) -> None:
    report = iteration_report(db, *ids, owner_id=owner_id(db), generated_at=WHEN)

    assert pdf_filename(report) == "Churn ÀÉ - Iterazione 1 - 2026-10-08.pdf"


def test_export_of_another_projects_iteration_returns_404(
    client: TestClient, ids: tuple[int, int]
) -> None:
    other = client.post("/api/projects", json={"name": "Altro"}).json()

    response = client.get(f"/api/projects/{other['id']}/iterations/{ids[1]}/export.pdf")

    assert response.status_code == 404


@needs_weasyprint
def test_export_returns_a_pdf_with_titles_and_answers(
    client: TestClient, ids: tuple[int, int]
) -> None:
    response = client.get(f"/api/projects/{ids[0]}/iterations/{ids[1]}/export.pdf")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")
    disposition = response.headers["content-disposition"]
    assert disposition.startswith("attachment;")
    assert unquote(disposition.split("filename*=UTF-8''")[1]).startswith("Churn ÀÉ - Iterazione 1")

    reader = PdfReader(io.BytesIO(response.content))
    text = " ".join(page.extract_text() for page in reader.pages)
    assert len(reader.pages) >= 8  # cover, contents, story, summary, six phases
    for expected in ["Riepilogo Go/No-Go", "Fase VI", "Ridurre gli abbandoni", "Non compilato"]:
        assert expected in text
    assert f"Pagina 2 di {len(reader.pages)}" in text  # running footer
    resources = cast(DictionaryObject, reader.pages[3]["/Resources"].get_object())
    assert "Times" not in str(resources["/Font"].get_object())  # the sans-serif stack applies
