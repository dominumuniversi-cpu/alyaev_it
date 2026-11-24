"""Уведомления в Telegram: главное — их отсутствие не ломает приём заявки."""

import pytest

from app.core import telegram


def test_not_configured_when_empty(monkeypatch):
    """Без токена и получателя уведомления выключены — это нормальный режим."""
    monkeypatch.setattr(telegram.settings, "telegram_bot_token", "")
    monkeypatch.setattr(telegram.settings, "telegram_chat_id", "")
    assert telegram.is_configured() is False


def test_not_configured_with_only_token(monkeypatch):
    """Токен без chat_id бесполезен: бот не знает, куда писать."""
    monkeypatch.setattr(telegram.settings, "telegram_bot_token", "123:abc")
    monkeypatch.setattr(telegram.settings, "telegram_chat_id", "")
    assert telegram.is_configured() is False


def test_configured_with_both(monkeypatch):
    monkeypatch.setattr(telegram.settings, "telegram_bot_token", "123:abc")
    monkeypatch.setattr(telegram.settings, "telegram_chat_id", "42")
    assert telegram.is_configured() is True


class _Lead:
    """Минимальный двойник заявки: нужны только поля, попадающие в сообщение."""

    name = "Иван"
    contact_value = "@ivan"
    task_type = "Автоматизация"
    message = "Нужен бот"
    source_page = "/contacts"


class _LeadWithoutOptional:
    name = "Пётр"
    contact_value = "+79000000000"
    task_type = None
    message = None
    source_page = None


def test_message_contains_all_fields():
    text = telegram._build_message(_Lead())
    for part in ("Иван", "@ivan", "Автоматизация", "Нужен бот", "/contacts"):
        assert part in text


def test_message_skips_empty_fields():
    """Пустых строк «Задача: » быть не должно — выглядит как сбой."""
    text = telegram._build_message(_LeadWithoutOptional())
    assert "Задача:" not in text
    assert "Сообщение:" not in text
    assert "Страница:" not in text
    assert "Пётр" in text


@pytest.mark.anyio
async def test_send_failure_never_raises(monkeypatch):
    """Telegram недоступен — функция обязана вернуть False, а не бросить исключение."""
    monkeypatch.setattr(telegram.settings, "telegram_bot_token", "123:abc")
    monkeypatch.setattr(telegram.settings, "telegram_chat_id", "42")

    class _BrokenClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            raise ConnectionError("сеть недоступна")

        async def __aexit__(self, *args):
            return False

    monkeypatch.setattr(telegram.httpx, "AsyncClient", _BrokenClient)
    assert await telegram.notify_new_lead(_Lead()) is False
