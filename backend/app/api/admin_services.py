"""Админка: управление услугами и ценами. Требование ТЗ: цены меняются без правки кода."""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session as DbSession

from app.api.deps import require_staff
from app.db.models import AuditLog, Service, User
from app.db.session import get_session

router = APIRouter(prefix="/api/admin/services", tags=["admin-services"])


class ServiceUpdate(BaseModel):
    """Разрешённые к изменению поля услуги. Остальное меняется через специальные методы."""

    title: str | None = Field(default=None, min_length=3, max_length=200)
    short_description: str | None = Field(default=None, max_length=300)
    price_from: int | None = Field(default=None, ge=0, le=10_000_000)
    price_on_request: bool | None = None
    duration_text: str | None = Field(default=None, max_length=64)
    status: str | None = Field(default=None, max_length=16)


@router.get("")
def list_services(
    session: DbSession = Depends(get_session),
    _: User = Depends(require_staff),
) -> dict:
    """Все услуги включая черновики, по категориям."""
    rows = session.scalars(
        select(Service).where(Service.deleted_at.is_(None)).order_by(Service.category_id, Service.id)
    ).all()
    return {
        "items": [
            {
                "id": service.id,
                "slug": service.slug,
                "title": service.title,
                "category_id": service.category_id,
                "price_from": service.price_from,
                "price_on_request": service.price_on_request,
                "duration_text": service.duration_text,
                "status": service.status,
            }
            for service in rows
        ]
    }


@router.patch("/{service_id}")
def update_service(
    service_id: int,
    payload: ServiceUpdate,
    session: DbSession = Depends(get_session),
    user: User = Depends(require_staff),
) -> dict:
    """Меняет цену, срок и публикацию услуги. Пишет событие в журнал действий."""
    service = session.get(Service, service_id)
    if service is None or service.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Услуга не найдена")

    if payload.status is not None and payload.status not in ("draft", "published", "archived"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Недопустимый статус")

    # Цена и «по запросу» взаимоисключающие: нельзя оставить обе включёнными неявно.
    if payload.price_on_request:
        service.price_on_request = True
        service.price_from = None
    else:
        if payload.price_from is not None:
            service.price_from = payload.price_from
            service.price_on_request = False
        if payload.price_on_request is False:
            service.price_on_request = False

    if payload.title is not None:
        service.title = payload.title.strip()
    if payload.short_description is not None:
        service.short_description = payload.short_description.strip()
    if payload.duration_text is not None:
        service.duration_text = payload.duration_text.strip()
    if payload.status is not None:
        service.status = payload.status

    session.add(
        AuditLog(
            actor_user_id=user.id,
            action="service.update",
            entity="service",
            entity_id=str(service.id),
            payload={"changes": payload.model_dump(exclude_none=True)},
            created_at=datetime.now(UTC),
        )
    )
    session.commit()
    return {
        "status": "ok",
        "price_from": service.price_from,
        "price_on_request": service.price_on_request,
        "service_status": service.status,
    }