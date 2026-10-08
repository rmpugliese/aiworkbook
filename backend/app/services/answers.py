"""Reading and writing the answers of an iteration, validated against its workbook template."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Answer, Iteration
from app.models.project import utcnow
from app.schemas.answers import AnswerIn
from app.services.errors import InvalidRequestError, NotFoundError
from app.services.projects import get_iteration
from app.workbook.loader import find_question
from app.workbook.schema import GoNoGoQuestion, MultiChoiceQuestion, PhaseGateQuestion, Question


def list_answers(db: Session, project_id: int, iteration_id: int) -> list[Answer]:
    get_iteration(db, project_id, iteration_id)
    return list(
        db.scalars(
            select(Answer).where(Answer.iteration_id == iteration_id).order_by(Answer.question_key)
        )
    )


def save_answer(
    db: Session, project_id: int, iteration_id: int, question_key: str, data: AnswerIn
) -> Answer | None:
    """Creates, replaces or (when every field is empty) deletes an answer.

    Returns the stored answer, or None if the answer is now empty.
    """
    iteration = get_iteration(db, project_id, iteration_id)
    found = find_question(iteration.template_version, question_key)
    if found is None:
        raise NotFoundError(
            f"question {question_key} is not in template v{iteration.template_version}"
        )
    question, phase_number = found
    cleaned = _validate(question, phase_number, data)

    answer = db.scalar(
        select(Answer).where(
            Answer.iteration_id == iteration_id, Answer.question_key == question_key
        )
    )
    if _is_empty(cleaned):
        if answer is not None:
            db.delete(answer)
        result = None
    else:
        if answer is None:
            answer = Answer(iteration_id=iteration_id, question_key=question_key)
            db.add(answer)
        answer.text = cleaned.text
        answer.verdict = cleaned.verdict
        answer.choices = cleaned.choices
        answer.return_to_phase = cleaned.return_to_phase
        answer.updated_at = utcnow()
        result = answer

    _touch(iteration)
    db.commit()
    return result


def _validate(question: Question, phase_number: int, data: AnswerIn) -> AnswerIn:
    """Rejects fields the question type does not accept and normalises empty values."""
    text = data.text if data.text and data.text.strip() else None
    choices = data.choices or None

    accepts_verdict = isinstance(question, GoNoGoQuestion | PhaseGateQuestion)
    accepts_choices = isinstance(question, MultiChoiceQuestion | PhaseGateQuestion)
    accepts_return = isinstance(question, PhaseGateQuestion)

    if data.verdict is not None and not accepts_verdict:
        raise InvalidRequestError(f"{question.type} questions do not take a verdict")
    if choices is not None:
        if not accepts_choices:
            raise InvalidRequestError(f"{question.type} questions do not take choices")
        allowed = _allowed_choices(question)
        unknown = sorted(set(choices) - allowed)
        if unknown:
            raise InvalidRequestError(f"unknown choices for {question.key}: {unknown}")
        if len(set(choices)) != len(choices):
            raise InvalidRequestError("choices must not repeat")
    if data.return_to_phase is not None:
        if not accepts_return:
            raise InvalidRequestError(f"{question.type} questions do not take a return phase")
        if not 1 <= data.return_to_phase < phase_number:
            raise InvalidRequestError(f"phase {phase_number} can only return to an earlier phase")

    return AnswerIn(
        text=text, verdict=data.verdict, choices=choices, return_to_phase=data.return_to_phase
    )


def _allowed_choices(question: Question) -> set[str]:
    if isinstance(question, MultiChoiceQuestion):
        return {option.key for option in question.options}
    if isinstance(question, PhaseGateQuestion):
        return {criterion.key for criterion in question.criteria}
    return set()


def _is_empty(data: AnswerIn) -> bool:
    return (
        data.text is None
        and data.verdict is None
        and data.choices is None
        and data.return_to_phase is None
    )


def _touch(iteration: Iteration) -> None:
    now = utcnow()
    iteration.updated_at = now
    iteration.project.updated_at = now
