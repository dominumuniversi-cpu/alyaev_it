"""Админка: библиотека готовых решений (ТЗ 7.4). Манифест: ui/solutions-library.md."""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.orm import Session as DbSession

from app.api.admin_content import _check_slug
from app.core import audit
from app.core.permissions import Permission, require_permission
from app.db.models import Solution, User
from app.db.session import get_session

router = APIRouter(prefix="/api/v1/admin/solutions", tags=["admin-solutions"])

# Типы решений по ТЗ 7.4. Список закрытый: свободный текст превратит каталог в хаос.
SOLUTION_KINDS = ("bot", "ai", "parser", "report", "integration", "script")
SOLUTION_STATUSES = ("draft", "published", "archived")


class SolutionPayload(BaseModel):
    """Тело создания/правки решения."""

    # Лишние поля — ошибка: опечатка в имени поля не должна давать пустую запись.
    model_config = ConfigDict(extra="forbid")

    slug: str = Field(min_length=1, max_length=160)
    title: str = Field(min_length=1, max_length=200)
    summary: str = Field(min_length=1, max_length=320)
    kind: str = Field(default="bot")
    description_md: str = Field(default="", max_length=50000)
    included: list[str] = Field(default_factory=list, max_length=30)
    requirements_md: str = Field(default="", max_length=20000)
    technologies: list[str] = Field(default_factory=list, max_length=30)
    price_from: int | None = Field(default=None, ge=0, le=10_000_000)
    price_on_request: bool = False
    demo_url: str | None = Field(default=None, max_length=255)
    status: str = Field(default="draft")
    sort_order: int = 0


def _apply(row: Solution, payload: SolutionPayload) -> None:
    """Переносит поля запроса в запись. Цена и флаг согласуются между собой."""
    row.title = payload.title.strip()
    row.summary = payload.summary.strip()
    row.kind = payload.kind
    row.description_md = payload.description_md
    row.included = [i.strip() for i in payload.included if i.strip()]
    row.requirements_md = payload.requirements_md
    row.technologies = [t.strip() for t in payload.technologies if t.strip()]
    row.demo_url = payload.demo_url.strip() if payload.demo_url else None
    row.sort_order = payload.sort_order
    row.status = payload.status

    # «По запросу» стирает цену: противоречивое сочетание путает и админку, и витрину.
    if payload.price_on_request:
        row.price_on_request = True
        row.price_from = None
    else:
        row.price_on_request = False
        row.price_from = payload.price_from


def _validate(payload: SolutionPayload) -> str:
    """Проверки до записи в базу. Возвращает нормализованный слаг."""
    if payload.kind not in SOLUTION_KINDS:
        raise HTTPException(422, "Тип решения: " + ", ".join(SOLUTION_KINDS))
    if payload.status not in SOLUTION_STATUSES:
        raise HTTPException(422, "Статус: draft, published или archived")
    return _check_slug(payload.slug)


def _row(row: Solution) -> dict:
    """Представление решения для админки."""
    return {
        "id": row.id,
        "slug": row.slug,
        "title": row.title,
        "summary": row.summary,
        "kind": row.kind,
        "description_md": row.description_md,
        "included": row.included,
        "requirements_md": row.requirements_md,
        "technologies": row.technologies,
        "price_from": row.price_from,
        "price_on_request": row.price_on_request,
        "demo_url": row.demo_url,
        "status": row.status,
        "sort_order": row.sort_order,
    }


@router.get("")
def list_solutions(
    session: DbSession = Depends(get_session),
    _: User = Depends(require_permission(Permission.CONTENT_READ)),
) -> dict:
    """Все решения, включая черновики; удалённые не показываем."""
    stmt = (
        select(Solution)
        .where(Solution.deleted_at.is_(None))
        .order_by(Solution.sort_order, Solution.id)
    )
    return {"items": [_row(r) for r in session.scalars(stmt)]}


@router.post("")
def create_solution(
    payload: SolutionPayload,
    session: DbSession = Depends(get_session),
    user: User = Depends(require_permission(Permission.CONTENT_WRITE)),
) -> dict:
    """Создаёт решение. Слаг проверяется на занятость вместе с удалёнными."""
    slug = _validate(payload)
    if session.scalar(select(Solution).where(Solution.slug == slug)) is not None:
        raise HTTPException(422, f"Слаг {slug} уже занят")
    row = Solution(slug=slug)
    session.add(row)
    _apply(row, payload)
    # flush даёт новый id до записи в журнал: иначе entity_id остаётся NULL.
    session.flush()
    audit.record(
        session,
        actor_user_id=user.id,
        action="solution.create",
        entity="solution",
        entity_id=row.id,
        payload={"slug": row.slug, "title": row.title, "status": row.status},
    )
    session.commit()
    return _row(row)


@router.patch("/{item_id}")
def update_solution(
    item_id: int,
    payload: SolutionPayload,
    session: DbSession = Depends(get_session),
    user: User = Depends(require_permission(Permission.CONTENT_WRITE)),
) -> dict:
    """Обновляет решение целиком."""
    row = session.get(Solution, item_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(404, "Решение не найдено")
    slug = _validate(payload)
    twin = session.scalar(select(Solution).where(Solution.slug == slug, Solution.id != item_id))
    if twin is not None:
        raise HTTPException(422, f"Слаг {slug} уже занят")
    row.slug = slug
    _apply(row, payload)
    # flush даёт новый id до записи в журнал: иначе entity_id остаётся NULL.
    session.flush()
    audit.record(
        session,
        actor_user_id=user.id,
        action="solution.update",
        entity="solution",
        entity_id=row.id,
        payload={"changes": payload.model_dump(exclude_unset=True)},
    )
    session.commit()
    return _row(row)


@router.delete("/{item_id}")
def delete_solution(
    item_id: int,
    session: DbSession = Depends(get_session),
    user: User = Depends(require_permission(Permission.CONTENT_WRITE)),
) -> dict:
    """Soft-delete: запись остаётся в базе, с сайта исчезает."""
    row = session.get(Solution, item_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(404, "Решение не найдено")
    row.deleted_at = datetime.now(UTC)
    row.status = "archived"
    audit.record(
        session,
        actor_user_id=user.id,
        action="solution.delete",
        entity="solution",
        entity_id=item_id,
    )
    session.commit()
    return {"id": item_id, "deleted": True}
