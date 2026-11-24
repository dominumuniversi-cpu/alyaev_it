"""Восстановленная миграция: серверные умолчания калькулятора.

Файл был утерян: база знала ревизию 54b3679a2b86, а в репозитории её не было.
Без файла схема невоспроизводима — восстановление из бэкапа или развёртывание
с нуля ломается на неизвестной ревизии. Восстановлен по фактическому состоянию БД.

Revision ID: 54b3679a2b86
Revises: 47be1aa52622
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "54b3679a2b86"
down_revision: str | None = "47be1aa52622"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Ставим умолчания, чтобы вставка через SQL или админку не падала на NOT NULL."""
    op.alter_column(
        "calculator_options", "is_active",
        server_default=sa.text("true"), existing_type=sa.Boolean(), existing_nullable=False,
    )
    op.alter_column(
        "calculator_options", "sort_order",
        server_default=sa.text("0"), existing_type=sa.Integer(), existing_nullable=False,
    )
    op.alter_column(
        "calculator_options", "price_delta",
        server_default=sa.text("0"), existing_type=sa.Integer(), existing_nullable=False,
    )
    op.alter_column(
        "calculator_complexity", "is_active",
        server_default=sa.text("true"), existing_type=sa.Boolean(), existing_nullable=False,
    )
    op.alter_column(
        "calculator_complexity", "sort_order",
        server_default=sa.text("0"), existing_type=sa.Integer(), existing_nullable=False,
    )
    op.alter_column(
        "calculator_complexity", "factor",
        server_default=sa.text("1.00"), existing_type=sa.Numeric(4, 2), existing_nullable=False,
    )


def downgrade() -> None:
    """Снимаем умолчания, возвращая состояние до ревизии."""
    op.alter_column(
        "calculator_complexity", "factor",
        server_default=None, existing_type=sa.Numeric(4, 2), existing_nullable=False,
    )
    op.alter_column(
        "calculator_complexity", "sort_order",
        server_default=None, existing_type=sa.Integer(), existing_nullable=False,
    )
    op.alter_column(
        "calculator_complexity", "is_active",
        server_default=None, existing_type=sa.Boolean(), existing_nullable=False,
    )
    op.alter_column(
        "calculator_options", "price_delta",
        server_default=None, existing_type=sa.Integer(), existing_nullable=False,
    )
    op.alter_column(
        "calculator_options", "sort_order",
        server_default=None, existing_type=sa.Integer(), existing_nullable=False,
    )
    op.alter_column(
        "calculator_options", "is_active",
        server_default=None, existing_type=sa.Boolean(), existing_nullable=False,
    )
