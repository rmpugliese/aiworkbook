from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Project
from app.workbook.loader import current_template, find_question
from app.workbook.pdf_form import (
    GO_NO_GO_FIELDS,
    PATTERNS_KEY,
    TEXT_FIELDS,
    UnknownFormError,
    all_field_names,
    map_fields,
)
from app.workbook.schema import GoNoGoQuestion, MultiChoiceQuestion, TextQuestion

PROBLEM_FIELD = "Text Field 2"
METRICS_FIELDS = ("Text Field 18", "Text Field 19")
ROI_FACTOR = GO_NO_GO_FIELDS["p1.go_no_go.business_feasibility.roi"]


def empty_form() -> dict[str, Any]:
    """Every field of the workbook form, as the browser sends it for a blank PDF."""
    return {name: (False if name.startswith("Check Box") else "") for name in all_field_names()}


def by_key(answers: list[Any]) -> dict[str, Any]:
    return {answer.question_key: answer for answer in answers}


# --- The mapping ------------------------------------------------------------------------


def test_every_field_points_to_a_question_of_the_right_type() -> None:
    version = current_template().version
    for key in TEXT_FIELDS.values():
        found = find_question(version, key)
        assert found is not None, key
        assert isinstance(found[0], TextQuestion | MultiChoiceQuestion), key
    for key in GO_NO_GO_FIELDS:
        found = find_question(version, key)
        assert found is not None, key
        assert isinstance(found[0], GoNoGoQuestion), key


def test_no_field_is_used_twice() -> None:
    names = list(TEXT_FIELDS)
    for factor in GO_NO_GO_FIELDS.values():
        names += [*factor.boxes, *factor.notes]
    assert len(names) == len(set(names)) == 117


def test_texts_are_cleaned_and_split_fields_joined() -> None:
    form = empty_form()
    form[PROBLEM_FIELD] = "  Troppi ticket ripetitivi.\r\nServe smistarli.  "
    form[METRICS_FIELDS[0]] = "Precisione almeno 0,9"
    form[METRICS_FIELDS[1]] = "Pochi falsi negativi"
    answers = by_key(map_fields(form))

    assert answers["p1.objectives.business_objectives.problem"].text == (
        "Troppi ticket ripetitivi.\nServe smistarli."
    )
    metrics = answers["p1.performance.model_performance.metrics"]
    assert metrics.text == "Precisione almeno 0,9\n\nPochi falsi negativi"
    assert len(answers) == 2  # empty fields add nothing


def test_one_checked_box_gives_the_verdict() -> None:
    form = empty_form()
    form[ROI_FACTOR.boxes[1]] = True
    form[ROI_FACTOR.notes[1]] = "Da confermare con il budget 2027"
    answer = by_key(map_fields(form))["p1.go_no_go.business_feasibility.roi"]
    assert answer.verdict == "maybe"
    assert answer.text == "Da confermare con il budget 2027"


def test_more_checked_boxes_keep_only_the_notes() -> None:
    form = empty_form()
    form[ROI_FACTOR.boxes[0]] = True
    form[ROI_FACTOR.boxes[2]] = True
    form[ROI_FACTOR.notes[0]] = "Buono"
    form[ROI_FACTOR.notes[2]] = "Ma costoso"
    answer = by_key(map_fields(form))["p1.go_no_go.business_feasibility.roi"]
    assert answer.verdict is None
    assert answer.text == "Buono\n\nMa costoso"


def test_patterns_named_in_the_text_are_checked() -> None:
    form = empty_form()
    form["Text Field 13"] = "Recognition dei documenti e analisi predittiva dei ritardi"
    answer = by_key(map_fields(form))[PATTERNS_KEY]
    assert answer.choices == ["recognition", "predictive"]
    assert answer.text.startswith("Recognition")


def test_another_form_is_not_recognised() -> None:
    form = empty_form()
    del form[PROBLEM_FIELD]
    with pytest.raises(UnknownFormError):
        map_fields(form)
    with pytest.raises(UnknownFormError):
        map_fields({"Nome": "Mario", "Privacy": True})


# --- The API ----------------------------------------------------------------------------


def import_workbook(client: TestClient, fields: dict[str, Any], **extra: Any):  # type: ignore[no-untyped-def]
    return client.post(
        "/api/projects/import-workbook",
        json={"name": "Smistamento ticket", **extra, "fields": fields},
    )


def test_import_creates_a_project_of_the_user(client: TestClient, other_client: TestClient) -> None:
    form = empty_form()
    form[PROBLEM_FIELD] = "Troppi ticket ripetitivi"
    form[ROI_FACTOR.boxes[0]] = True
    response = import_workbook(client, form, client_name="Velaria")
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["answers"] == 2
    project = body["project"]
    assert project["name"] == "Smistamento ticket" and project["client_name"] == "Velaria"
    [iteration] = project["iterations"]

    base = f"/api/projects/{project['id']}/iterations/{iteration['id']}"
    answers = {a["question_key"]: a for a in client.get(f"{base}/answers").json()}
    assert (
        answers["p1.objectives.business_objectives.problem"]["text"] == "Troppi ticket ripetitivi"
    )
    assert answers["p1.go_no_go.business_feasibility.roi"]["verdict"] == "go"
    assert other_client.get(base).status_code == 404


def test_unknown_or_empty_form_creates_nothing(client: TestClient, db: Session) -> None:
    unknown = import_workbook(client, {"Nome": "Mario"})
    assert unknown.status_code == 422
    assert "non riconosciuto" in unknown.json()["detail"]

    empty = import_workbook(client, empty_form())
    assert empty.status_code == 422
    assert "campi compilati" in empty.json()["detail"]
    assert db.scalar(select(func.count()).select_from(Project)) == 0


def test_limits_and_sign_in(client: TestClient, anon_client: TestClient) -> None:
    form = empty_form()
    form[PROBLEM_FIELD] = "x" * 20_001
    assert import_workbook(client, form).status_code == 422
    too_many = {f"Campo {n}": "" for n in range(301)}
    assert import_workbook(client, too_many).status_code == 422
    assert import_workbook(anon_client, empty_form()).status_code == 401
