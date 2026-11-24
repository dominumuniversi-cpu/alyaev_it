"""Админка: отзывы клиентов. Манифест: docs/manifests/ui/admin-reviews.md

Главное правило: отзыв виден на сайте, только если есть и статус published,
и согласие автора. Отзыв согласия сбрасывает и публикацию — сам, без подсказок.
"""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session as DbSession

from app.core import audit
from app.core.permissions import Permission, require_permission
from app.db.models import Review, User
from app.db.session import get_session

router = APIRouter(prefix="/api/v1/admin/reviews", tags=["admin-reviews"])

REVIEW_STATUSES = ("draft", "published", "archived")


class ReviewPayload(BaseModel):
    """Тело создания или правки отзыва."""

    author_name: str = Field(min_length=1, max_length=120)
    author_position: str = Field(default="", max_length=120)
    text: str = Field(min_length=1, max_length=5000)
    project_title: str = Field(default="", max_length=200)
    consent_given: bool = False
    consent_version: str = Field(default="", max_length=16)
    status: str = Field(default="draft")
    sort_order: int = 0


def _review_dict(row: Review) -> dict:
    """Представление отзыва для админки."""
    return {
        "id": row.id,
        "author_name": row.author_name,
        "author_position": row.author_position,
        "text": row.text,
        "project_title": row.project_title,
        "consent_given": row.consent_given,
        "consent_at": row.consent_at.isoformat() if row.consent_at else None,
        "consent_version": row.consent_version,
        "status": row.status,
        "published_at": row.published_at.isoformat() if row.published_at else None,
        "sort_order": row.sort_order,
        # На сайте отзыв без согласия не покажется — предупреждаем в админке.
        "visible_on_site": row.status == "published" and row.consent_given,
    }


def _apply(row: Review, payload: ReviewPayload) -> None:
    """Переносит поля и ведёт даты согласия и публикации."""
    if payload.status not in REVIEW_STATUSES:
        raise HTTPException(422, "Недопустимый статус отзыва")

    now = datetime.now(UTC)

    # Согласие: фиксируем момент, когда его дали; отзыв согласия обнуляет всё.
    if payload.consent_given and not row.consent_given:
        row.consent_at = now
    elif not payload.consent_given:
        row.consent_at = None

    row.consent_given = payload.consent_given

    # Статус: дата публикации ставится один раз, при снятии с публикации — обнуляется.
    if payload.status == "published" and row.status != "published":
        row.published_at = now
    elif payload.status != "published":
        row.published_at = None

    # Отозвали согласие — отзыв не может остаться опубликованным.
    if not payload.consent_given and payload.status == "published":
        row.status = "draft"
        row.published_at = None
    else:
        row.status = payload.status

    row.author_name = payload.author_name.strip()
    row.author_position = (payload.author_position or "").strip() or None
    row.text = payload.text.strip()
    row.project_title = (payload.project_title or "").strip() or None
    row.consent_version = (payload.consent_version or "").strip() or None
    row.sort_order = payload.sort_order


@router.get("")
def list_reviews(
    session: DbSession = Depends(get_session),
    _: User = Depends(require_permission(Permission.CONTENT_READ)),
) -> dict:
    """Все отзывы, включая черновики; удалённые не показываем."""
    rows = session.scalars(
        select(Review).where(Review.deleted_at.is_(None)).order_by(Review.sort_order, Review.id)
    ).all()
    return {"items": [_review_dict(r) for r in rows]}


@router.post("")
def create_review(
    payload: ReviewPayload,
    session: DbSession = Depends(get_session),
    user: User = Depends(require_permission(Permission.CONTENT_WRITE)),
) -> dict:
    """Создаёт отзыв. Даты согласия и публикации проставляются сами."""
    row = Review(
        author_name=payload.author_name.strip(),
        text=payload.text.strip(),
        status="draft",
        consent_given=False,
    )
    session.add(row)
    _apply(row, payload)
    audit.record(
        session,
        actor_user_id=user.id,
        action="review.create",
        entity="review",
        entity_id=row.id,
        payload={"author": row.author_name, "rating": row.rating},
    )
    session.commit()
    session.refresh(row)
    return _review_dict(row)


@router.patch("/{review_id}")
def update_review(
    review_id: int,
    payload: ReviewPayload,
    session: DbSession = Depends(get_session),
    user: User = Depends(require_permission(Permission.CONTENT_WRITE)),
) -> dict:
    """Полная замена полей отзыва с пересчётом дат."""
    row = session.get(Review, review_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(404, "Отзыв не найден")
    _apply(row, payload)
    audit.record(
        session,
        actor_user_id=user.id,
        action="review.update",
        entity="review",
        entity_id=review_id,
        payload={"changes": payload.model_dump(exclude_unset=True)},
    )
    session.commit()
    session.refresh(row)
    return _review_dict(row)


@router.delete("/{review_id}")
def delete_review(
    review_id: int,
    session: DbSession = Depends(get_session),
    user: User = Depends(require_permission(Permission.CONTENT_WRITE)),
) -> dict:
    """Мягкое удаление: запись остаётся в базе, с сайта исчезает."""
    row = session.get(Review, review_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(404, "Отзыв не найден")
    row.deleted_at = datetime.now(UTC)
    row.status = "archived"
    row.published_at = None
    audit.record(
        session,
        actor_user_id=user.id,
        action="review.delete",
        entity="review",
        entity_id=review_id,
    )
    session.commit()
    return {"id": review_id, "deleted": True}
