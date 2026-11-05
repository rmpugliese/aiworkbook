"""The fillable workbook PDF: which form field holds the answer to which question.

Only field names and question keys live here, never the workbook's own text. The browser reads the
form (the file stays on the user's computer) and sends every field as name → text, or name → bool
for check boxes; `map_fields` turns that into answers for template v1.
"""

from dataclasses import dataclass, field
from typing import Literal

Verdict = Literal["go", "maybe", "no_go"]
FieldValue = str | bool


def _text(number: int) -> str:
    return f"Text Field {number}"


def _box(number: int) -> str:
    return f"Check Box {number}"


# Text fields → question. The model performance answer spans two pages, so two fields.
TEXT_FIELDS: dict[str, str] = {
    _text(2): "p1.objectives.business_objectives.problem",
    _text(3): "p1.objectives.success_criteria.measures",
    _text(4): "p1.objectives.cost_benefit.budget",
    _text(5): "p1.objectives.cost_benefit.roi",
    _text(6): "p1.cognitive.cognitive_requirements.why_ai",
    _text(7): "p1.cognitive.cognitive_requirements.non_ai_alternatives",
    _text(8): "p1.cognitive.cognitive_requirements.non_cognitive_parts",
    _text(9): "p1.cognitive.cognitive_requirements.automation_alternatives",
    _text(10): "p1.cognitive.cognitive_objectives.objectives",
    _text(11): "p1.cognitive.cognitive_outcomes.outcomes",
    _text(12): "p1.cognitive.ai_success_criteria.criteria",
    _text(13): "p1.cognitive.ai_patterns.patterns",
    _text(14): "p1.situation.resources.schedule_constraints",
    _text(15): "p1.situation.resources.technology",
    _text(16): "p1.situation.resources.skills",
    _text(17): "p1.situation.schedule.team",
    _text(18): "p1.performance.model_performance.metrics",
    _text(19): "p1.performance.model_performance.metrics",
    _text(20): "p1.performance.kpis.business",
    _text(21): "p1.performance.kpis.technology",
    _text(22): "p1.trustworthy.framework.framework",
    _text(23): "p1.trustworthy.ethics.harms",
    _text(24): "p1.trustworthy.failure_modes.handling",
    _text(25): "p1.trustworthy.failure_modes.risks",
    _text(26): "p1.trustworthy.failure_modes.human_in_the_loop",
    _text(27): "p1.trustworthy.failure_modes.bias",
    _text(28): "p1.trustworthy.compliance.regulations",
    _text(29): "p1.trustworthy.transparency.data_sources",
    _text(30): "p1.trustworthy.transparency.data_selection",
    _text(31): "p1.trustworthy.explainability.requirements",
    _text(32): "p2.initial_data.collect.data_inventory",
    _text(33): "p2.initial_data.describe.data_nature",
    _text(34): "p2.initial_data.explore.findings",
    _text(35): "p2.data_quality.verify.quality_and_needs",
    _text(36): "p2.ml_data.training_test.needs",
    _text(37): "p2.ml_data.edge.needs",
    _text(38): "p2.ml_data.pretrained.models",
    # Fields at the top of a page belong to the task of the page before.
    _text(76): "p3.selection.select.selection",
    _text(40): "p3.cleansing.clean.methods_and_pipeline",
    _text(41): "p3.cleansing.enhance.methods",
    _text(42): "p3.labeling.label.method",
    _text(43): "p4.technique.algorithm.choice",
    _text(44): "p4.technique.ensemble.configuration",
    _text(45): "p4.technique.automl.usage",
    _text(46): "p4.technique.fine_tuning.approach",
    _text(47): "p4.technique.generative_ai.approach",
    _text(48): "p4.technique.generative_ai.prompt_engineering",
    _text(49): "p4.technique.generative_ai.chaining",
    _text(50): "p4.test_design.design.approach",
    _text(51): "p4.training.build.results",
    _text(52): "p4.hyperparameters.optimize.results",
    _text(53): "p5.evaluation.performance.measures",
    _text(54): "p5.evaluation.kpi_measurement.business",
    _text(56): "p5.evaluation.kpi_measurement.technology",
    _text(58): "p5.evaluation.iteration.approach",
    _text(60): "p5.evaluation.process_review.approvals",
    _text(62): "p6.operationalization.plan.mode",
    _text(63): "p6.operationalization.plan.it_processes",
    _text(64): "p6.operationalization.scaffolding.activities",
    _text(66): "p6.monitoring.plan.approach",
    _text(67): "p6.monitoring.governance.ownership",
    _text(68): "p6.next_iteration.next_steps.plan",
    _text(70): "p6.report.project_review.post_mortem",
}

VERDICT_COLUMNS: tuple[Verdict, ...] = ("go", "maybe", "no_go")


@dataclass(frozen=True)
class GoNoGoFields:
    """One factor: a check box and a notes field per column (GO, MAYBE, NO-GO)."""

    boxes: tuple[str, str, str]
    notes: tuple[str, str, str]


def _factor(boxes: tuple[int, int, int], notes: tuple[int, int, int]) -> GoNoGoFields:
    return GoNoGoFields(
        boxes=(_box(boxes[0]), _box(boxes[1]), _box(boxes[2])),
        notes=(_text(notes[0]), _text(notes[1]), _text(notes[2])),
    )


GO_NO_GO_FIELDS: dict[str, GoNoGoFields] = {
    "p1.go_no_go.business_feasibility.problem_definition": _factor((1, 2, 3), (81, 82, 83)),
    "p1.go_no_go.business_feasibility.willingness_to_adopt": _factor((7, 8, 9), (87, 88, 89)),
    "p1.go_no_go.business_feasibility.roi": _factor((10, 11, 12), (90, 91, 92)),
    "p1.go_no_go.data_feasibility.data_measures_need": _factor((13, 14, 15), (93, 94, 95)),
    "p1.go_no_go.data_feasibility.quantity_and_access": _factor((16, 17, 18), (96, 97, 98)),
    "p1.go_no_go.data_feasibility.quality": _factor((19, 20, 21), (99, 100, 101)),
    "p1.go_no_go.execution_feasibility.technology_and_skills": _factor(
        (22, 23, 24), (102, 103, 104)
    ),
    "p1.go_no_go.execution_feasibility.timely_execution": _factor((25, 26, 27), (105, 106, 107)),
    # The form names the last notes field 1010, not 110.
    "p1.go_no_go.execution_feasibility.deployment_sense": _factor((28, 29, 30), (108, 109, 1010)),
}

PATTERNS_KEY = "p1.cognitive.ai_patterns.patterns"

# Pattern option → how its name may appear in the text, in Italian or English (lowercase).
PATTERN_NAMES: dict[str, tuple[str, ...]] = {
    "conversational": ("conversational", "conversazion"),
    "recognition": ("recognition", "riconosciment"),
    "predictive": ("predictive", "predittiv"),
    "goal_driven": ("goal-driven", "goal driven", "orientati agli obiettivi"),
    "hyper_personalization": (
        "hyperpersonali",
        "hyper-personali",
        "hyper personali",
        "iperpersonalizz",
        "iper-personalizz",
    ),
    "autonomous": ("autonomous", "sistemi autonomi", "sistema autonomo"),
    "anomalies": ("anomal",),
}


def all_field_names() -> set[str]:
    names = set(TEXT_FIELDS)
    for factor in GO_NO_GO_FIELDS.values():
        names.update(factor.boxes)
        names.update(factor.notes)
    return names


class UnknownFormError(Exception):
    """The fields are not those of the fillable workbook."""


@dataclass
class MappedAnswer:
    question_key: str
    text: str | None = None
    verdict: Verdict | None = None
    choices: list[str] | None = field(default=None)


def _clean(value: FieldValue | None) -> str:
    if not isinstance(value, str):
        return ""
    return value.replace("\r\n", "\n").replace("\r", "\n").strip()


def _patterns_in(text: str) -> list[str]:
    lowered = text.lower()
    return [key for key, names in PATTERN_NAMES.items() if any(n in lowered for n in names)]


def map_fields(fields: dict[str, FieldValue]) -> list[MappedAnswer]:
    """The answers found in the form; questions with nothing in them are left out."""
    if not all_field_names() <= fields.keys():
        raise UnknownFormError

    texts: dict[str, list[str]] = {}
    for name, key in TEXT_FIELDS.items():
        if value := _clean(fields[name]):
            texts.setdefault(key, []).append(value)

    answers: dict[str, MappedAnswer] = {
        key: MappedAnswer(question_key=key, text="\n\n".join(parts)) for key, parts in texts.items()
    }
    if patterns := answers.get(PATTERNS_KEY):
        patterns.choices = _patterns_in(patterns.text or "") or None

    for key, factor in GO_NO_GO_FIELDS.items():
        checked = [
            verdict
            for verdict, box in zip(VERDICT_COLUMNS, factor.boxes, strict=True)
            if fields[box] is True
        ]
        notes = [note for name in factor.notes if (note := _clean(fields[name]))]
        verdict = checked[0] if len(checked) == 1 else None
        if verdict or notes:
            answers[key] = MappedAnswer(
                question_key=key, text="\n\n".join(notes) or None, verdict=verdict
            )
    return list(answers.values())
