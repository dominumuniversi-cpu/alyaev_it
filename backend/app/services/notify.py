"""Уведомления пользователям. Манифест: docs/manifests/db/schema.md.

Одно правило на весь проект: автор события уведомление о самом себе не получает.
Иначе человек видит «новое сообщение» от себя же — и перестаёт верить уведомлениям.
"""

from sqlalchemy.orm import Session as DbSession

from app.db.models import Client, Notification, Project


def notify_user(
    session: DbSession,
    user_id: int | None,
    *,
    kind: str,
    title: str,
    body: str = "",
    project_id: int | None = None,
) -> Notification | None:
    """Создаёт уведомление. Возвращает None, если адресата нет.

    Транзакцию не закрываем: уведомление пишется в той же транзакции,
    что и само событие — иначе возможен ответ без уведомления или наоборот.
    """
    if user_id is None:
        # У клиента может не быть учётной записи — это нормально, уведомлять некого.
        return None
    note = Notification(
        user_id=user_id,
        kind=kind,
        title=title,
        body=body,
        project_id=project_id,
    )
    session.add(note)
    return note


def notify_client_owner(
    session: DbSession,
    project: Project,
    *,
    kind: str,
    title: str,
    body: str = "",
    exclude_user_id: int | None = None,
) -> Notification | None:
    """Уведомляет владельца проекта, кроме автора события."""
    client = session.get(Client, project.client_id)
    if client is None:
        return None
    if exclude_user_id is not None and client.user_id == exclude_user_id:
        # Клиент сам написал — уведомлять его же незачем.
        return None
    return notify_user(
        session,
        client.user_id,
        kind=kind,
        title=title,
        body=body,
        project_id=project.id,
    )
