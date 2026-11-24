"""Админка: портфолио и статьи. Манифест: docs/manifests/ui/portfolio-articles.md

Два правила, ради которых этот модуль написан отдельно:
1. Статус кейса обязателен — демонстрация не выдаётся за коммерческое внедрение.
2. Дата публикации статьи ставится один раз и не обновляется при правках.
"""

import re
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import ConfigDict, BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session as DbSession

from app.core import audit
from app.core.permissions import Permission, require_permission
from app.db.models import Article, Portfolio, User
from app.db.session import get_session

router = APIRouter(prefix="/api/v1/admin/content", tags=["admin-content"])

PORTFOLIO_STATUSES = ("demo", "own", "commercial")
ARTICLE_STATUSES = ("draft", "published", "archived")

SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def _check_slug(slug: str) -> str:
    """Слаг: латиница, цифры и дефисы. Иначе URL сломает маршрут и SEO."""
    value = slug.strip().lower()
    if not SLUG_RE.match(value):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Слаг: только латиница, цифры и дефисы",
        )
    return value


class PortfolioPayload(BaseModel):
    """Тело создания/правки кейса."""
    # Лишние поля — ошибка, а не повод молча подставить значения по умолчанию.
    # Клиент, приславший "body" вместо "body_md", получил бы 200 и пустую статью.
    model_config = ConfigDict(extra="forbid")

    slug: str = Field(min_length=1, max_length=160)
    title: str = Field(min_length=1, max_length=200)
    summary: str = Field(min_length=1, max_length=320)
    problem_md: str = Field(default="", max_length=20000)
    solution_md: str = Field(default="", max_length=20000)
    technologies: list[str] = Field(default_factory=list, max_length=30)
    status: str = Field(default="demo")
    published: bool = False
    sort_order: int = 0


class ArticlePayload(BaseModel):
    """Тело создания/правки статьи."""
    # Лишние поля — ошибка, а не повод молча подставить значения по умолчанию.
    # Клиент, приславший "body" вместо "body_md", получил бы 200 и пустую статью.
    model_config = ConfigDict(extra="forbid")

    slug: str = Field(min_length=1, max_length=160)
    title: str = Field(min_length=1, max_length=200)
    excerpt: str = Field(default="", max_length=320)
    body_md: str = Field(default="", max_length=100000)
    status: str = Field(default="draft")
    sort_order: int = 0


def _portfolio_dict(row: Portfolio) -> dict:
    """Представление кейса для админки."""
    return {
        "id": row.id,
        "slug": row.slug,
        "title": row.title,
        "summary": row.summary,
        "problem_md": row.problem_md,
        "solution_md": row.solution_md,
        "technologies": row.technologies,
        "status": row.status,
        "published": row.published,
        "sort_order": row.sort_order,
    }


def _article_dict(row: Article) -> dict:
    """Представление статьи для админки."""
    return {
        "id": row.id,
        "slug": row.slug,
        "title": row.title,
        "excerpt": row.excerpt,
        "body_md": row.body_md,
        "status": row.status,
        "published_at": row.published_at.isoformat() if row.published_at else None,
        "sort_order": row.sort_order,
    }


@router.get("/portfolio")
def list_portfolio(
    session: DbSession = Depends(get_session),
    _: User = Depends(require_permission(Permission.CONTENT_READ)),
) -> dict:
    """Все кейсы, включая черновики; удалённые не показываем."""
    rows = session.scalars(
        select(Portfolio).where(Portfolio.deleted_at.is_(None)).order_by(Portfolio.sort_order, Portfolio.id)
    ).all()
    return {"items": [_portfolio_dict(r) for r in rows]}


@router.post("/portfolio")
def create_portfolio(
    payload: PortfolioPayload,
    session: DbSession = Depends(get_session),
    user: User = Depends(require_permission(Permission.CONTENT_WRITE)),
) -> dict:
    """Создаёт кейс. Статус обязан быть одним из трёх."""
    if payload.status not in PORTFOLIO_STATUSES:
        raise HTTPException(422, "Статус кейса: demo, own или commercial")
    slug = _check_slug(payload.slug)
    if session.scalar(select(Portfolio).where(Portfolio.slug == slug)) is not None:
        raise HTTPException(422, f"Слаг {slug} уже занят")
    row = Portfolio(slug=slug)
    session.add(row)
    _apply_portfolio(row, payload)
    audit.record(
        session,
        actor_user_id=user.id,
        action="portfolio.create",
        entity="portfolio",
        entity_id=row.id,
        payload={"slug": row.slug, "title": row.title, "published": row.published},
    )
    session.commit()
    return _portfolio_dict(row)


def _apply_portfolio(row: Portfolio, payload: PortfolioPayload) -> None:
    """Переносит поля из тела в запись без потери slug."""
    row.title = payload.title.strip()
    row.summary = payload.summary.strip()
    row.problem_md = payload.problem_md
    row.solution_md = payload.solution_md
    row.technologies = [t.strip() for t in payload.technologies if t.strip()]
    row.status = payload.status
    row.published = payload.published
    row.sort_order = payload.sort_order


@router.patch("/portfolio/{item_id}")
def update_portfolio(
    item_id: int,
    payload: PortfolioPayload,
    session: DbSession = Depends(get_session),
    user: User = Depends(require_permission(Permission.CONTENT_WRITE)),
) -> dict:
    """Правка кейса. Смена слага проверяется на занятость."""
    row = session.get(Portfolio, item_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(404, "Кейс не найден")
    if payload.status not in PORTFOLIO_STATUSES:
        raise HTTPException(422, "Статус кейса: demo, own или commercial")
    slug = _check_slug(payload.slug)
    twin = session.scalar(select(Portfolio).where(Portfolio.slug == slug, Portfolio.id != item_id))
    if twin is not None:
        raise HTTPException(422, f"Слаг {slug} уже занят")
    row.slug = slug
    _apply_portfolio(row, payload)
    audit.record(
        session,
        actor_user_id=user.id,
        action="portfolio.update",
        entity="portfolio",
        entity_id=item_id,
        payload={"changes": payload.model_dump(exclude_unset=True)},
    )
    session.commit()
    return _portfolio_dict(row)


@router.delete("/portfolio/{item_id}")
def delete_portfolio(
    item_id: int,
    session: DbSession = Depends(get_session),
    user: User = Depends(require_permission(Permission.CONTENT_WRITE)),
) -> dict:
    """Soft-delete: запись остаётся в базе, с сайта исчезает."""
    row = session.get(Portfolio, item_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(404, "Кейс не найден")
    row.deleted_at = datetime.now(UTC)
    row.published = False
    audit.record(
        session,
        actor_user_id=user.id,
        action="portfolio.delete",
        entity="portfolio",
        entity_id=item_id,
    )
    session.commit()
    return {"id": item_id, "deleted": True}


@router.get("/articles")
def list_articles(
    session: DbSession = Depends(get_session),
    _: User = Depends(require_permission(Permission.CONTENT_READ)),
) -> dict:
    """Все статьи, включая черновики; удалённые не показываем."""
    rows = session.scalars(
        select(Article).where(Article.deleted_at.is_(None)).order_by(Article.sort_order, Article.id)
    ).all()
    return {"items": [_article_dict(r) for r in rows]}


def _apply_article(row: Article, payload: ArticlePayload) -> None:
    """Переносит поля статьи и ставит дату публикации ровно один раз.

    Повторное сохранение не меняет published_at: обновление ради «свежей даты»
    обесценивает блог и вводит читателя в заблуждение.
    """
    row.title = payload.title.strip()
    row.excerpt = payload.excerpt.strip()
    row.body_md = payload.body_md
    row.sort_order = payload.sort_order
    if payload.status == "published" and row.published_at is None:
        row.published_at = datetime.now(UTC)
    row.status = payload.status


@router.post("/articles")
def create_article(
    payload: ArticlePayload,
    session: DbSession = Depends(get_session),
    user: User = Depends(require_permission(Permission.CONTENT_WRITE)),
) -> dict:
    """Создаёт статью. Статус обязан быть draft, published или archived."""
    if payload.status not in ARTICLE_STATUSES:
        raise HTTPException(422, "Статус статьи: draft, published или archived")
    slug = _check_slug(payload.slug)
    if session.scalar(select(Article).where(Article.slug == slug)) is not None:
        raise HTTPException(422, f"Слаг {slug} уже занят")
    row = Article(slug=slug)
    session.add(row)
    _apply_article(row, payload)
    audit.record(
        session,
        actor_user_id=user.id,
        action="article.create",
        entity="article",
        entity_id=row.id,
        payload={"slug": row.slug, "title": row.title, "status": row.status},
    )
    session.commit()
    return _article_dict(row)


@router.patch("/articles/{item_id}")
def update_article(
    item_id: int,
    payload: ArticlePayload,
    session: DbSession = Depends(get_session),
    user: User = Depends(require_permission(Permission.CONTENT_WRITE)),
) -> dict:
    """Правка статьи. Дата первой публикации сохраняется."""
    row = session.get(Article, item_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(404, "Статья не найдена")
    if payload.status not in ARTICLE_STATUSES:
        raise HTTPException(422, "Статус статьи: draft, published или archived")
    slug = _check_slug(payload.slug)
    twin = session.scalar(select(Article).where(Article.slug == slug, Article.id != item_id))
    if twin is not None:
        raise HTTPException(422, f"Слаг {slug} уже занят")
    row.slug = slug
    _apply_article(row, payload)
    audit.record(
        session,
        actor_user_id=user.id,
        action="article.update",
        entity="article",
        entity_id=item_id,
        payload={"changes": payload.model_dump(exclude_unset=True)},
    )
    session.commit()
    return _article_dict(row)


@router.delete("/articles/{item_id}")
def delete_article(
    item_id: int,
    session: DbSession = Depends(get_session),
    user: User = Depends(require_permission(Permission.CONTENT_WRITE)),
) -> dict:
    """Soft-delete статьи: запись остаётся, с сайта исчезает."""
    row = session.get(Article, item_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(404, "Статья не найдена")
    row.deleted_at = datetime.now(UTC)
    row.status = "archived"
    audit.record(
        session,
        actor_user_id=user.id,
        action="article.delete",
        entity="article",
        entity_id=item_id,
    )
    session.commit()
    return {"id": item_id, "deleted": True}
