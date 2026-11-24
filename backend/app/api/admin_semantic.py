"""Админка: семантическое ядро (ТЗ 11.4). Манифест: docs/manifests/ui/semantic-core.md

Ядро — рабочая таблица, а не архив: у каждого запроса обязательна целевая страница.
Запрос без цели нельзя ни отработать, ни проверить, поэтому он не сохраняется.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session as DbSession

from app.core.permissions import Permission, require_permission
from app.db.models import SemanticQuery, User
from app.db.session import get_session

router = APIRouter(prefix="/api/v1/admin/semantic", tags=["admin-semantic"])

# Группы из ТЗ 11.4. Список закрытый: свободные группы превращают ядро в свалку.
GROUPS = (
    "telegram",
    "ai",
    "rag",
    "automation",
    "parsers",
    "integrations",
    "websites",
)
PRIORITIES = ("high", "medium", "low")


class QueryPayload(BaseModel):
    """Тело создания и правки запроса ядра."""

    query: str = Field(min_length=2, max_length=200)
    group_slug: str = Field(min_length=2, max_length=32)
    target_path: str = Field(min_length=1, max_length=255)
    priority: str = "medium"
    frequency: int | None = Field(default=None, ge=0, le=10_000_000)
    frequency_source: str | None = Field(default=None, max_length=32)
    difficulty: int | None = Field(default=None, ge=0, le=100)
    region: str = Field(default="ru", min_length=2, max_length=32)
    cluster: str | None = Field(default=None, max_length=64)
    notes: str = Field(default="", max_length=2000)


class PositionPayload(BaseModel):
    """Обновление позиции: отдельный вызов, чтобы не терять историю проверок."""

    position: int | None = Field(default=None, ge=1, le=1000)


def _normalize_path(raw: str) -> str:
    """Путь в том же виде, что и в seo_metadata: с ведущим слешем, без замыкающего."""
    path = "/" + raw.strip().strip("/")
    return path


def _validate_group(value: str) -> str:
    """Группа только из списка ТЗ — иначе группировка в отчётах разъезжается."""
    if value not in GROUPS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Неизвестная группа: " + ", ".join(GROUPS),
        )
    return value


def _validate_priority(value: str) -> str:
    """Приоритет только из списка: сортировка и фильтры опираются на него."""
    if value not in PRIORITIES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Приоритет должен быть: " + ", ".join(PRIORITIES),
        )
    return value


def _row_dict(row: SemanticQuery) -> dict:
    """Представление запроса для админки."""
    return {
        "id": row.id,
        "query": row.query,
        "group_slug": row.group_slug,
        "target_path": row.target_path,
        "priority": row.priority,
        "frequency": row.frequency,
        "frequency_source": row.frequency_source,
        "difficulty": row.difficulty,
        "region": row.region,
        "position": row.position,
        "position_checked_at": (
            row.position_checked_at.isoformat() if row.position_checked_at else None
        ),
        "cluster": row.cluster,
        "notes": row.notes,
    }


@router.get("")
def list_queries(
    group: str | None = Query(default=None),
    target: str | None = Query(default=None),
    priority: str | None = Query(default=None),
    session: DbSession = Depends(get_session),
    _: User = Depends(require_permission(Permission.CONTENT_READ)),
) -> dict:
    """Список запросов с фильтрами и сводкой по группам."""
    stmt = select(SemanticQuery)
    if group:
        stmt = stmt.where(SemanticQuery.group_slug == group)
    if target:
        stmt = stmt.where(SemanticQuery.target_path == _normalize_path(target))
    if priority:
        stmt = stmt.where(SemanticQuery.priority == priority)
    # Неизмеренные (NULL) уезжают в конец, а не путаются со значениями.
    stmt = stmt.order_by(
        SemanticQuery.group_slug, SemanticQuery.frequency.desc().nullslast(), SemanticQuery.query
    )
    rows = session.scalars(stmt).all()

    by_group = {
        row.group_slug: row.total
        for row in session.execute(
            select(SemanticQuery.group_slug, func.count().label("total")).group_by(
                SemanticQuery.group_slug
            )
        ).all()
    }
    return {
        "items": [_row_dict(row) for row in rows],
        "total": len(rows),
        "by_group": by_group,
        "groups": list(GROUPS),
        "priorities": list(PRIORITIES),
    }


@router.get("/summary")
def summary(
    session: DbSession = Depends(get_session),
    _: User = Depends(require_permission(Permission.CONTENT_READ)),
) -> dict:
    """Сводка для SEO-панели: сколько запросов и на какие страницы они целятся."""
    rows = session.execute(
        select(SemanticQuery.target_path, func.count().label("total"))
        .group_by(SemanticQuery.target_path)
        .order_by(func.count().desc())
    ).all()
    unmeasured = session.scalar(
        select(func.count()).select_from(SemanticQuery).where(SemanticQuery.frequency.is_(None))
    )
    return {
        "by_target": [{"path": row.target_path, "total": row.total} for row in rows],
        "unmeasured": unmeasured or 0,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_query(
    payload: QueryPayload,
    session: DbSession = Depends(get_session),
    _: User = Depends(require_permission(Permission.CONTENT_WRITE)),
) -> dict:
    """Добавляет запрос в ядро."""
    _validate_group(payload.group_slug)
    _validate_priority(payload.priority)
    query = payload.query.strip()
    path = _normalize_path(payload.target_path)

    twin = session.scalar(
        select(SemanticQuery).where(
            SemanticQuery.query == query, SemanticQuery.region == payload.region
        )
    )
    if twin is not None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Такой запрос в этом регионе уже есть в ядре",
        )

    row = SemanticQuery(
        query=query,
        group_slug=payload.group_slug,
        target_path=path,
        priority=payload.priority,
        frequency=payload.frequency,
        frequency_source=payload.frequency_source,
        difficulty=payload.difficulty,
        region=payload.region,
        cluster=payload.cluster,
        notes=payload.notes.strip(),
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return {"item": _row_dict(row)}


@router.patch("/{query_id}")
def update_query(
    query_id: int,
    payload: QueryPayload,
    session: DbSession = Depends(get_session),
    _: User = Depends(require_permission(Permission.CONTENT_WRITE)),
) -> dict:
    """Правит запрос целиком: частотность, страницу, приоритет, заметки."""
    _validate_group(payload.group_slug)
    _validate_priority(payload.priority)
    row = session.get(SemanticQuery, query_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Запрос не найден")

    query = payload.query.strip()
    twin = session.scalar(
        select(SemanticQuery).where(
            SemanticQuery.query == query,
            SemanticQuery.region == payload.region,
            SemanticQuery.id != query_id,
        )
    )
    if twin is not None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Такой запрос в этом регионе уже есть в ядре",
        )

    row.query = query
    row.group_slug = payload.group_slug
    row.target_path = _normalize_path(payload.target_path)
    row.priority = payload.priority
    row.frequency = payload.frequency
    row.frequency_source = payload.frequency_source
    row.difficulty = payload.difficulty
    row.region = payload.region
    row.cluster = payload.cluster
    row.notes = payload.notes.strip()
    session.commit()
    session.refresh(row)
    return {"item": _row_dict(row)}


@router.post("/{query_id}/position")
def set_position(
    query_id: int,
    payload: PositionPayload,
    session: DbSession = Depends(get_session),
    _: User = Depends(require_permission(Permission.CONTENT_WRITE)),
) -> dict:
    """Фиксирует позицию и дату проверки. Пустая позиция = «выпал из выдачи»."""
    row = session.get(SemanticQuery, query_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Запрос не найден")
    row.position = payload.position
    row.position_checked_at = datetime.now(timezone.utc)
    session.commit()
    session.refresh(row)
    return {"item": _row_dict(row)}


@router.delete("/{query_id}")
def delete_query(
    query_id: int,
    session: DbSession = Depends(get_session),
    _: User = Depends(require_permission(Permission.CONTENT_WRITE)),
) -> dict:
    """Удаляет запрос. Ядро — рабочий список, история в нём не нужна."""
    row = session.get(SemanticQuery, query_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Запрос не найден")
    session.delete(row)
    session.commit()
    return {"deleted": True}
