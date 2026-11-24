"""Админка: SEO-панель. Манифест: docs/manifests/ui/seo-panel.md

Проверки здесь — не украшение: дубль Title и занятый путь это ошибки,
которые ломают индексацию молча.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session as DbSession

from app.core import audit
from app.core.permissions import Permission, require_permission
from app.db.models import SeoMetadata, User
from app.db.session import get_session

router = APIRouter(prefix="/api/v1/admin/seo", tags=["admin-seo"])

# Разделы, которые не индексируются никогда (ТЗ 11.5). Переключатель для них не действует.
NOINDEX_PREFIXES = ("/account", "/login", "/register", "/admin", "/api", "/auth", "/reset")

# Пределы длины полей: за ними поисковик обрезает, и текст вводили зря.
TITLE_MIN, TITLE_MAX, TITLE_HARD = 30, 60, 160
DESC_MIN, DESC_MAX, DESC_HARD = 70, 160, 320


class SeoPayload(BaseModel):
    """Тело сохранения SEO-полей страницы."""

    path: str = Field(min_length=1, max_length=255)
    title: str = Field(min_length=1, max_length=TITLE_HARD)
    description: str = Field(default=..., max_length=DESC_HARD)
    h1: str = Field(default='', max_length=200)
    keywords: str = Field(default='', max_length=1000)
    canonical: str | None = Field(default=None, max_length=255)
    robots_index: bool = True
    robots_follow: bool = True
    og_title: str = Field(default='', max_length=TITLE_HARD)
    og_description: str = Field(default='', max_length=DESC_HARD)
    og_image: str = Field(default='', max_length=255)


def _normalize_path(raw: str) -> str:
    """Приводит путь к единому виду: ведущий и замыкающий слеш."""
    path = "/" + raw.strip().strip("/")
    if not path.endswith("/"):
        path += "/"
    return path


def _is_forced_noindex(path: str) -> bool:
    """Раздел закрыт от индексации по правилу, а не по настройке."""
    return any(path.startswith(prefix) for prefix in NOINDEX_PREFIXES)


def _warnings(title: str, description: str, h1: str) -> list[str]:
    """Предупреждения: не блокируют сохранение, но видны редактору."""
    result: list[str] = []
    if not (TITLE_MIN <= len(title) <= TITLE_MAX):
        result.append(f"Title {len(title)} символов, рекомендуется {TITLE_MIN}-{TITLE_MAX}")
    if not (DESC_MIN <= len(description) <= DESC_MAX):
        result.append(
            f"Description {len(description)} символов, рекомендуется {DESC_MIN}-{DESC_MAX}"
        )
    if not h1.strip():
        result.append("H1 не заполнен: страница теряет структуру")
    return result


@router.get("")
def list_seo(
    session: DbSession = Depends(get_session),
    _: User = Depends(require_permission(Permission.CONTENT_READ)),
) -> dict:
    """Все SEO-записи: что уже настроено вручную."""
    rows = session.scalars(select(SeoMetadata).order_by(SeoMetadata.path)).all()
    return {
        "items": [
            {
                "path": row.path,
                "title": row.title,
                "description": row.description,
                "robots_index": row.robots_index,
            }
            for row in rows
        ]
    }


@router.get("/{path:path}")
def get_seo(
    path: str,
    session: DbSession = Depends(get_session),
    _: User = Depends(require_permission(Permission.CONTENT_READ)),
) -> dict:
    """SEO-запись по пути со списком предупреждений. Пустая запись — это норма."""
    normalized = _normalize_path(path)
    row = session.scalar(select(SeoMetadata).where(SeoMetadata.path == normalized))
    if row is None:
        return {"path": normalized, "exists": False, "warnings": []}
    return {
        "path": row.path,
        "exists": True,
        "title": row.title,
        "description": row.description,
        "h1": row.h1,
        "keywords": row.keywords,
        "canonical": row.canonical,
        "robots_index": row.robots_index,
        "robots_follow": row.robots_follow,
        "og_title": row.og_title,
        "og_description": row.og_description,
        "og_image": row.og_image,
        "forced_noindex": _is_forced_noindex(row.path),
        "warnings": _warnings(row.title, row.description, row.h1),
    }


@router.put("/{path:path}")
def save_seo(
    path: str,
    payload: SeoPayload,
    session: DbSession = Depends(get_session),
    user: User = Depends(require_permission(Permission.CONTENT_WRITE)),
) -> dict:
    """Создаёт или обновляет SEO-запись. Ошибки блокируют сохранение."""
    normalized = _normalize_path(path)
    if _normalize_path(payload.path) != normalized:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Путь в теле не совпадает с путём в адресе",
        )

    # Дубль Title: две страницы про одно — и поисковик выбирает не ту.
    twin = session.scalar(
        select(SeoMetadata).where(
            SeoMetadata.title == payload.title.strip(),
            SeoMetadata.path != normalized,
        )
    )
    if twin is not None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Такой Title уже есть на {twin.path}: дубли мешают индексации",
        )

    row = session.scalar(select(SeoMetadata).where(SeoMetadata.path == normalized))
    if row is None:
        row = SeoMetadata(
            path=normalized,
            entity_type="page",
            entity_id=None,
        )
        session.add(row)

    row.title = payload.title.strip()
    row.description = payload.description.strip()
    row.h1 = payload.h1.strip()
    row.keywords = payload.keywords.strip()
    row.canonical = payload.canonical.strip() if payload.canonical else None
    # Закрытый раздел остаётся закрытым, что бы ни прислали.
    if _is_forced_noindex(normalized):
        row.robots_index = False
        row.robots_follow = False
    else:
        row.robots_index = payload.robots_index
        row.robots_follow = payload.robots_follow
    row.og_title = payload.og_title.strip()
    row.og_description = payload.og_description.strip()
    row.og_image = payload.og_image.strip()

    audit.record(
        session,
        actor_user_id=user.id,
        action="seo.save",
        entity="seo",
        entity_id=normalized,
        payload={"path": normalized, "title": payload.title},
    )
    session.commit()
    return {
        "path": row.path,
        "saved": True,
        "warnings": _warnings(row.title, row.description, row.h1),
        "forced_noindex": _is_forced_noindex(row.path),
    }
