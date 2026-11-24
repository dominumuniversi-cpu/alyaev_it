"""Чтения портфолио и статей. Манифест: docs/manifests/ui/portfolio-articles.md

Наружу отдаём только опубликованное и не удалённое: черновик не должен
утечь на сайт даже по прямому адресу.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Article, Portfolio, Solution


def list_published_portfolio(session: Session) -> list[Portfolio]:
    """Опубликованные неудалённые кейсы по порядку сортировки."""
    stmt = (
        select(Portfolio)
        .where(Portfolio.published.is_(True), Portfolio.deleted_at.is_(None))
        .order_by(Portfolio.sort_order, Portfolio.id)
    )
    return list(session.scalars(stmt))


def get_published_portfolio(session: Session, slug: str) -> Portfolio | None:
    """Опубликованный кейс по слагу."""
    stmt = select(Portfolio).where(
        Portfolio.slug == slug,
        Portfolio.published.is_(True),
        Portfolio.deleted_at.is_(None),
    )
    return session.scalars(stmt).first()


def list_published_articles(session: Session) -> list[Article]:
    """Опубликованные статьи, свежие сверху."""
    stmt = (
        select(Article)
        .where(Article.status == "published", Article.deleted_at.is_(None))
        .order_by(Article.published_at.desc().nullslast(), Article.id.desc())
    )
    return list(session.scalars(stmt))


def get_published_article(session: Session, slug: str) -> Article | None:
    """Опубликованная статья по слагу."""
    stmt = select(Article).where(
        Article.slug == slug,
        Article.status == "published",
        Article.deleted_at.is_(None),
    )
    return session.scalars(stmt).first()


def list_published_solutions(session: Session) -> list[Solution]:
    """Опубликованные неудалённые решения по порядку сортировки."""
    stmt = (
        select(Solution)
        .where(Solution.status == "published", Solution.deleted_at.is_(None))
        .order_by(Solution.sort_order, Solution.id)
    )
    return list(session.scalars(stmt))


def get_published_solution(session: Session, slug: str) -> Solution | None:
    """Опубликованное решение по слагу; черновик и удалённое не находятся."""
    stmt = select(Solution).where(
        Solution.slug == slug,
        Solution.status == "published",
        Solution.deleted_at.is_(None),
    )
    return session.scalars(stmt).first()


def list_solutions_by_service(session: Session, service_slug: str) -> list[Solution]:
    """Опубликованные решения, привязанные к услуге."""
    stmt = (
        select(Solution)
        .where(
            Solution.service_slug == service_slug,
            Solution.status == "published",
            Solution.deleted_at.is_(None),
        )
        .order_by(Solution.sort_order, Solution.id)
    )
    return list(session.scalars(stmt))
