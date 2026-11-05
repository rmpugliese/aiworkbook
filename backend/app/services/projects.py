"""Project and iteration use cases, always scoped to the signed-in user.

A user reaches a project as its owner or as a collaborator (an accepted invitation). Some
operations are the owner's only (`owner_only`). A project the user cannot reach is reported as
missing (NotFoundError), never as forbidden, so its existence is not revealed.
"""

from sqlalchemy import ColumnElement, exists, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models import Answer, Iteration, Project, ProjectMember, User
from app.models.project import utcnow
from app.schemas.projects import IterationCreate, IterationUpdate, ProjectCreate, ProjectUpdate
from app.services.errors import ConflictError, InvalidRequestError, NotFoundError
from app.workbook.loader import current_template


def _reachable_by(user_id: int, *, owner_only: bool = False) -> ColumnElement[bool]:
    """Projects the user owns or, unless `owner_only`, collaborates on."""
    owned = Project.owner_id == user_id
    if owner_only:
        return owned
    member = exists().where(
        ProjectMember.project_id == Project.id, ProjectMember.user_id == user_id
    )
    return or_(owned, member)


def person_name(user: User | None) -> str | None:
    """How a person is shown to their colleagues: display name, else email."""
    if user is None:
        return None
    return user.display_name or user.email


def list_projects(
    db: Session, *, user_id: int, archived: bool
) -> list[tuple[Project, int, str | None]]:
    """Owned and shared projects with their iteration count and, for shared ones, the owner's
    name; most recently updated first."""
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
        select(Project, iteration_count, User)
        .outerjoin(User, User.id == Project.owner_id)
        .where(_reachable_by(user_id), archived_filter)
        .order_by(Project.updated_at.desc(), Project.id.desc())
    ).all()
    return [
        (project, count, None if project.owner_id == user_id else person_name(owner))
        for project, count, owner in rows
    ]


def get_project(db: Session, project_id: int, *, user_id: int, owner_only: bool = False) -> Project:
    project = db.scalar(
        select(Project)
        .where(Project.id == project_id, _reachable_by(user_id, owner_only=owner_only))
        .options(selectinload(Project.iterations))
    )
    if project is None:
        raise NotFoundError(f"project {project_id} not found")
    return project


def create_project(db: Session, data: ProjectCreate, *, user_id: int) -> Project:
    project = Project(
        owner_id=user_id,
        name=data.name,
        client_name=data.client_name or None,
        description=data.description or None,
    )
    project.iterations.append(new_iteration(number=1, title="Iterazione 1", user_story=None))
    db.add(project)
    db.commit()
    return get_project(db, project.id, user_id=user_id)


def update_project(db: Session, project_id: int, data: ProjectUpdate, *, user_id: int) -> Project:
    project = get_project(db, project_id, user_id=user_id, owner_only=True)
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
    return get_project(db, project_id, user_id=user_id, owner_only=True)


def set_archived(db: Session, project_id: int, *, user_id: int, archived: bool) -> Project:
    project = get_project(db, project_id, user_id=user_id, owner_only=True)
    project.archived_at = utcnow() if archived else None
    db.commit()
    return get_project(db, project_id, user_id=user_id, owner_only=True)


def delete_project(db: Session, project_id: int, *, user_id: int, confirm_name: str) -> None:
    project = get_project(db, project_id, user_id=user_id, owner_only=True)
    if project.archived_at is None:
        raise ConflictError("only archived projects can be deleted")
    if confirm_name.strip() != project.name:
        raise InvalidRequestError("confirm_name does not match the project name")
    db.delete(project)
    db.commit()


def get_iteration(
    db: Session, project_id: int, iteration_id: int, *, user_id: int, owner_only: bool = False
) -> Iteration:
    iteration = db.scalar(
        select(Iteration)
        .join(Project)
        .where(
            Iteration.id == iteration_id,
            Iteration.project_id == project_id,
            _reachable_by(user_id, owner_only=owner_only),
        )
    )
    if iteration is None:
        raise NotFoundError(f"iteration {iteration_id} not found in project {project_id}")
    return iteration


def create_iteration(
    db: Session, project_id: int, data: IterationCreate, *, user_id: int
) -> Iteration:
    project = get_project(db, project_id, user_id=user_id)
    source = (
        get_iteration(db, project_id, data.copy_from_iteration_id, user_id=user_id)
        if data.copy_from_iteration_id is not None
        else None
    )
    user_story = data.user_story or None
    if source is not None and user_story is None:
        user_story = source.user_story

    next_number = max((iteration.number for iteration in project.iterations), default=0) + 1
    iteration = new_iteration(number=next_number, title=data.title, user_story=user_story)
    if source is not None:
        iteration.answers = [
            Answer(
                question_key=answer.question_key,
                text=answer.text,
                verdict=answer.verdict,
                choices=answer.choices,
                return_to_phase=answer.return_to_phase,
                updated_by_id=answer.updated_by_id,
            )
            for answer in source.answers
        ]
    project.iterations.append(iteration)
    project.updated_at = utcnow()
    db.commit()
    return iteration


def update_iteration(
    db: Session, project_id: int, iteration_id: int, data: IterationUpdate, *, user_id: int
) -> Iteration:
    iteration = get_iteration(db, project_id, iteration_id, user_id=user_id)
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


def new_iteration(*, number: int, title: str, user_story: str | None) -> Iteration:
    return Iteration(
        number=number,
        title=title,
        user_story=user_story,
        template_version=current_template().version,
        status="draft",
    )
