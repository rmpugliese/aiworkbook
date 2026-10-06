"""Project and iteration use cases. Single-user local mode until accounts land (roadmap phase 5)."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models import Answer, Iteration, Project
from app.models.project import utcnow
from app.schemas.projects import IterationCreate, IterationUpdate, ProjectCreate, ProjectUpdate
from app.services.errors import ConflictError, InvalidRequestError, NotFoundError
from app.workbook.loader import current_template


def list_projects(db: Session, *, archived: bool) -> list[tuple[Project, int]]:
    """Projects with their iteration count, most recently updated first."""
    iteration_count = (
        select(func.count(Iteration.id))
        .where(Iteration.project_id == Project.id)
        .correlate(Project)
        .scalar_subquery()
    )
    archived_filter = (
        Project.archived_at.is_not(None) if archived else Project.archived_at.is_(None)
    )
    rows = db.execute(
        select(Project, iteration_count)
        .where(archived_filter)
        .order_by(Project.updated_at.desc(), Project.id.desc())
    ).all()
    return [(project, count) for project, count in rows]


def get_project(db: Session, project_id: int) -> Project:
    project = db.scalar(
        select(Project).where(Project.id == project_id).options(selectinload(Project.iterations))
    )
    if project is None:
        raise NotFoundError(f"project {project_id} not found")
    return project


def create_project(db: Session, data: ProjectCreate) -> Project:
    project = Project(
        name=data.name,
        client_name=data.client_name or None,
        description=data.description or None,
    )
    project.iterations.append(_new_iteration(number=1, title="Iterazione 1", user_story=None))
    db.add(project)
    db.commit()
    return get_project(db, project.id)


def update_project(db: Session, project_id: int, data: ProjectUpdate) -> Project:
    project = get_project(db, project_id)
    changes = data.model_dump(exclude_unset=True)
    if "name" in changes:
        if changes["name"] is None:
            raise InvalidRequestError("project name cannot be empty")
        project.name = changes["name"]
    if "client_name" in changes:
        project.client_name = changes["client_name"] or None
    if "description" in changes:
        project.description = changes["description"] or None
    db.commit()
    return get_project(db, project_id)


def set_archived(db: Session, project_id: int, *, archived: bool) -> Project:
    project = get_project(db, project_id)
    project.archived_at = utcnow() if archived else None
    db.commit()
    return get_project(db, project_id)


def delete_project(db: Session, project_id: int, *, confirm_name: str) -> None:
    project = get_project(db, project_id)
    if project.archived_at is None:
        raise ConflictError("only archived projects can be deleted")
    if confirm_name.strip() != project.name:
        raise InvalidRequestError("confirm_name does not match the project name")
    db.delete(project)
    db.commit()


def get_iteration(db: Session, project_id: int, iteration_id: int) -> Iteration:
    iteration = db.get(Iteration, iteration_id)
    if iteration is None or iteration.project_id != project_id:
        raise NotFoundError(f"iteration {iteration_id} not found in project {project_id}")
    return iteration


def create_iteration(db: Session, project_id: int, data: IterationCreate) -> Iteration:
    project = get_project(db, project_id)
    source = (
        get_iteration(db, project_id, data.copy_from_iteration_id)
        if data.copy_from_iteration_id is not None
        else None
    )
    user_story = data.user_story or None
    if source is not None and user_story is None:
        user_story = source.user_story

    next_number = max((iteration.number for iteration in project.iterations), default=0) + 1
    iteration = _new_iteration(number=next_number, title=data.title, user_story=user_story)
    if source is not None:
        iteration.answers = [
            Answer(
                question_key=answer.question_key,
                text=answer.text,
                verdict=answer.verdict,
                choices=answer.choices,
                return_to_phase=answer.return_to_phase,
            )
            for answer in source.answers
        ]
    project.iterations.append(iteration)
    project.updated_at = utcnow()
    db.commit()
    return iteration


def update_iteration(
    db: Session, project_id: int, iteration_id: int, data: IterationUpdate
) -> Iteration:
    iteration = get_iteration(db, project_id, iteration_id)
    changes = data.model_dump(exclude_unset=True)
    if "title" in changes:
        if changes["title"] is None:
            raise InvalidRequestError("iteration title cannot be empty")
        iteration.title = changes["title"]
    if "user_story" in changes:
        iteration.user_story = changes["user_story"] or None
    if "status" in changes:
        if changes["status"] is None:
            raise InvalidRequestError("iteration status cannot be empty")
        iteration.status = changes["status"]
    iteration.project.updated_at = utcnow()
    db.commit()
    return iteration


def _new_iteration(*, number: int, title: str, user_story: str | None) -> Iteration:
    return Iteration(
        number=number,
        title=title,
        user_story=user_story,
        template_version=current_template().version,
        status="draft",
    )
