"""Collaborators of a project: everyone on it sees the list, the owner invites and removes."""

from collections.abc import Iterator
from contextlib import contextmanager
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.web import CurrentUser
from app.db import get_db
from app.models import Project, ProjectMember, User
from app.schemas.members import InviteResult, MemberInvite, MemberOut, MembersOut, PersonOut
from app.services import members as service
from app.services.errors import ConflictError, InvalidRequestError, NotFoundError
from app.services.projects import person_name

Db = Annotated[Session, Depends(get_db)]

router = APIRouter(prefix="/api/projects/{project_id}/members", tags=["members"])

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


def _member_out(db: Session, member: ProjectMember) -> MemberOut:
    account = db.get(User, member.user_id) if member.user_id is not None else None
    return MemberOut(
        id=member.id, email=member.email, name=person_name(account), pending=account is None
    )


def _members_out(db: Session, user: User, project: Project) -> MembersOut:
    owner = project.owner
    return MembersOut(
        owner=PersonOut(
            name=person_name(owner) or "", email=owner.email if owner is not None else ""
        ),
        members=[_member_out(db, member) for member in project.members],
        limit=service.MAX_MEMBERS,
        can_manage=project.owner_id == user.id,
    )


@router.get("")
def list_members(db: Db, user: CurrentUser, project_id: int) -> MembersOut:
    with _service_errors():
        project = service.list_members(db, project_id, user_id=user.id)
    return _members_out(db, user, project)


@router.post("", status_code=status.HTTP_201_CREATED)
def invite(db: Db, user: CurrentUser, project_id: int, data: MemberInvite) -> InviteResult:
    with _service_errors():
        member, notified = service.invite(db, project_id, data.email, user=user)
    return InviteResult(member=_member_out(db, member), notified=notified)


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove(db: Db, user: CurrentUser, project_id: int, member_id: int) -> None:
    """The owner removes a collaborator; a collaborator removes themselves to leave."""
    with _service_errors():
        service.remove(db, project_id, member_id, user_id=user.id)
