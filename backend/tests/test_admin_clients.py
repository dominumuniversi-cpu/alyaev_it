"""Тесты админки клиентов и проектов (ТЗ 9.2, 9.4).

Проверяется не «вернул ли роут 200», а то, что легко сделать неправильно:
история статусов пишется при каждой смене и НЕ засоряется повторами.
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
from app.api.admin_clients import _set_status
from app.db.models import (
    AuditLog,
    Base,
    Client,
    Project,
    ProjectStatusHistory,
    ProjectTask,
    Role,
    User,
    user_roles,
)
from app.db.session import get_session
from app.main import app


@pytest.fixture()
def env():
    """Клиент, администратор и проект в статусе new."""
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
        ProjectTask.__table__,
        ProjectStatusHistory.__table__,
        # audit_log обязателен: изменяющие роуты пишут журнал в той же транзакции.
        AuditLog.__table__,
    ]
    # SQLite не рендерит JSONB — подменяем тип только для создания схемы.
    for table in tables:
        for column in table.columns:
            if isinstance(column.type, JSONB):
                column.type = JSON()
    Base.metadata.create_all(engine, tables=tables)
    Session_ = sessionmaker(bind=engine)
    db = Session_()
    admin = User(email="a@test.local", password_hash="x", display_name="A", status="active")
    # Роль обязательна: require_permission смотрит роли, а не сам факт входа.
    # Без неё все админские роуты отвечают 403 — и тест проверял бы не то.
    admin_role = Role(code="admin", title="Администратор")
    # Роль client нужна выдаче доступа: без неё роут честно отвечает 500.
    client_role = Role(code="client", title="Клиент")
    db.add_all([admin, admin_role, client_role])
    db.flush()
    admin.roles.append(admin_role)
    db.flush()
    client = Client(display_name="Клиент", company="ООО Тест")
    db.add(client)
    db.flush()
    project = Project(client_id=client.id, title="Проект", status="new")
    db.add(project)
    db.flush()
    ids = {"admin": admin.id, "client": client.id, "project": project.id}
    db.commit()
    db.close()
    return Session_, ids


@pytest.fixture(autouse=True)
def clean_overrides():
    yield
    app.dependency_overrides.clear()


def _client(env):
    """TestClient под администратором."""
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


def test_status_change_writes_history(env):
    """Смена статуса оставляет событие — иначе история проекта пустая."""
    Session_, ids = env
    c = _client(env)
    r = c.patch(
        "/api/v1/admin/projects/" + str(ids["project"]) + "/status",
        json={"status": "dev", "comment": "начали разработку"},
    )
    assert r.status_code == 200
    assert r.json()["status"] == "dev"

    db = Session_()
    rows = db.scalars(select(ProjectStatusHistory)).all()
    db.close()
    assert len(rows) == 1
    assert rows[0].status_from == "new"
    assert rows[0].status_to == "dev"
    assert rows[0].comment == "начали разработку"


def test_same_status_does_not_pollute_history(env):
    """Повтор того же статуса — не событие: история не должна пухнуть от повторов."""
    Session_, ids = env
    c = _client(env)
    url = "/api/v1/admin/projects/" + str(ids["project"]) + "/status"
    c.patch(url, json={"status": "dev", "comment": "раз"})
    c.patch(url, json={"status": "dev", "comment": "два"})

    db = Session_()
    rows = db.scalars(select(ProjectStatusHistory)).all()
    db.close()
    assert len(rows) == 1


def test_invalid_status_rejected_with_422(env):
    """Недопустимый статус — 422, а не 500 из CHECK-констрейнта базы."""
    Session_, ids = env
    c = _client(env)
    r = c.patch(
        "/api/v1/admin/projects/" + str(ids["project"]) + "/status",
        json={"status": "wrong"},
    )
    assert r.status_code == 422


def test_done_sets_completed_at_and_returning_clears_it(env):
    """Завершение ставит дату, возврат в работу её снимает: иначе дата врёт."""
    Session_, ids = env
    c = _client(env)
    url = "/api/v1/admin/projects/" + str(ids["project"]) + "/status"
    c.patch(url, json={"status": "done"})
    db = Session_()
    p = db.get(Project, ids["project"])
    assert p.completed_at is not None
    db.close()

    c.patch(url, json={"status": "dev"})
    db = Session_()
    p = db.get(Project, ids["project"])
    assert p.completed_at is None
    db.close()


def test_create_task_attaches_to_project(env):
    """Задача создаётся в нужном проекте."""
    Session_, ids = env
    c = _client(env)
    r = c.post(
        "/api/v1/admin/projects/" + str(ids["project"]) + "/tasks",
        json={"title": "Сделать форму"},
    )
    assert r.status_code == 201
    db = Session_()
    tasks = db.scalars(select(ProjectTask)).all()
    db.close()
    assert [t.title for t in tasks] == ["Сделать форму"]
    assert tasks[0].status == "todo"


def test_grant_access_returns_password_once_and_hashes_it(env):
    """Пароль возвращается один раз, в базе только хеш, вход привязан к клиенту."""
    Session_, ids = env
    c = _client(env)
    r = c.post(
        "/api/v1/admin/clients/" + str(ids["client"]) + "/access",
        params={"email": "New@Example.RU"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["password"]
    assert data["email"] == "new@example.ru"
    assert "один раз" in data["warning"]

    db = Session_()
    user = db.scalar(select(User).where(User.email == "new@example.ru"))
    client = db.get(Client, ids["client"])
    db.close()
    assert user is not None
    assert user.password_hash != data["password"]
    assert client.user_id == user.id


def test_grant_access_twice_is_conflict(env):
    """Повторная выдача входа — 409, а не перезапись пользователя."""
    Session_, ids = env
    c = _client(env)
    url = "/api/v1/admin/clients/" + str(ids["client"]) + "/access"
    assert c.post(url, params={"email": "a1@test.ru"}).status_code == 200
    assert c.post(url, params={"email": "a2@test.ru"}).status_code == 409


def test_set_status_helper_is_the_only_writer(env):
    """Прямой вызов сервиса тоже пишет историю — им пользуются и роуты."""
    Session_, ids = env
    db = Session_()
    project = db.get(Project, ids["project"])
    _set_status(db, project, "testing", "проверка", None)
    db.commit()
    rows = db.scalars(select(ProjectStatusHistory)).all()
    db.close()
    assert len(rows) == 1
    assert rows[0].status_to == "testing"
    assert rows[0].actor_user_id is None
