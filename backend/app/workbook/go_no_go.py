"""Go/No-Go rules used by the report (the interface applies the same ones in the frontend)."""

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Literal

from app.workbook.schema import GoNoGoQuestion, Template

Verdict = Literal["go", "maybe", "no_go"]


@dataclass(frozen=True)
class PhaseOneOutcome:
    verdict: Verdict | None  # None until every factor has a verdict
    answered: int
    total: int


def phase_one_outcome(template: Template, verdicts: Mapping[str, str | None]) -> PhaseOneOutcome:
    """Any NO-GO wins, then any MAYBE; GO only when every one of the nine factors is GO."""
    factors = [q for q in template.questions() if isinstance(q, GoNoGoQuestion)]
    given = [verdicts.get(factor.key) for factor in factors]
    answered = sum(1 for verdict in given if verdict is not None)
    if answered < len(factors):
        return PhaseOneOutcome(verdict=None, answered=answered, total=len(factors))
    verdict: Verdict = "no_go" if "no_go" in given else "maybe" if "maybe" in given else "go"
    return PhaseOneOutcome(verdict=verdict, answered=answered, total=len(factors))
