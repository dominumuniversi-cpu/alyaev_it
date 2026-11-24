"""Тесты личного кабинета: клиент видит только свои проекты (ТЗ 9.3).

Проверяется не «отдаётся ли ответ», а «не отдаётся ли чужое». Фильтр по
client_id живёт в SQL — значит, и проверять его надо на настоящей сессии,
а не на заглушке: подменим зависимость get_session на SQLite с теми же моделями.
"""

import os

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://test:test@127.0.0.1:1/test")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import JSON, create_engine
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_current_user
from app.db.models import (
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
    """Два клиента, у каждого по проекту, плюс администратор без карточки клиента."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    # SQLite не умеет JSONB, поэтому создаём только нужные таблицы, а не весь
    # Base.metadata: иначе create_all падает на site_settings.value (JSONB).
    # Отбор при этом проверяется честно — по настоящим колонкам этих таблиц.
    # roles/user_roles нужны не для отбора проектов, а потому что их читает
    # get_current_user при проверке ролей. Без них подмена пользователя упадёт.
    tables = [
        User.__table__,
        Role.__table__,
        user_roles,
        Client.__table__,
        Project.__table__,
        ProjectTask.__table__,
        ProjectStatusHistory.__table__,
    ]
    # SQLite не рендерит JSONB в DDL. Подменяем тип на обычный JSON только на
    # время создания схемы: отбор по client_id от этого не меняется.
    for table in tables:
        for column in table.columns:
            if isinstance(column.type, JSONB):
                column.type = JSON()
    Base.metadata.create_all(engine, tables=tables)
    Session = sessionmaker(bind=engine)
    session = Session()

    owner_user = User(email="owner@test.local", password_hash="x", display_name="Owner", status="active")
    other_user = User(email="other@test.local", password_hash="x", display_name="Other", status="active")
    lonely_user = User(email="lonely@test.local", password_hash="x", display_name="Lonely", status="active")
    session.add_all([owner_user, other_user, lonely_user])
    session.flush()

    owner = Client(user_id=owner_user.id, display_name="Владелец")
    other = Client(user_id=other_user.id, display_name="Другой")
    session.add_all([owner, other])
    session.flush()

    own_project = Project(client_id=owner.id, title="Мой проект", status="dev")
    foreign_project = Project(client_id=other.id, title="Чужой проект", status="new")
    session.add_all([own_project, foreign_project])
    session.flush()

    session.add(ProjectTask(project_id=own_project.id, title="Задача", status="todo"))
    session.add(
        ProjectStatusHistory(
            project_id=own_project.id, status_from=None, status_to="new", comment="создан"
        )
    )
    session.commit()

    ids = {
        "owner": owner_user.id,
        "other": other_user.id,
        "lonely": lonely_user.id,
        "own_project": own_project.id,
        "foreign_project": foreign_project.id,
    }
    session.close()
    return Session, ids


def _client_as(env, user_id):
    """TestClient, у которого текущий пользователь подменён на заданного."""
    Session, ids = env

    def override_session():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    def override_user():
        db = Session()
        try:
            return db.get(User, user_id)
        finally:
            db.close()

    app.dependency_overrides[get_session] = override_session
    app.dependency_overrides[get_current_user] = override_user
    return TestClient(app)


@pytest.fixture(autouse=True)
def clean_overrides():
    """Подмены зависимостей не должны протекать в другие тесты."""
    yield
    app.dependency_overrides.clear()


def test_client_sees_only_own_projects(env):
    """В списке ровно один проект — свой. Чужой не попадает даже в счётчик."""
    client = _client_as(env, env[1]["owner"])
    response = client.get("/api/v1/account/projects")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 1
    titles = [p["title"] for p in data["items"]]
    assert titles == ["Мой проект"]
    assert "Чужой проект" not in titles


def test_foreign_project_answers_404_not_403(env):
    """Чужой проект неотличим от несуществующего — перебором не узнать, что он есть."""
    client = _client_as(env, env[1]["owner"])
    response = client.get("/api/v1/account/projects/" + str(env[1]["foreign_project"]))
    assert response.status_code == 404
    missing = client.get("/api/v1/account/projects/999999")
    assert missing.status_code == 404
    # Тексты одинаковые: разница в теле выдала бы существование проекта.
    assert response.json()["detail"] == missing.json()["detail"]


def test_own_project_shows_tasks_and_history(env):
    """Свой проект отдаётся с задачами и историей (ТЗ 9.1)."""
    client = _client_as(env, env[1]["owner"])
    response = client.get("/api/v1/account/projects/" + str(env[1]["own_project"]))
    assert response.status_code == 200
    data = response.json()
    assert data["status_label"] == "Разработка"
    assert [t["title"] for t in data["tasks"]] == ["Задача"]
    assert data["tasks"][0]["status_label"] == "Ожидает"
    assert data["history"][0]["comment"] == "создан"


def test_user_without_client_card_gets_404(env):
    """Пользователь без карточки клиента получает понятный отказ, а не пустой кабинет."""
    client = _client_as(env, env[1]["lonely"])
    response = client.get("/api/v1/account/projects")
    assert response.status_code == 404
    assert "не заведён" in response.json()["detail"]


def test_unauthorized_gets_401():
    """Без сессии кабинет закрыт — проверка на сервере, а не скрытием кнопок."""
    app.dependency_overrides.clear()
    response = TestClient(app).get("/api/v1/account/projects")
    assert response.status_code == 401

