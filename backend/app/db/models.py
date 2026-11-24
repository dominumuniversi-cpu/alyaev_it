"""Модели БД. Источник истины — docs/manifests/db/schema.md.

Правило проекта: сначала правится манифест схемы, потом модель, потом миграция.
"""

from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class TimestampMixin:
    """Стандартные колонки времени: создание и обновление."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class ServiceCategory(Base, TimestampMixin):
    """Категория услуг: группа в каталоге и на главной."""

    __tablename__ = "service_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(160), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    short_description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    services: Mapped[list["Service"]] = relationship(back_populates="category")


class Service(Base, TimestampMixin):
    """Услуга с ценой «от», сроком и содержимым страницы."""

    __tablename__ = "services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    category_id: Mapped[int] = mapped_column(
        ForeignKey("service_categories.id"), index=True, nullable=False
    )
    slug: Mapped[str] = mapped_column(String(160), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    short_description: Mapped[str] = mapped_column(String(300), default="", nullable=False)
    body_md: Mapped[str] = mapped_column(Text, default="", nullable=False)

    price_from: Mapped[int | None] = mapped_column(Integer, nullable=True)
    price_currency: Mapped[str] = mapped_column(String(3), default="RUB", nullable=False)
    price_on_request: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    duration_text: Mapped[str] = mapped_column(String(64), default="", nullable=False)

    show_problems: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    examples: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    included: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    excluded: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    client_data: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    extra_costs: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    warranty_text: Mapped[str] = mapped_column(Text, default="", nullable=False)
    faq: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)

    status: Mapped[str] = mapped_column(String(16), default="draft", nullable=False, index=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    category: Mapped[ServiceCategory] = relationship(back_populates="services")


class SiteSetting(Base, TimestampMixin):
    """Настройки сайта: контакты, ID аналитики, версия политики."""

    __tablename__ = "site_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    key: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    value: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)


class SeoMetadata(Base, TimestampMixin):
    """SEO-поля страницы. Один путь — одна запись."""

    __tablename__ = "seo_metadata"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    entity_type: Mapped[str] = mapped_column(String(32), nullable=False)
    entity_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    path: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str] = mapped_column(String(320), nullable=False)
    h1: Mapped[str] = mapped_column(String(200), default="", nullable=False)
    keywords: Mapped[str] = mapped_column(Text, default="", nullable=False)
    canonical: Mapped[str | None] = mapped_column(String(255), nullable=True)
    robots_index: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    robots_follow: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    og_title: Mapped[str] = mapped_column(String(160), default="", nullable=False)
    og_description: Mapped[str] = mapped_column(String(320), default="", nullable=False)
    og_image: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    schema_json: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
