"""Structure of the CPMAI workbook template: phases > task groups > tasks > questions."""

from collections import Counter
from collections.abc import Iterable
from typing import Annotated, Literal, Self

from pydantic import BaseModel, ConfigDict, Field, model_validator

NonEmpty = Annotated[str, Field(min_length=1)]
Key = Annotated[str, Field(pattern=r"^[a-z0-9_]+$")]
QuestionKey = Annotated[str, Field(pattern=r"^p[1-6](\.[a-z0-9_]+){3}$")]


class _Model(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class ChoiceOption(_Model):
    key: Key
    label: NonEmpty


class _QuestionBase(_Model):
    key: QuestionKey
    prompt: NonEmpty
    help: NonEmpty


class TextQuestion(_QuestionBase):
    type: Literal["text"]


class GoNoGoQuestion(_QuestionBase):
    type: Literal["go_no_go"]
    factor_group: Literal["business", "data", "execution"]


class MultiChoiceQuestion(_QuestionBase):
    type: Literal["multi_choice"]
    options: Annotated[list[ChoiceOption], Field(min_length=2)]

    @model_validator(mode="after")
    def _unique_option_keys(self) -> Self:
        duplicates = _duplicates(option.key for option in self.options)
        if duplicates:
            raise ValueError(f"duplicate option keys in {self.key}: {duplicates}")
        return self


class GateCriterion(_Model):
    key: Key
    label: NonEmpty
    # Earlier phase to iterate back to when this criterion cannot be met; None means the
    # gap is resolved within the current phase.
    return_to: Annotated[int, Field(ge=1, le=5)] | None = None


class PhaseGateQuestion(_QuestionBase):
    """End-of-phase Go/No-Go: readiness criteria, verdict and the phase to iterate back to.

    Phase I has no criteria: its outcome is derived from the nine AI Go/No-Go factors.
    """

    type: Literal["phase_gate"]
    criteria: list[GateCriterion]

    @model_validator(mode="after")
    def _unique_criterion_keys(self) -> Self:
        duplicates = _duplicates(criterion.key for criterion in self.criteria)
        if duplicates:
            raise ValueError(f"duplicate criterion keys in {self.key}: {duplicates}")
        return self


Question = Annotated[
    TextQuestion | GoNoGoQuestion | MultiChoiceQuestion | PhaseGateQuestion,
    Field(discriminator="type"),
]


class Task(_Model):
    key: Key
    title: NonEmpty
    guidance: NonEmpty
    questions: list[Question]


class TaskGroup(_Model):
    key: Key
    title: NonEmpty
    summary: str | None = None
    tasks: Annotated[list[Task], Field(min_length=1)]


class Phase(_Model):
    key: Key
    number: Annotated[int, Field(ge=1, le=6)]
    title: NonEmpty
    summary: NonEmpty
    task_groups: Annotated[list[TaskGroup], Field(min_length=1)]


class Template(_Model):
    version: Annotated[int, Field(ge=1)]
    title: NonEmpty
    phases: Annotated[list[Phase], Field(min_length=6, max_length=6)]

    def questions(self) -> list[Question]:
        return [
            question
            for phase in self.phases
            for group in phase.task_groups
            for task in group.tasks
            for question in task.questions
        ]

    @model_validator(mode="after")
    def _check_structure(self) -> Self:
        numbers = [phase.number for phase in self.phases]
        if numbers != [1, 2, 3, 4, 5, 6]:
            raise ValueError(f"phases must be numbered 1-6 in order, got {numbers}")

        for phase in self.phases:
            _require_unique(f"task group keys in phase {phase.number}", phase.task_groups)
            for group in phase.task_groups:
                _require_unique(f"task keys in group {group.key}", group.tasks)
                for task in group.tasks:
                    prefix = f"p{phase.number}.{group.key}.{task.key}."
                    for question in task.questions:
                        if not question.key.startswith(prefix):
                            raise ValueError(
                                f"question key {question.key} must start with {prefix}"
                            )

            _check_phase_gate(phase)

        duplicates = _duplicates(question.key for question in self.questions())
        if duplicates:
            raise ValueError(f"duplicate question keys: {duplicates}")
        return self


def _check_phase_gate(phase: Phase) -> None:
    """Every phase ends with exactly one phase gate, as the last question of the phase."""
    questions = [q for group in phase.task_groups for task in group.tasks for q in task.questions]
    gates = [q for q in questions if isinstance(q, PhaseGateQuestion)]
    if len(gates) != 1 or questions[-1] is not gates[0]:
        raise ValueError(f"phase {phase.number} must end with exactly one phase_gate question")
    gate = gates[0]
    if phase.number == 1:
        if gate.criteria:
            raise ValueError("the phase 1 gate is derived from the Go/No-Go factors: no criteria")
        return
    if not gate.criteria:
        raise ValueError(f"the phase {phase.number} gate needs at least one criterion")
    for criterion in gate.criteria:
        if criterion.return_to is not None and criterion.return_to >= phase.number:
            raise ValueError(
                f"{gate.key}.{criterion.key} can only return to a phase before {phase.number}"
            )


def _duplicates(keys: Iterable[str]) -> list[str]:
    return sorted(key for key, count in Counter(keys).items() if count > 1)


def _require_unique(what: str, items: list[TaskGroup] | list[Task]) -> None:
    duplicates = _duplicates(item.key for item in items)
    if duplicates:
        raise ValueError(f"duplicate {what}: {duplicates}")
