"""Creating a project from the fields of a fillable workbook PDF."""

from sqlalchemy.orm import Session as DbSession

from app.models import Answer, Project, User
from app.schemas.projects import WorkbookPdfImportIn
from app.services.errors import InvalidRequestError
from app.services.projects import get_project, new_iteration
from app.workbook.pdf_form import UnknownFormError, map_fields


def import_workbook_fields(
    db: DbSession, user: User, data: WorkbookPdfImportIn
) -> tuple[Project, int]:
    """A new project whose first iteration holds the answers found in the form."""
    try:
        answers = map_fields(data.fields)
    except UnknownFormError as error:
        raise InvalidRequestError(
            "PDF non riconosciuto: usa il workbook PDF compilabile, compilato nei suoi campi."
        ) from error
    if not answers:
        raise InvalidRequestError("Nel PDF non ci sono campi compilati da importare.")

    project = Project(owner_id=user.id, name=data.name, client_name=data.client_name or None)
    iteration = new_iteration(number=1, title="Iterazione 1", user_story=None)
    iteration.answers = [
        Answer(
            question_key=answer.question_key,
            text=answer.text,
            verdict=answer.verdict,
            choices=answer.choices,
        )
        for answer in answers
    ]
    project.iterations.append(iteration)
    db.add(project)
    db.commit()
    return get_project(db, project.id, owner_id=user.id), len(answers)
