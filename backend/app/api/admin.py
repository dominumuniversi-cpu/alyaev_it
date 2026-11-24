"""Админка: заявки и смена статусов. Только для персонала (проверка на сервере)."""

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session as DbSession

from app.core.permissions import Permission, require_permission
from app.db.models import Lead, LeadEvent, Message, Project, User
from app.db.session import get_session

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

ALLOWED_STATUSES = ("new", "in_progress", "qualified", "proposal", "won", "lost", "spam")


class StatusPayload(BaseModel):
    """Смена статуса заявки."""

    status: str = Field(max_length=24)
    note: str | None = Field(default=None, max_length=1000)


def _lead_dict(lead: Lead) -> dict:
    """Публичное представление заявки для админки."""
    return {
        "public_id": lead.public_id,
        "name": lead.name,
        "contact_type": lead.contact_type,
        "contact_value": lead.contact_value,
        "task_type": lead.task_type,
        "message": lead.message,
        "company_site": lead.company_site,
        "source_page": lead.source_page,
        "status": lead.status,
        "utm": lead.utm_json,
        "created_at": lead.created_at.isoformat() if lead.created_at else None,
    }


@router.get("/attention")
def attention_summary(
    session: DbSession = Depends(get_session),
    _: User = Depends(require_permission(Permission.LEADS_READ)),
) -> dict:
    """Что требует внимания сотрудника — одним запросом на каждый показатель.

    Считается на сервере, а не на клиенте: клиенту пришлось бы тянуть все
    заявки и все сообщения только чтобы посчитать три числа.
    """
    new_leads = session.scalar(
        select(func.count())
        .select_from(Lead)
        .where(Lead.status == "new", Lead.deleted_at.is_(None))
    )
    client_messages = session.scalar(
        select(func.count())
        .select_from(Message)
        .join(Project, Project.id == Message.project_id)
        .where(Message.author_role == "client")
    )
    # Проект «без движения» — активный, но не менявшийся неделю.
    stale_before = datetime.now(UTC) - timedelta(days=7)
    stale = session.scalar(
        select(func.count())
        .select_from(Project)
        .where(Project.status != "done", Project.updated_at < stale_before)
    )
    return {
        "new_leads": new_leads or 0,
        "client_messages": client_messages or 0,
        "stale_projects": stale or 0,
    }


@router.get("/leads")
def list_leads(
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=50, ge=1, le=200),
    session: DbSession = Depends(get_session),
    _: User = Depends(require_permission(Permission.LEADS_READ)),
) -> dict:
    """Список заявок с фильтром по статусу и количеством по статусам."""
    query = select(Lead).where(Lead.deleted_at.is_(None))
    if status_filter:
        query = query.where(Lead.status == status_filter)
    query = query.order_by(Lead.created_at.desc()).limit(limit)
    leads = session.scalars(query).all()

    counts_rows = session.execute(
        select(Lead.status, func.count()).where(Lead.deleted_at.is_(None)).group_by(Lead.status)
    ).all()
    counts = {row[0]: row[1] for row in counts_rows}

    return {"items": [_lead_dict(lead) for lead in leads], "counts": counts, "total": sum(counts.values())}


@router.patch("/leads/{public_id}/status")
def change_status(
    public_id: str,
    payload: StatusPayload,
    session: DbSession = Depends(get_session),
    user: User = Depends(require_permission(Permission.LEADS_WRITE)),
) -> dict:
    """Меняет статус заявки и пишет событие в историю."""
    if payload.status not in ALLOWED_STATUSES:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Недопустимый статус")

    lead = session.scalar(select(Lead).where(Lead.public_id == public_id, Lead.deleted_at.is_(None)))
    if lead is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заявка не найдена")

    previous = lead.status
    lead.status = payload.status
    session.add(
        LeadEvent(
            lead_id=lead.id,
            event="status_change",
            payload={"from": previous, "to": payload.status, "note": payload.note},
            actor_user_id=user.id,
            created_at=datetime.now(UTC),
        )
    )
    session.commit()
    return {"status": "ok", "lead_status": lead.status}