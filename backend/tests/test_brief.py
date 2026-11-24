"""Онлайн-бриф (ТЗ 14). Манифест: docs/manifests/ui/lead-form.md, db/schema.md."""

import os

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://test:test@127.0.0.1:1/test")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import JSON, create_engine, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.models import Base, Lead
from app.db.session import get_session
from app.main import app
from app.api.schemas import BRIEF_FIELDS


@pytest.fixture()
def env(monkeypatch):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    for table in Lead.__table__.columns:
        if isinstance(table.type, JSONB):
            table.type = JSON()
    Base.metadata.create_all(engine, tables=[Lead.__table__])
    Session_ = sessionmaker(bind=engine)

    def override():
        db = Session_()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_session] = override
    # Telegram-уведомление в тестах не нужно и полезло бы в сеть.
    monkeypatch.setattr("app.api.leads.notify_new_lead", lambda *a, **k: None)
    yield Session_
    app.dependency_overrides.clear()


def _lead(Session_, **brief):
    body = {
        "name": "Тест",
        "contact": "@test_user",
        "message": "Нужен бот для приёма заявок в Telegram",
        "consent_version": "1.0",
    }
    if brief:
        body["brief"] = brief
    c = TestClient(app)
    r = c.post("/api/v1/leads", json=body)
    assert r.status_code == 200, r.text
    db = Session_()
    lead = db.scalars(select(Lead)).first()
    result = dict(lead.brief_json or {})
    db.close()
    return result


def test_known_brief_fields_are_saved(env):
    """Известные вопросы брифа сохраняются как есть."""
    saved = _lead(env, current="Excel", systems="CRM, 1С", staff="5", budget="до 50 000")
    assert saved == {"current": "Excel", "systems": "CRM, 1С", "staff": "5", "budget": "до 50 000"}


def test_unknown_brief_keys_are_dropped(env):
    """Неизвестный ключ не роняет заявку, но и не попадает в базу."""
    saved = _lead(env, current="Excel", evil="<script>alert(1)</script>", hacker="1")
    assert saved == {"current": "Excel"}


def test_empty_brief_values_are_not_stored(env):
    """Пустые ответы не храним — они мешают фильтрам и не несут смысла."""
    saved = _lead(env, current="Excel", systems="", budget="   ")
    assert saved == {"current": "Excel"}


def test_brief_values_are_trimmed_and_cut(env):
    """Пробелы убираются, слишком длинное обрезается по длине поля."""
    saved = _lead(env, current="  Excel  ", result="я" * 1000)
    assert saved["current"] == "Excel"
    assert len(saved["result"]) == BRIEF_FIELDS["result"]


def test_lead_without_brief_still_works(env):
    """Старая форма без брифа продолжает работать — пустой объект, а не ошибка."""
    saved = _lead(env)
    assert saved == {}
