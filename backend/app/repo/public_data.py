"""Чтения публичных данных: категории, услуги, SEO, настройки.

Правило схемы: наружу отдаём только published и не удалённые записи.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db.models import SeoMetadata, Service, ServiceCategory, SiteSetting


def list_categories(session: Session) -> list[ServiceCategory]:
    """Активные категории в порядке сортировки."""
    stmt = (
        select(ServiceCategory)
        .where(ServiceCategory.is_active.is_(True))
        .order_by(ServiceCategory.sort_order, ServiceCategory.id)
    )
    return list(session.scalars(stmt))


def get_category_by_slug(session: Session, slug: str) -> ServiceCategory | None:
    """Активная категория по слагу или None."""
    stmt = select(ServiceCategory).where(
        ServiceCategory.slug == slug, ServiceCategory.is_active.is_(True)
    )
    return session.scalar(stmt)


def list_published_services(session: Session) -> list[Service]:
    """Опубликованные неудалённые услуги по возрастанию порядка."""
    stmt = (
        select(Service)
        .options(selectinload(Service.category))
        .where(Service.status == "published", Service.deleted_at.is_(None))
        .order_by(Service.sort_order, Service.id)
    )
    return list(session.scalars(stmt))


def get_service_by_slug(session: Session, slug: str) -> Service | None:
    """Опубликованная услуга по слагу или None."""
    stmt = select(Service).where(
        Service.slug == slug,
        Service.status == "published",
        Service.deleted_at.is_(None),
    )
    return session.scalars(stmt).first()


def get_seo(session: Session, path: str) -> SeoMetadata | None:
    """SEO-запись по публичному пути."""
    return session.scalars(select(SeoMetadata).where(SeoMetadata.path == path)).first()


def get_setting(session: Session, key: str) -> dict | None:
    """JSON-значение настройки или None."""
    row = session.scalars(select(SiteSetting).where(SiteSetting.key == key)).first()
    return row.value if row else None


def list_settings(session: Session) -> dict[str, dict]:
    """Все настройки сайта как словарь ключ → значение."""
    rows = session.scalars(select(SiteSetting)).all()
    return {row.key: row.value for row in rows}