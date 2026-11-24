"""Сводка «Требует внимания». Манифест: docs/manifests/ui/admin-projects.md."""

import os

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://test:test@127.0.0.1:1/test")

from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_current_user
from app.db.models import (
    AuditLog,
    Base,
    Client,
    Lead,
    Message,
    Project,
    Role,
    User,
    user_roles,
)
from app.db.session import get_session
from app.main import app


@pytest.fixture()
def env():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    tables = [
        User.__table__, Role.__table__, user_roles,
        Client.__table__, Project.__table__, Message.__table__,
        Lead.__table__, AuditLog.__table__,
    ]
    for table in tables:
        for column in table.columns:
            if isinstance(column.type, JSONB):
                from sqlalchemy import JSON
                column.type = JSON()
    Base.metadata.create_all(engine, tables=tables)
    Session_ = sessionmaker(bind=engine)
    db = Session_()
    admin = User(email="boss@test.local", password_hash="x", display_name="Босс", status="active")
    db.add(admin)
    db.flush()
    role = Role(code="admin", title="Администратор")
    db.add(role)
    db.flush()
    admin.roles.append(role)
    db.commit()
    ids = {"admin": admin.id}
    db.close()
    return Session_, ids


@pytest.fixture(autouse=True)
def clean_overrides():
    yield
    app.dependency_overrides.clear()


def _client(env):
    Session_, ids = env

    def override_session():
        db = Session_()
        try:
            yield db
        finally:
            db.close()

    def override_user():
        db = Session_()
        try:
            return db.get(User, ids["admin"])
        finally:
            db.close()

    app.dependency_overrides[get_session] = override_session
    app.dependency_overrides[get_current_user] = override_user
    return TestClient(app)


def test_counts_only_new_leads(env):
    """В сводку попадают только новые заявки, не все подряд."""
    Session_, _ = env
    db = Session_()
    db.add_all([
        Lead(public_id="a", name="A", contact_type="tg", contact_value="@a", message="1", status="new", consent_version="1.0", consent_at=datetime.now(UTC)),
        Lead(public_id="b", name="B", contact_type="tg", contact_value="@b", message="2", status="in_progress", consent_version="1.0", consent_at=datetime.now(UTC)),
    ])
    db.commit()
    db.close()
    data = _client(env).get("/api/v1/admin/attention").json()
    assert data["new_leads"] == 1


def test_counts_only_client_messages(env):
    """Ответы студии в счётчик не попадают — иначе счётчик не уменьшается никогда."""
    Session_, _ = env
    db = Session_()
    client = Client(display_name="Клиент")
    db.add(client)
    db.flush()
    project = Project(client_id=client.id, title="Проект", status="new")
    db.add(project)
    db.flush()
    db.add_all([
        Message(project_id=project.id, author_role="client", body="Вопрос"),
        Message(project_id=project.id, author_role="staff", body="Ответ"),
    ])
    db.commit()
    db.close()
    data = _client(env).get("/api/v1/admin/attention").json()
    assert data["client_messages"] == 1


def test_stale_counts_old_active_projects(env):
    """Без движения: активный проект, не менявшийся неделю. Завершённые не в счёт."""
    Session_, _ = env
    db = Session_()
    client = Client(display_name="Клиент")
    db.add(client)
    db.flush()
    old = datetime.now(UTC) - timedelta(days=10)
    fresh = Project(client_id=client.id, title="Свежий", status="dev")
    done = Project(client_id=client.id, title="Завершён", status="done", completed_at=old)
    stale = Project(client_id=client.id, title="Застрял", status="analysis")
    db.add_all([fresh, done, stale])
    db.commit()
    # Уходим в прошлое только у «застрявшего»: события updated_at не трогаем.
    db.execute(Project.__table__.update().where(Project.id == stale.id).values(updated_at=old))
    db.execute(Project.__table__.update().where(Project.id == done.id).values(updated_at=old))
    db.commit()
    db.close()
    data = _client(env).get("/api/v1/admin/attention").json()
    assert data["stale_projects"] == 1


def test_empty_counts_are_zero(env):
    """Пустая база — нули, а не пропуски ключей."""
    data = _client(env).get("/api/v1/admin/attention").json()
    assert data == {"new_leads": 0, "client_messages": 0, "stale_projects": 0}
