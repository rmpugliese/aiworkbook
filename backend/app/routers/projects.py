from collections.abc import Iterator
from contextlib import contextmanager
from typing import Annotated

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Project
from app.schemas.answers import AnswerIn, AnswerOut
from app.schemas.projects import (
    IterationCreate,
    IterationOut,
    IterationUpdate,
    ProjectCreate,
    ProjectDelete,
    ProjectOut,
    ProjectSummary,
    ProjectUpdate,
)
from app.services import answers as answers_service
from app.services import projects as service
from app.services.errors import ConflictError, InvalidRequestError, NotFoundError

router = APIRouter(prefix="/api/projects", tags=["projects"])

Db = Annotated[Session, Depends(get_db)]

_ERROR_STATUS: dict[type[Exception], int] = {
    NotFoundError: status.HTTP_404_NOT_FOUND,
    ConflictError: status.HTTP_409_CONFLICT,
    InvalidRequestError: status.HTTP_422_UNPROCESSABLE_CONTENT,
}


@contextmanager
def _service_errors() -> Iterator[None]:
    try:
        yield
    except (NotFoundError, ConflictError, InvalidRequestError) as error:
        raise HTTPException(_ERROR_STATUS[type(error)], str(error)) from error


_PROJECT_COLUMNS = (
    "id",
    "name",
    "client_name",
    "description",
    "created_at",
    "updated_at",
    "archived_at",
)


def _summary(project: Project, iteration_count: int) -> ProjectSummary:
    fields = {name: getattr(project, name) for name in _PROJECT_COLUMNS}
    return ProjectSummary(**fields, iteration_count=iteration_count)


def _project_out(project: Project) -> ProjectOut:
    summary = _summary(project, len(project.iterations))
    iterations = [IterationOut.model_validate(iteration) for iteration in project.iterations]
    return ProjectOut(**summary.model_dump(), iterations=iterations)


@router.get("")
def list_projects(db: Db, archived: Annotated[bool, Query()] = False) -> list[ProjectSummary]:
    return [
        _summary(project, count) for project, count in service.list_projects(db, archived=archived)
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_project(db: Db, data: ProjectCreate) -> ProjectOut:
    with _service_errors():
        return _project_out(service.create_project(db, data))


@router.get("/{project_id}")
def get_project(db: Db, project_id: int) -> ProjectOut:
    with _service_errors():
        return _project_out(service.get_project(db, project_id))


@router.patch("/{project_id}")
def update_project(db: Db, project_id: int, data: ProjectUpdate) -> ProjectOut:
    with _service_errors():
        return _project_out(service.update_project(db, project_id, data))


@router.post("/{project_id}/archive")
def archive_project(db: Db, project_id: int) -> ProjectOut:
    with _service_errors():
        return _project_out(service.set_archived(db, project_id, archived=True))


@router.post("/{project_id}/unarchive")
def unarchive_project(db: Db, project_id: int) -> ProjectOut:
    with _service_errors():
        return _project_out(service.set_archived(db, project_id, archived=False))


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(db: Db, project_id: int, data: Annotated[ProjectDelete, Body()]) -> None:
    with _service_errors():
        service.delete_project(db, project_id, confirm_name=data.confirm_name)


@router.post("/{project_id}/iterations", status_code=status.HTTP_201_CREATED)
def create_iteration(db: Db, project_id: int, data: IterationCreate) -> IterationOut:
    with _service_errors():
        return IterationOut.model_validate(service.create_iteration(db, project_id, data))


@router.get("/{project_id}/iterations/{iteration_id}")
def get_iteration(db: Db, project_id: int, iteration_id: int) -> IterationOut:
    with _service_errors():
        return IterationOut.model_validate(service.get_iteration(db, project_id, iteration_id))


@router.patch("/{project_id}/iterations/{iteration_id}")
def update_iteration(
    db: Db, project_id: int, iteration_id: int, data: IterationUpdate
) -> IterationOut:
    with _service_errors():
        return IterationOut.model_validate(
            service.update_iteration(db, project_id, iteration_id, data)
        )


@router.get("/{project_id}/iterations/{iteration_id}/answers")
def list_answers(db: Db, project_id: int, iteration_id: int) -> list[AnswerOut]:
    with _service_errors():
        answers = answers_service.list_answers(db, project_id, iteration_id)
    return [AnswerOut.model_validate(answer) for answer in answers]


@router.put("/{project_id}/iterations/{iteration_id}/answers/{question_key}")
def save_answer(
    db: Db, project_id: int, iteration_id: int, question_key: str, data: AnswerIn
) -> AnswerOut:
    """Replaces one answer. An answer with every field empty is deleted."""
    with _service_errors():
        answer = answers_service.save_answer(db, project_id, iteration_id, question_key, data)
    if answer is None:
        return AnswerOut(
            question_key=question_key,
            text=None,
            verdict=None,
            choices=None,
            return_to_phase=None,
            updated_at=None,
        )
    return AnswerOut.model_validate(answer)
