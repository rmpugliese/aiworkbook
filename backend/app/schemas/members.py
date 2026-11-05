from pydantic import BaseModel, ConfigDict, EmailStr


class MemberInvite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr


class PersonOut(BaseModel):
    name: str
    email: str


class MemberOut(BaseModel):
    id: int
    email: str
    # None while the invitation waits for an account to confirm this address.
    name: str | None
    pending: bool


class MembersOut(BaseModel):
    owner: PersonOut
    members: list[MemberOut]
    limit: int
    # True for the owner: they invite and remove; collaborators only see the list.
    can_manage: bool


class InviteResult(BaseModel):
    member: MemberOut
    # False if the invitation is saved but its email could not be sent.
    notified: bool
