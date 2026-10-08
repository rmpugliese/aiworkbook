from datetime import datetime

from sqlalchemy.orm import Session

from app.export.report import Report, build_report
from app.services.answers import list_answers
from app.services.projects import get_iteration, get_project
from app.workbook.loader import load_template


def iteration_report(
    db: Session, project_id: int, iteration_id: int, *, owner_id: int, generated_at: datetime
) -> Report:
    project = get_project(db, project_id, owner_id=owner_id)
    iteration = get_iteration(db, project_id, iteration_id, owner_id=owner_id)
    return build_report(
        project=project,
        iteration=iteration,
        template=load_template(iteration.template_version),
        answers=list_answers(db, project_id, iteration_id, owner_id=owner_id),
        generated_at=generated_at,
    )
