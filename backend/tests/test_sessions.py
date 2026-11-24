"""Тесты сессий: выход со всех устройств (ТЗ 9.4).

Проверяется главное свойство: после logout-all не остаётся НИ ОДНОЙ живой
сессии, а не только текущая. Смена пароля бесполезна, пока живы старые cookie.
"""

import os

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://test:test@127.0.0.1:1/test")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_current_user
from app.core.security import hash_token
from app.db.models import Base, Role, Session, User, user_roles
from app.db.session import get_session
from app.main import app


@pytest.fixture()
def env():
    """Пользователь с тремя живыми сессиями — как телефон, ноутбук и планшет."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    tables = [User.__table__, Role.__table__, user_roles, Session.__table__]
    Base.metadata.create_all(engine, tables=tables)
    Session_ = sessionmaker(bind=engine)

    from datetime import UTC, datetime, timedelta

    db = Session_()
    user = User(
        email="u@test.local", password_hash="x", display_name="U", status="active"
    )
    db.add(user)
    db.flush()
    expires = datetime.now(UTC) + timedelta(hours=24)
    for i in range(3):
        db.add(
            Session(
                user_id=user.id,
                token_hash=hash_token(f"token-{i}"),
                user_agent=f"device-{i}",
                expires_at=expires,
            )
        )
    db.commit()
    uid = user.id
    db.close()
    return Session_, uid


@pytest.fixture(autouse=True)
def clean_overrides():
    yield
    app.dependency_overrides.clear()


def _client(env, token="token-0"):
    """Клиент, вошедший под первой сессией."""
    Session_, uid = env

    def override_session():
        db = Session_()
        try:
            yield db
        finally:
            db.close()

    def override_user():
        db = Session_()
        try:
            return db.get(User, uid)
        finally:
            db.close()

    app.dependency_overrides[get_session] = override_session
    app.dependency_overrides[get_current_user] = override_user
    c = TestClient(app)
    c.cookies.set("alyaev_session", token)
    return c


def test_lists_all_devices(env):
    """Список показывает три устройства и помечает текущее (ТЗ 9.4)."""
    c = _client(env)
    r = c.get("/api/v1/auth/sessions")
    assert r.status_code == 200
    data = r.json()
    assert data["count"] == 3
    current = [s for s in data["items"] if s["current"]]
    assert len(current) == 1
    assert current[0]["user_agent"] == "device-0"


def test_logout_all_revokes_every_session(env):
    """Выход со всех устройств гасит все три сессии, а не только текущую."""
    Session_, _ = env
    c = _client(env)
    r = c.post("/api/v1/auth/logout-all")
    assert r.status_code == 200
    assert r.json()["revoked"] == 3

    db = Session_()
    rows = db.scalars(select(Session)).all()
    db.close()
    assert len(rows) == 3
    assert all(row.revoked_at is not None for row in rows)


def test_logout_all_twice_revokes_nothing_new(env):
    """Повторный выход не считает уже погашенные сессии — живых не осталось."""
    c = _client(env)
    assert c.post("/api/v1/auth/logout-all").json()["revoked"] == 3
    assert c.post("/api/v1/auth/logout-all").json()["revoked"] == 0


def test_sessions_never_expose_tokens(env):
    """В ответе нет самих токенов — только метаданные."""
    c = _client(env)
    body = c.get("/api/v1/auth/sessions").text
    assert "token_hash" not in body
    assert "token-0" not in body


def test_unauthorized_cannot_list_sessions():
    """Без входа список устройств закрыт."""
    app.dependency_overrides.clear()
    r = TestClient(app).get("/api/v1/auth/sessions")
    assert r.status_code == 401

