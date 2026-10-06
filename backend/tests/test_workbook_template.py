import copy
from collections import Counter
from typing import Any

import pytest
import yaml
from pydantic import ValidationError

from app.workbook.loader import TEMPLATES_DIR, available_versions, current_template
from app.workbook.schema import GoNoGoQuestion, MultiChoiceQuestion, PhaseGateQuestion, Template


@pytest.fixture(scope="module")
def raw_v1() -> dict[str, Any]:
    data: dict[str, Any] = yaml.safe_load((TEMPLATES_DIR / "v1.yaml").read_text(encoding="utf-8"))
    return data


def first_task(raw: dict[str, Any]) -> dict[str, Any]:
    task: dict[str, Any] = raw["phases"][0]["task_groups"][0]["tasks"][0]
    return task


# --- The real v1 template -------------------------------------------------------------


def test_v1_is_the_current_template() -> None:
    assert available_versions() == [1]
    assert current_template().version == 1


def test_has_six_phases_in_order() -> None:
    assert [phase.number for phase in current_template().phases] == [1, 2, 3, 4, 5, 6]


def test_question_keys_are_unique() -> None:
    keys = [question.key for question in current_template().questions()]
    assert len(keys) == len(set(keys))


def test_has_nine_go_no_go_factors_three_per_group() -> None:
    factors = [q for q in current_template().questions() if isinstance(q, GoNoGoQuestion)]
    assert Counter(q.factor_group for q in factors) == {"business": 3, "data": 3, "execution": 3}


def test_has_one_multi_choice_question_with_the_seven_ai_patterns() -> None:
    choices = [q for q in current_template().questions() if isinstance(q, MultiChoiceQuestion)]
    assert len(choices) == 1
    assert len(choices[0].options) == 7


def test_every_task_has_guidance_and_every_question_has_prompt_and_help() -> None:
    template = current_template()
    for phase in template.phases:
        for group in phase.task_groups:
            for task in group.tasks:
                assert task.guidance.strip(), task.key
                for question in task.questions:
                    assert question.prompt.strip(), question.key
                    assert question.help.strip(), question.key


def test_every_phase_ends_with_a_gate() -> None:
    for phase in current_template().phases:
        last_question = phase.task_groups[-1].tasks[-1].questions[-1]
        assert isinstance(last_question, PhaseGateQuestion), phase.number
        assert last_question.key == f"p{phase.number}.gate.decision.outcome"


def test_gate_criteria_only_return_to_earlier_phases() -> None:
    for phase in current_template().phases:
        gate = phase.task_groups[-1].tasks[-1].questions[-1]
        assert isinstance(gate, PhaseGateQuestion)
        if phase.number == 1:
            assert gate.criteria == []
            continue
        assert gate.criteria, phase.number
        for criterion in gate.criteria:
            assert criterion.return_to is None or 1 <= criterion.return_to < phase.number


def test_only_the_final_report_task_has_no_questions() -> None:
    empty = [
        f"{group.key}.{task.key}"
        for phase in current_template().phases
        for group in phase.task_groups
        for task in group.tasks
        if not task.questions
    ]
    assert empty == ["report.final_report"]


# --- Validators -----------------------------------------------------------------------


def test_rejects_duplicate_question_keys(raw_v1: dict[str, Any]) -> None:
    raw = copy.deepcopy(raw_v1)
    questions = first_task(raw)["questions"]
    questions.append(copy.deepcopy(questions[0]))

    with pytest.raises(ValidationError, match="duplicate question keys"):
        Template.model_validate(raw)


def test_rejects_key_with_wrong_prefix(raw_v1: dict[str, Any]) -> None:
    raw = copy.deepcopy(raw_v1)
    first_task(raw)["questions"][0]["key"] = "p2.objectives.business_objectives.problem"

    with pytest.raises(ValidationError, match="must start with"):
        Template.model_validate(raw)


def test_rejects_multi_choice_without_options(raw_v1: dict[str, Any]) -> None:
    raw = copy.deepcopy(raw_v1)
    question = first_task(raw)["questions"][0]
    question["type"] = "multi_choice"

    with pytest.raises(ValidationError, match="options"):
        Template.model_validate(raw)


def test_rejects_go_no_go_without_factor_group(raw_v1: dict[str, Any]) -> None:
    raw = copy.deepcopy(raw_v1)
    first_task(raw)["questions"][0]["type"] = "go_no_go"

    with pytest.raises(ValidationError, match="factor_group"):
        Template.model_validate(raw)


def test_rejects_unknown_fields(raw_v1: dict[str, Any]) -> None:
    raw = copy.deepcopy(raw_v1)
    first_task(raw)["questions"][0]["placeholder"] = "..."

    with pytest.raises(ValidationError, match="placeholder"):
        Template.model_validate(raw)


def test_rejects_phases_out_of_order(raw_v1: dict[str, Any]) -> None:
    raw = copy.deepcopy(raw_v1)
    raw["phases"][0], raw["phases"][1] = raw["phases"][1], raw["phases"][0]

    with pytest.raises(ValidationError, match="numbered 1-6"):
        Template.model_validate(raw)


def _gate(raw: dict[str, Any], phase_index: int) -> dict[str, Any]:
    last_task = raw["phases"][phase_index]["task_groups"][-1]["tasks"][-1]
    gate: dict[str, Any] = last_task["questions"][-1]
    return gate


def test_rejects_phase_without_gate(raw_v1: dict[str, Any]) -> None:
    raw = copy.deepcopy(raw_v1)
    raw["phases"][2]["task_groups"].pop()

    with pytest.raises(ValidationError, match="must end with exactly one phase_gate"):
        Template.model_validate(raw)


def test_rejects_gate_returning_to_a_later_phase(raw_v1: dict[str, Any]) -> None:
    raw = copy.deepcopy(raw_v1)
    _gate(raw, 2)["criteria"][0]["return_to"] = 3  # phase III gate returning to phase III

    with pytest.raises(ValidationError, match="can only return to a phase before 3"):
        Template.model_validate(raw)


def test_rejects_criteria_on_the_phase_one_gate(raw_v1: dict[str, Any]) -> None:
    raw = copy.deepcopy(raw_v1)
    _gate(raw, 0)["criteria"] = [{"key": "extra", "label": "Criterio"}]

    with pytest.raises(ValidationError, match="phase 1 gate"):
        Template.model_validate(raw)
