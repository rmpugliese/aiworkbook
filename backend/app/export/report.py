"""A print-ready view of one iteration: what the PDF shows, independent of how it is rendered."""

from dataclasses import dataclass, field
from datetime import datetime

from app.models import Answer, Iteration, Project
from app.workbook.go_no_go import PhaseOneOutcome, Verdict, phase_one_outcome
from app.workbook.schema import (
    GoNoGoQuestion,
    MultiChoiceQuestion,
    PhaseGateQuestion,
    Question,
    Template,
)

ROMAN = ("I", "II", "III", "IV", "V", "VI")
VERDICT_LABEL: dict[str, str] = {"go": "GO", "maybe": "MAYBE", "no_go": "NO-GO"}
FACTOR_GROUP_LABEL = {"business": "Business", "data": "Dati", "execution": "Esecuzione"}
STATUS_LABEL = {"draft": "In corso", "completed": "Completata"}


@dataclass(frozen=True)
class AnswerView:
    empty: bool
    text: str | None = None
    verdict: Verdict | None = None
    chosen: list[str] = field(default_factory=list)  # option labels or satisfied criteria
    unmet: list[str] = field(default_factory=list)  # unsatisfied criteria (phase gates)
    return_to: str | None = None  # e.g. "Fase II · Comprensione dei dati"


@dataclass(frozen=True)
class QuestionView:
    key: str
    type: str
    prompt: str
    answer: AnswerView


@dataclass(frozen=True)
class TaskView:
    title: str
    questions: list[QuestionView]


@dataclass(frozen=True)
class PhaseView:
    number: int
    roman: str
    title: str
    summary: str
    anchor: str
    tasks: list[TaskView]
    status: Verdict | None
    return_to: str | None
    reason: str | None


@dataclass(frozen=True)
class FactorView:
    prompt: str
    verdict: Verdict | None


@dataclass(frozen=True)
class Branding:
    """The project owner's brand: a logo as a data: URI and a main colour, both optional."""

    logo: str | None = None
    color: str | None = None


@dataclass(frozen=True)
class Report:
    project_name: str
    client_name: str | None
    iteration_number: int
    iteration_title: str
    iteration_status: str
    user_story: str | None
    template_version: int
    template_title: str
    generated_at: datetime
    factor_groups: list[tuple[str, list[FactorView]]]
    phase_one: PhaseOneOutcome
    phases: list[PhaseView]
    branding: Branding = Branding()
    # The assistant drafted or improved part of the content (legge 132/2025, art. 13).
    ai_assisted: bool = False

    @property
    def phase_one_decided(self) -> Verdict | None:
        return self.phases[0].status


def build_report(
    project: Project,
    iteration: Iteration,
    template: Template,
    answers: list[Answer],
    generated_at: datetime,
    branding: Branding | None = None,
) -> Report:
    by_key = {answer.question_key: answer for answer in answers}
    phase_titles = {
        phase.number: f"Fase {ROMAN[phase.number - 1]} · {phase.title}" for phase in template.phases
    }

    phases: list[PhaseView] = []
    for phase in template.phases:
        tasks: list[TaskView] = []
        gate_answer: AnswerView | None = None
        for group in phase.task_groups:
            for task in group.tasks:
                views = [
                    QuestionView(
                        key=question.key,
                        type=question.type,
                        prompt=question.prompt,
                        answer=_answer_view(question, by_key.get(question.key), phase_titles),
                    )
                    for question in task.questions
                ]
                for question, view in zip(task.questions, views, strict=True):
                    if isinstance(question, PhaseGateQuestion):
                        gate_answer = view.answer
                if views:
                    tasks.append(TaskView(title=task.title, questions=views))
        phases.append(
            PhaseView(
                number=phase.number,
                roman=ROMAN[phase.number - 1],
                title=phase.title,
                summary=phase.summary,
                anchor=f"phase-{phase.number}",
                tasks=tasks,
                status=gate_answer.verdict if gate_answer else None,
                return_to=gate_answer.return_to if gate_answer else None,
                reason=gate_answer.text if gate_answer else None,
            )
        )

    factor_groups: list[tuple[str, list[FactorView]]] = []
    for group_key, label in FACTOR_GROUP_LABEL.items():
        factors = [
            FactorView(prompt=q.prompt, verdict=_verdict(by_key.get(q.key)))
            for q in template.questions()
            if isinstance(q, GoNoGoQuestion) and q.factor_group == group_key
        ]
        factor_groups.append((label, factors))

    return Report(
        project_name=project.name,
        client_name=project.client_name,
        iteration_number=iteration.number,
        iteration_title=iteration.title,
        iteration_status=STATUS_LABEL.get(iteration.status, iteration.status),
        user_story=iteration.user_story,
        template_version=template.version,
        template_title=template.title,
        generated_at=generated_at,
        factor_groups=factor_groups,
        phase_one=phase_one_outcome(template, {k: a.verdict for k, a in by_key.items()}),
        phases=phases,
        branding=branding or Branding(),
        ai_assisted=iteration.ai_assisted_at is not None,
    )


_VERDICTS: dict[str, Verdict] = {"go": "go", "maybe": "maybe", "no_go": "no_go"}


def _verdict(answer: Answer | None) -> Verdict | None:
    return _VERDICTS.get(answer.verdict) if answer and answer.verdict else None


def _answer_view(
    question: Question, answer: Answer | None, phase_titles: dict[int, str]
) -> AnswerView:
    if answer is None:
        return AnswerView(empty=True)
    chosen: list[str] = []
    unmet: list[str] = []
    choices = answer.choices or []
    if isinstance(question, MultiChoiceQuestion):
        chosen = [option.label for option in question.options if option.key in choices]
    elif isinstance(question, PhaseGateQuestion):
        chosen = [c.label for c in question.criteria if c.key in choices]
        unmet = [c.label for c in question.criteria if c.key not in choices]
    return AnswerView(
        empty=False,
        text=answer.text,
        verdict=_verdict(answer),
        chosen=chosen,
        unmet=unmet,
        return_to=phase_titles.get(answer.return_to_phase) if answer.return_to_phase else None,
    )
