"""add confirmed_by to ai_analysis

Revision ID: f3c9a1d70b52
Revises: 4a2a875fb9dc
Create Date: 2026-09-28 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3c9a1d70b52'
down_revision: Union[str, Sequence[str], None] = '4a2a875fb9dc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Nullable: rows sealed before this column existed keep no signer.
    op.add_column('ai_analysis', sa.Column('confirmed_by', sa.String(length=120), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('ai_analysis', 'confirmed_by')
