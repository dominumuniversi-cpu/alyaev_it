"""Приём заявок с публичного сайта."""

import hashlib
from datetime import UTC, datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.schemas import LeadCreate
from app.db.models import Lead
from app.core.telegram import notify_new_lead
from app.db.session import get_session

router = APIRouter(prefix="/api/v1/leads", tags=["leads"])


def _contact_type(value: str) -> str:
    """Определяет способ связи по введённому значению."""
    stripped = value.strip()
    if stripped.startswith("@") or "t.me" in stripped:
        return "telegram"
    if "@" in stripped:
        return "email"
    return "phone"


def _hash_ip(request: Request) -> str | None:
    """Анонимизирует IP: соль запроса + sha256, сам адрес не храним."""
    forwarded = request.headers.get("x-forwarded-for", "")
    raw = forwarded.split(",")[0].strip() or (request.client.host if request.client else "")
    if not raw:
        return None
    return hashlib.sha256(("alyaev-lead:" + raw).encode()).hexdigest()[:32]


@router.post("")
def create_lead(
    payload: LeadCreate,
    request: Request,
    background: BackgroundTasks,
    session: Session = Depends(get_session),
) -> dict[str, str]:
    """Сохраняет заявку. Возвращает public_id, внутренний id наружу не отдаём."""
    if payload.website_check:
        # Бот заполнил скрытое поле: отвечаем как обычно, но ничего не пишем.
        raise HTTPException(status_code=202, detail="Принято")

    lead = Lead(
        name=payload.name,
        contact_type=_contact_type(payload.contact),
        contact_value=payload.contact.strip(),
        task_type=payload.task_type,
        message=payload.message,
        company_site=payload.company_site,
        source_page=payload.source_page,
        utm_json=payload.utm,
        status="new",
        consent_version=payload.consent_version,
        consent_at=datetime.now(UTC),
        ip_hash=_hash_ip(request),
        user_agent=(request.headers.get("user-agent") or "")[:500] or None,
    )
    session.add(lead)
    session.commit()

    # Уведомление уходит после ответа: посетитель не ждёт Telegram, а сбой отправки
    # не может отменить уже сохранённую заявку (docs/manifests/telegram-notifications.md).
    background.add_task(notify_new_lead, lead)

    return {"status": "ok", "public_id": lead.public_id}