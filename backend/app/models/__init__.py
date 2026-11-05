"""SQLAlchemy models. Importing this package registers every table on `Base.metadata`."""

from app.models.ai import AIRequest, AISettings
from app.models.project import Answer, Iteration, Project, ProjectMember
from app.models.share import ShareLink
from app.models.site import SiteSettings
from app.models.user import EmailToken, Session, User

__all__ = [
    "AIRequest",
    "AISettings",
    "Answer",
    "EmailToken",
    "Iteration",
    "Project",
    "ProjectMember",
    "Session",
    "ShareLink",
    "SiteSettings",
    "User",
]
