"""Кабинет: клиенты, проекты, задачи, история статусов

Создано 24.11.2026. Написано вручную по сгенерированному Alembic DDL,
потому что первая версия файла была создана прямо в контейнере и потерялась
при пересборке образа. Схема сверена с фактическим состоянием базы.

Revision ID: e61ebf32d35e
Revises: 91f36bce6373
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "e61ebf32d35e"
down_revision: Union[str, None] = "91f36bce6373"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # clients: карточка клиента, необязательно связанная с пользователем.
    op.create_table(
        "clients",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("display_name", sa.String(length=200), nullable=False),
        sa.Column("company", sa.String(length=200), server_default="", nullable=False),
        sa.Column(
            "contact_json",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="{}",
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_clients_user_id"), "clients", ["user_id"], unique=False)

    # projects: статус ограничен CHECK — недопустимое значение отвергнет сама база.
    op.create_table(
        "projects",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("client_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), server_default="", nullable=False),
        sa.Column("status", sa.String(length=24), server_default="new", nullable=False),
        sa.Column("price_rub", sa.Integer(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint(
            "status IN ('new', 'analysis', 'dev', 'testing', 'done')",
            name="ck_projects_status",
        ),
        sa.CheckConstraint("price_rub IS NULL OR price_rub >= 0", name="ck_projects_price"),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_projects_client_id"), "projects", ["client_id"], unique=False)
    op.create_index("ix_projects_status", "projects", ["status"], unique=False)

    # project_tasks: статус задачи не равен статусу проекта.
    op.create_table(
        "project_tasks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("project_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), server_default="", nullable=False),
        sa.Column("status", sa.String(length=16), server_default="todo", nullable=False),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint(
            "status IN ('todo', 'in_progress', 'done')",
            name="ck_project_tasks_status",
        ),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_project_tasks_project", "project_tasks", ["project_id"], unique=False)

    # project_status_history: пишется только сервисом смены статуса.
    op.create_table(
        "project_status_history",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("project_id", sa.Integer(), nullable=False),
        sa.Column("status_from", sa.String(length=24), nullable=True),
        sa.Column("status_to", sa.String(length=24), nullable=False),
        sa.Column("comment", sa.Text(), server_default="", nullable=False),
        sa.Column("actor_user_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_project_status_history_project", "project_status_history", ["project_id"], unique=False
    )


def downgrade() -> None:
    # Обратный порядок: сначала зависимые таблицы.
    op.drop_index("ix_project_status_history_project", table_name="project_status_history")
    op.drop_table("project_status_history")
    op.drop_index("ix_project_tasks_project", table_name="project_tasks")
    op.drop_table("project_tasks")
    op.drop_index("ix_projects_status", table_name="projects")
    op.drop_index(op.f("ix_projects_client_id"), table_name="projects")
    op.drop_table("projects")
    op.drop_index(op.f("ix_clients_user_id"), table_name="clients")
    op.drop_table("clients")

