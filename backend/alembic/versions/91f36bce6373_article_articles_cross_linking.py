"""article_articles cross-linking

Revision ID: 91f36bce6373
Revises: 845c77f588b4
Create Date: 2026-11-24 11:56:53.953342

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '91f36bce6373'
down_revision: Union[str, None] = '845c77f588b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "article_articles",
        sa.Column("source_id", sa.Integer(), nullable=False),
        sa.Column("target_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["source_id"], ["articles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["target_id"], ["articles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("source_id", "target_id"),
        sa.CheckConstraint("source_id <> target_id", name="ck_article_articles_self"),
    )


def downgrade() -> None:
    op.drop_table("article_articles")
