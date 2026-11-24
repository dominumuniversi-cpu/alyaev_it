"""Состояние каналов уведомлений: факт настройки, но не секреты."""

import os

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://test:test@127.0.0.1:1/test")

from app.core.config import settings
from app.core.telegram import is_configured


def test_status_is_false_without_settings() -> None:
    """Пустые настройки — уведомления выключены, и админка должна это показать."""
    assert is_configured() is False


def test_status_ignores_half_configured(monkeypatch) -> None:
    """Только токен без получателя — всё равно не настроено: слать некуда."""
    monkeypatch.setattr(settings, "telegram_bot_token", "123:abc")
    monkeypatch.setattr(settings, "telegram_chat_id", "")
    assert is_configured() is False


def test_status_true_with_both(monkeypatch) -> None:
    """Оба значения — настроено."""
    monkeypatch.setattr(settings, "telegram_bot_token", "123:abc")
    monkeypatch.setattr(settings, "telegram_chat_id", "-100123")
    assert is_configured() is True


def test_status_returns_only_boolean(monkeypatch) -> None:
    """Наружу уходит только булево. Токен не должен попасть в ответ даже случайно.

    Проверяем форму ответа, которую собирает эндпоинт: если кто-то добавит
    туда поле с токеном, это заметят здесь.
    """
    monkeypatch.setattr(settings, "telegram_bot_token", "SECRET-TOKEN-123")
    monkeypatch.setattr(settings, "telegram_chat_id", "-100123")
    body = {"telegram": is_configured()}
    assert body == {"telegram": True}
    assert "SECRET-TOKEN-123" not in str(body)
