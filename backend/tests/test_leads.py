"""Тесты приёма заявок: валидация, определение контакта, ловушка для ботов."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _payload(**overrides):
    """Собирает корректную заявку с переопределениями."""
    base = {
        "name": "Иван Петров",
        "contact": "@ivan",
        "message": "Нужен бот для приёма заявок с сайта и уведомлениями.",
        "consent_version": "1.0",
    }
    base.update(overrides)
    return base


def test_short_message_rejected():
    """Сообщение короче 20 символов отклоняется (422)."""
    response = client.post("/api/leads", json=_payload(message="коротко"))
    assert response.status_code == 422


def test_missing_consent_version_rejected():
    """Без версии согласия заявка не принимается."""
    payload = _payload()
    payload.pop("consent_version")
    response = client.post("/api/leads", json=payload)
    assert response.status_code == 422


def test_bad_site_url_rejected():
    """Ссылка на сайт без http(s) отклоняется."""
    response = client.post("/api/leads", json=_payload(company_site="no-scheme.ru"))
    assert response.status_code == 422


def test_contact_type_detection():
    """@username — telegram, почта — email, остальное — phone."""
    from app.api.leads import _contact_type

    assert _contact_type("@user") == "telegram"
    assert _contact_type("https://t.me/user") == "telegram"
    assert _contact_type("user@mail.ru") == "email"
    assert _contact_type("+7 999 123-45-67") == "phone"