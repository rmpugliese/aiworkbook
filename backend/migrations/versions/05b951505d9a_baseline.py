"""baseline

Revision ID: 05b951505d9a
Revises:
Create Date: 2026-10-05 10:26:10.132368

"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "05b951505d9a"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
