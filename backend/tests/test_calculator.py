"""Калькулятор: конфиг и правило «не ниже базовой цены» (ТЗ 7.1)."""

import os

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://test:test@127.0.0.1:1/test")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import JSON, create_engine
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.models import Base, CalculatorComplexity, CalculatorOption, Service, ServiceCategory
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
        ServiceCategory.__table__,
        Service.__table__,
        CalculatorOption.__table__,
        CalculatorComplexity.__table__,
    ]
    for table in tables:
        for column in table.columns:
            if isinstance(column.type, JSONB):
                column.type = JSON()
    Base.metadata.create_all(engine, tables=tables)
    Session_ = sessionmaker(bind=engine)

    def override():
        db = Session_()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_session] = override
    yield Session_
    app.dependency_overrides.clear()


def _fill(Session_):
    db = Session_()
    category = ServiceCategory(slug="bots", title="Боты")
    db.add(category)
    db.flush()
    db.add(Service(category_id=category.id, slug="bot", title="Бот", price_from=6000, status="published"))
    db.add(CalculatorOption(slug="crm", title="CRM", price_delta=5000, is_active=True))
    db.add(CalculatorComplexity(slug="basic", title="Базовая", factor=1, is_active=True))
    db.add(CalculatorComplexity(slug="hard", title="Сложная", factor=1.8, is_active=True))
    db.commit()
    db.close()


def test_config_returns_services_options_complexity(env):
    """Конфиг отдаёт всё, без чего калькулятор не посчитает."""
    _fill(env)
    data = TestClient(app).get("/api/v1/public/calculator").json()
    assert [s["slug"] for s in data["services"]] == ["bot"]
    assert [o["slug"] for o in data["options"]] == ["crm"]
    assert {c["slug"] for c in data["complexity"]} == {"basic", "hard"}


def test_empty_config_is_empty_lists(env):
    """Пустой прайс — пустые списки, а не ошибка: страница сама уйдёт в 404."""
    data = TestClient(app).get("/api/v1/public/calculator").json()
    assert data == {"services": [], "options": [], "complexity": []}


def test_complexity_factor_never_below_one(env):
    """Правило манифеста: коэффициент ниже 1.0 опускать нельзя.

    Если кто-то заведёт в базе 0.5, калькулятор начнёт продавать дешевле базы.
    Проверяем данные, которые отдаёт API: страховка на стороне прайса.
    """
    db = env()
    db.add(CalculatorComplexity(slug="cheap", title="Дешёвая", factor=0.5, is_active=True))
    db.commit()
    db.close()
    data = TestClient(app).get("/api/v1/public/calculator").json()
    factors = [c["factor"] for c in data["complexity"]]
    assert all(f >= 1 for f in factors), "коэффициент ниже 1.0 недопустим"


def test_inactive_option_is_hidden(env):
    """Выключенная опция не попадает в конфиг — её нельзя выбрать."""
    db = env()
    db.add(CalculatorOption(slug="off", title="Выключена", price_delta=9999, is_active=False))
    db.commit()
    db.close()
    data = TestClient(app).get("/api/v1/public/calculator").json()
    assert all(o["slug"] != "off" for o in data["options"])
