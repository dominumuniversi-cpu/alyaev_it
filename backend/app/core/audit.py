"""Единая запись в журнал действий администраторов.

ТЗ 12.5: изменения должны быть прослеживаемы — кто, что и когда поменял.
Журнал пишется в той же транзакции, что и само изменение: если действие
откатилось, запись о нём тоже не останется. Иначе в журнале появятся
строки о том, чего не случилось.

Что НЕ пишем в payload: пароли, токены, полные тексты персональных данных.
Для диффа достаточно имён полей и новых значений контентных сущностей.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session as DbSession

from app.db.models import AuditLog


def record(
    session: DbSession,
    *,
    actor_user_id: int | None,
    action: str,
    entity: str,
    entity_id: str | int | None = None,
    payload: dict[str, Any] | None = None,
) -> AuditLog:
    """Добавляет запись в журнал. Коммит делает вызывающий код — не здесь.

    Причина: запись должна попасть в ту же транзакцию, что и изменение.
    Если коммитить внутри, при ошибке дальше по коду в журнале останется
    след о действии, которое не сохранилось.
    """
    entry = AuditLog(
        actor_user_id=actor_user_id,
        action=action,
        entity=entity,
        entity_id=None if entity_id is None else str(entity_id),
        payload=_sanitize(payload or {}),
    )
    session.add(entry)
    return entry


# Поля, значения которых в журнал не попадают никогда.
_SECRET_KEYS = {
    "password",
    "password_hash",
    "current_password",
    "new_password",
    "token",
    "access_token",
    "refresh_token",
    "secret",
    "api_key",
}


def _sanitize(payload: dict[str, Any]) -> dict[str, Any]:
    """Убирает секреты из payload, оставляя факт их изменения."""
    clean: dict[str, Any] = {}
    for key, value in payload.items():
        if key.lower() in _SECRET_KEYS:
            clean[key] = "[скрыто]"
        elif isinstance(value, dict):
            clean[key] = _sanitize(value)
        else:
            clean[key] = value
    return clean


def diff(before: dict[str, Any], after: dict[str, Any]) -> dict[str, Any]:
    """Только изменившиеся поля: {поле: {"было": ..., "стало": ...}}.

    Полный снимок объекта раздувает журнал и прячет суть — reviewer видит
    двадцать одинаковых полей вместо одной поменявшейся цены.
    """
    changes: dict[str, Any] = {}
    for key, new_value in after.items():
        old_value = before.get(key)
        if old_value != new_value:
            changes[key] = {"было": old_value, "стало": new_value}
    return changes
