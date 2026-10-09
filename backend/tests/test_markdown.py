import pytest
from fastapi.testclient import TestClient

from app.export.markdown import render_markdown
from tests.test_export import needs_weasyprint

TEXT = "p1.objectives.business_objectives.problem"
TABLE = "| KPI | Oggi | Obiettivo |\n|---|---|---|\n| Chiamate | 1000 | 600 |"


def test_tables_lists_and_emphasis() -> None:
    html = render_markdown(f"**Obiettivo** e *vincoli*:\n\n- uno\n- due\n\n{TABLE}")
    assert "<strong>Obiettivo</strong>" in html and "<em>vincoli</em>" in html
    assert "<ul>" in html and "<li>uno</li>" in html
    assert "<table>" in html and "<th>KPI</th>" in html and "<td>600</td>" in html


def test_a_single_line_break_stays() -> None:
    assert "prima<br />\nseconda" in render_markdown("prima\nseconda")


@pytest.mark.parametrize(
    "text",
    [
        "<script>alert(1)</script>",
        '<img src=x onerror="alert(1)">',
        "<b>grassetto html</b>",
    ],
)
def test_html_is_shown_as_text(text: str) -> None:
    html = render_markdown(text)
    assert "<script" not in html and "<img" not in html and "<b>" not in html
    assert "&lt;" in html


def test_dangerous_links_are_not_links() -> None:
    html = render_markdown("[clic](javascript:alert(1)) e [ok](https://example.com)")
    assert 'href="javascript:' not in html
    assert '<a href="https://example.com">ok</a>' in html


def test_empty() -> None:
    assert render_markdown(None) == "" and render_markdown("") == ""


@pytest.fixture
def base(client: TestClient) -> str:
    project = client.post("/api/projects", json={"name": "Churn"}).json()
    path = f"/api/projects/{project['id']}/iterations/{project['iterations'][0]['id']}"
    client.patch(path, json={"user_story": "Come **operatore** voglio\n- meno chiamate"})
    client.put(f"{path}/answers/{TEXT}", json={"text": f"Misure:\n\n{TABLE}\n\n<i>no</i>"})
    return path


def test_shared_page_renders_markdown(
    client: TestClient, anon_client: TestClient, base: str
) -> None:
    url = client.post(f"{base}/shares", json={"label": "Cliente"}).json()["url"]
    page = anon_client.get("/s/" + url.rsplit("/s/", 1)[1]).text
    assert "<th>KPI</th>" in page
    assert "<strong>operatore</strong>" in page and "<li>meno chiamate</li>" in page
    assert "&lt;i&gt;no&lt;/i&gt;" in page


@needs_weasyprint
def test_pdf_with_a_table(client: TestClient, base: str) -> None:
    import io

    from pypdf import PdfReader

    response = client.get(f"{base}/export.pdf")
    assert response.status_code == 200
    text = "".join(page.extract_text() for page in PdfReader(io.BytesIO(response.content)).pages)
    assert "KPI" in text and "Obiettivo" in text and "600" in text
    assert "|---|" not in text
