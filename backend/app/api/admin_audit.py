"""Журнал действий администраторов: чтение. ТЗ 12.5, манифест доступа п. 8.

Запись в журнал делается автоматически в самих изменяющих эндпоинтах
через app.core.audit.record — здесь только чтение.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session as DbSession

from app.core.permissions import Permission, require_permission
from app.db.models import AuditLog, User
from app.db.session import get_session

router = APIRouter(prefix="/api/v1/admin/audit", tags=["admin-audit"])

# Человекочитаемые подписи действий: администратор должен понимать строку журнала,
# а не расшифровывать код "portfolio.update".
ACTION_LABELS: dict[str, str] = {
    "service.update": "Изменена услуга",
    "portfolio.create": "Создан кейс",
    "portfolio.update": "Изменён кейс",
    "portfolio.delete": "Удалён кейс",
    "article.create": "Создана статья",
    "article.update": "Изменена статья",
    "article.delete": "Удалена статья",
    "review.create": "Создан отзыв",
    "review.update": "Изменён отзыв",
    "review.delete": "Удалён отзыв",
    "seo.save": "Изменены SEO-настройки",
    "semantic.create": "Добавлен запрос в ядро",
    "semantic.update": "Изменён запрос ядра",
    "semantic.position": "Обновлена позиция",
    "client.create": "Создан клиент",
    "client.access_granted": "Выдан доступ клиенту",
    "client.password_reset": "Перевыпущен пароль клиента",
    "project.create": "Создан проект",
    "project.status": "Изменён статус проекта",
    "project.task_create": "Добавлена задача проекта",
    "project.task_status": "Изменён статус задачи",
    "project.reply": "Ответ клиенту",
    "semantic.delete": "Удалён запрос из ядра",
    "solution.create": "Создано решение",
    "solution.update": "Изменено решение",
    "solution.delete": "Удалено решение",
    "upload.create": "Загружен файл",
    "upload.delete": "Удалён файл",
}


def _row(row: AuditLog, actor_name: str | None) -> dict:
    """Одна запись журнала в виде, готовом для таблицы."""
    return {
        "id": row.id,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "actor": actor_name or "система",
        "action": row.action,
        "action_label": ACTION_LABELS.get(row.action, row.action),
        "entity": row.entity,
        "entity_id": row.entity_id,
        "payload": row.payload or {},
    }


@router.get("")
def list_entries(
    session: DbSession = Depends(get_session),
    _: User = Depends(require_permission(Permission.AUDIT_READ)),
    entity: str | None = Query(default=None, max_length=32),
    action: str | None = Query(default=None, max_length=64),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> dict:
    """Лента действий, новые сверху. Фильтры по сущности и действию."""
    stmt = select(AuditLog).order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
    count_stmt = select(func.count()).select_from(AuditLog)
    if entity:
        stmt = stmt.where(AuditLog.entity == entity)
        count_stmt = count_stmt.where(AuditLog.entity == entity)
    if action:
        stmt = stmt.where(AuditLog.action == action)
        count_stmt = count_stmt.where(AuditLog.action == action)

    rows = session.scalars(stmt.limit(limit).offset(offset)).all()
    total = session.scalar(count_stmt) or 0

    # Имена авторов одним запросом: иначе на каждую строку отдельный SELECT.
    actor_ids = {r.actor_user_id for r in rows if r.actor_user_id is not None}
    names: dict[int, str] = {}
    if actor_ids:
        for uid, email in session.execute(
            select(User.id, User.email).where(User.id.in_(actor_ids))
        ).all():
            names[uid] = email

    return {
        "items": [_row(r, names.get(r.actor_user_id) if r.actor_user_id else None) for r in rows],
        "total": total,
        "limit": limit,
        "offset": offset,
        # Список сущностей для фильтра — DISTINCT на стороне БД, а не выгрузка таблицы.
        "entities": sorted(session.scalars(select(AuditLog.entity).distinct()).all()),
        "actions": ACTION_LABELS,
    }
