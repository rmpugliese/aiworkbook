from datetime import datetime

from sqlalchemy.orm import Session

from app.export.report import Report, build_report
from app.models import User
from app.services.answers import list_answers
from app.services.branding import document_branding
from app.services.projects import get_iteration, get_project
from app.workbook.loader import load_template


def iteration_report(
    db: Session, project_id: int, iteration_id: int, *, user_id: int, generated_at: datetime
) -> Report:
    project = get_project(db, project_id, user_id=user_id)
    iteration = get_iteration(db, project_id, iteration_id, user_id=user_id)
    return build_report(
        project=project,
        iteration=iteration,
        template=load_template(iteration.template_version),
        answers=list_answers(db, project_id, iteration_id, user_id=user_id),
        generated_at=generated_at,
        # The logo of whoever downloads it: owner and collaborators may each have their own.
        branding=document_branding(db, db.get(User, user_id)),
    )
