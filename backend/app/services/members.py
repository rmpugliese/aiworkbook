"""Colleagues working on a project: invitations, removal and leaving.

An invitation names an email address. It gives access only once an account has confirmed that
address: at once if one exists, otherwise when someone signs up with it and confirms it.
"""

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app import email
from app.config import get_settings
from app.email import EmailDeliveryError
from app.models import Project, ProjectMember, User
from app.services.errors import ConflictError, InvalidRequestError, NotFoundError
from app.services.projects import get_project, person_name

MAX_MEMBERS = 5


def _link(path: str) -> str:
    return f"{get_settings().public_url.rstrip('/')}{path}"


def list_members(db: Session, project_id: int, *, user_id: int) -> Project:
    """The project with its owner and members, for anyone who can reach it."""
    return get_project(db, project_id, user_id=user_id)


def invite(db: Session, project_id: int, address: str, *, user: User) -> tuple[ProjectMember, bool]:
    """Adds a colleague; returns the membership and whether the email went out."""
    project = get_project(db, project_id, user_id=user.id, owner_only=True)
    normalized = address.strip().lower()
    if normalized == user.email:
        raise InvalidRequestError("Sei già il proprietario di questo progetto.")
    if any(member.email == normalized for member in project.members):
        raise ConflictError("Questa persona è già stata invitata.")
    if len(project.members) >= MAX_MEMBERS:
        raise ConflictError(f"Un progetto può avere al massimo {MAX_MEMBERS} collaboratori.")

    invitee = db.scalar(select(User).where(User.email == normalized))
    active = invitee is not None and invitee.email_verified_at is not None
    member = ProjectMember(
        project_id=project.id,
        email=normalized,
        user_id=invitee.id if active and invitee else None,
        invited_by_id=user.id,
    )
    db.add(member)
    db.commit()

    inviter = person_name(user) or user.email
    try:
        if active:
            email.send_project_shared(
                normalized, inviter, project.name, _link(f"/projects/{project.id}")
            )
        else:
            email.send_project_invitation(normalized, inviter, project.name, _link("/register"))
    except EmailDeliveryError:
        return member, False
    return member, True


def remove(db: Session, project_id: int, member_id: int, *, user_id: int) -> None:
    """The owner removes anyone; a collaborator can only remove themselves (leave)."""
    project = get_project(db, project_id, user_id=user_id)
    member = next((m for m in project.members if m.id == member_id), None)
    if member is None or (project.owner_id != user_id and member.user_id != user_id):
        raise NotFoundError(f"member {member_id} not found in project {project_id}")
    db.delete(member)
    db.commit()


def activate_invitations(db: Session, user: User) -> None:
    """Pending invitations to a just-confirmed address now give access."""
    db.execute(
        update(ProjectMember)
        .where(ProjectMember.email == user.email, ProjectMember.user_id.is_(None))
        .values(user_id=user.id)
    )
