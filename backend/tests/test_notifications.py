"""Уведомления (ТЗ 9.1). Манифест: docs/manifests/db/schema.md.

Проверяется главное: уведомление приходит адресату, не приходит автору события,
и чужое уведомление недоступно.
"""

import os

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://test:test@127.0.0.1:1/test")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import JSON, create_engine, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_current_user
from app.db.models import (
    AuditLog,
    Base,
    Client,
    Notification,
    Project,
    ProjectStatusHistory,
    Role,
    User,
    user_roles,
)
from app.db.session import get_session
from app.main import app
from app.services.notify import notify_client_owner, notify_user


@pytest.fixture()
def env():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    tables = [
        User.__table__,
        Role.__table__,
        user_roles,
        Client.__table__,
        Project.__table__,
        Notification.__table__,
        ProjectStatusHistory.__table__,
        AuditLog.__table__,
    ]
    for table in tables:
        for column in table.columns:
            if isinstance(column.type, JSONB):
                column.type = JSON()
    Base.metadata.create_all(engine, tables=tables)
    Session_ = sessionmaker(bind=engine)
    db = Session_()
    me = User(email="me@test.local", password_hash="x", display_name="Я", status="active")
    other = User(email="other@test.local", password_hash="x", display_name="Другой", status="active")
    db.add_all([me, other])
    db.flush()
    client = Client(display_name="Клиент", user_id=me.id)
    db.add(client)
    db.flush()
    project = Project(client_id=client.id, title="Проект", status="new")
    db.add(project)
    db.flush()
    ids = {"me": me.id, "other": other.id, "project": project.id}
    db.commit()
    db.close()
    return Session_, ids


@pytest.fixture(autouse=True)
def clean_overrides():
    yield
    app.dependency_overrides.clear()


def _client(env, key="me"):
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
            return db.get(User, ids[key])
        finally:
            db.close()

    app.dependency_overrides[get_session] = override_session
    app.dependency_overrides[get_current_user] = override_user
    return TestClient(app)


def test_notification_reaches_client_owner(env):
    """Сотрудник отвечает — у клиента появляется уведомление."""
    Session_, ids = env
    db = Session_()
    project = db.get(Project, ids["project"])
    notify_client_owner(
        db, project, kind="message", title="Ответ по проекту", body="Текст",
        exclude_user_id=ids["other"],
    )
    db.commit()
    db.close()

    c = _client(env)
    data = c.get("/api/v1/account/notifications").json()
    assert data["unread"] == 1
    assert data["items"][0]["title"] == "Ответ по проекту"


def test_author_gets_no_notification(env):
    """Клиент сам написал — уведомление ему же не нужно."""
    Session_, ids = env
    db = Session_()
    project = db.get(Project, ids["project"])
    result = notify_client_owner(
        db, project, kind="message", title="Сам себе", exclude_user_id=ids["me"],
    )
    db.commit()
    rows = db.scalars(select(Notification)).all()
    db.close()
    assert result is None
    assert rows == []


def test_notification_without_user_is_skipped(env):
    """У клиента нет учётной записи — уведомлять некого, но ошибки нет."""
    Session_, ids = env
    db = Session_()
    # Клиент есть, но учётной записи у него нет — так бывает по ТЗ 9.4:
    # карточку заводят после заявки, аккаунт выдают позже.
    no_account = Client(display_name="Без аккаунта", user_id=None)
    db.add(no_account)
    db.flush()
    project = Project(client_id=no_account.id, title="Без владельца", status="new")
    db.add(project)
    db.flush()
    result = notify_client_owner(db, project, kind="message", title="В пустоту")
    db.commit()
    db.close()
    assert result is None


def test_foreign_notification_is_404(env):
    """Отметить чужое уведомление нельзя — 404, а не 403."""
    Session_, ids = env
    db = Session_()
    other_note = notify_user(db, ids["other"], kind="message", title="Чужое")
    db.commit()
    note_id = other_note.id
    db.close()

    c = _client(env)
    r = c.post("/api/v1/account/notifications/" + str(note_id) + "/read")
    assert r.status_code == 404


def test_mark_read_is_idempotent(env):
    """Повторное «прочитано» не переписывает дату первого прочтения."""
    Session_, ids = env
    db = Session_()
    note = notify_user(db, ids["me"], kind="message", title="Прочитать")
    db.commit()
    note_id = note.id
    db.close()

    c = _client(env)
    assert c.post("/api/v1/account/notifications/" + str(note_id) + "/read").status_code == 200
    db = Session_()
    first = db.get(Notification, note_id).read_at
    db.close()
    assert c.post("/api/v1/account/notifications/" + str(note_id) + "/read").status_code == 200
    db = Session_()
    second = db.get(Notification, note_id).read_at
    db.close()
    assert first == second


def test_unread_counter_drops_after_read(env):
    """Счётчик непрочитанных уменьшается после отметки."""
    Session_, ids = env
    db = Session_()
    note = notify_user(db, ids["me"], kind="message", title="Один")
    db.commit()
    note_id = note.id
    db.close()

    c = _client(env)
    assert c.get("/api/v1/account/notifications").json()["unread"] == 1
    c.post("/api/v1/account/notifications/" + str(note_id) + "/read")
    assert c.get("/api/v1/account/notifications").json()["unread"] == 0


def test_status_change_notifies_client(env):
    """Смена статуса уведомляет владельца проекта (ТЗ 9.1)."""
    Session_, ids = env
    db = Session_()
    me = db.get(User, ids["me"])
    role = Role(code="admin", title="Администратор")
    db.add(role)
    db.flush()
    me.roles.append(role)
    db.commit()
    project_id = ids["project"]
    db.close()

    c = _client(env)
    r = c.patch(
        "/api/v1/admin/projects/" + str(project_id) + "/status",
        json={"status": "dev"},
    )
    assert r.status_code == 200

    # Автор смены — сам клиент, поэтому уведомление ему не уходит:
    # проверяем правило исключения автора на живом маршруте.
    mine = c.get("/api/v1/account/notifications").json()
    assert mine["unread"] == 0


def test_status_change_notifies_other_client(env):
    """Статус сменил сотрудник — клиент получает уведомление."""
    Session_, ids = env
    db = Session_()
    other = db.get(User, ids["other"])
    role = Role(code="admin", title="Администратор")
    db.add(role)
    db.flush()
    other.roles.append(role)
    db.commit()
    project_id = ids["project"]
    db.close()

    # Сотрудник — второй пользователь; проект принадлежит первому.
    c = _client(env, "other")
    r = c.patch(
        "/api/v1/admin/projects/" + str(project_id) + "/status",
        json={"status": "dev"},
    )
    assert r.status_code == 200

    # Смотрим глазами владельца проекта.
    owner = _client(env, "me")
    data = owner.get("/api/v1/account/notifications").json()
    assert data["unread"] == 1
    assert "Разработка" in data["items"][0]["title"]
