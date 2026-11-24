"""Модели БД. Источник истины — docs/manifests/db/schema.md.

Правило проекта: сначала правится манифест схемы, потом модель, потом миграция.
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Table,
    UniqueConstraint,
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

class Lead(Base, TimestampMixin):
    """Заявка с сайта. Манифест: docs/manifests/db/schema.md, раздел 2."""

    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    public_id: Mapped[str] = mapped_column(
        String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    contact_type: Mapped[str] = mapped_column(String(16), nullable=False)
    contact_value: Mapped[str] = mapped_column(String(160), nullable=False)
    task_type: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    company_site: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_page: Mapped[str | None] = mapped_column(String(255), nullable=True)
    utm_json: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    status: Mapped[str] = mapped_column(String(24), default="new", nullable=False, index=True)
    consent_version: Mapped[str] = mapped_column(String(16), nullable=False)
    consent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ip_hash: Mapped[str | None] = mapped_column(Text, nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

class User(Base, TimestampMixin):
    """Пользователь системы. Манифест: docs/manifests/db/schema.md, раздел 1."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    status: Mapped[str] = mapped_column(String(16), default="active", nullable=False)
    email_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    roles: Mapped[list["Role"]] = relationship(
        secondary="user_roles", back_populates="users", lazy="selectin"
    )

    def has_role(self, code: str) -> bool:
        """Проверяет наличие роли у пользователя."""
        return any(role.code == code for role in self.roles)


class Role(Base):
    """Роль пользователя: admin, manager, editor, client."""

    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(120), nullable=False)

    users: Mapped[list[User]] = relationship(
        secondary="user_roles", back_populates="roles", lazy="selectin"
    )


user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)


class Session(Base):
    """Серверная сессия. Хранится только хеш токена, не сам токен."""

    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip: Mapped[str | None] = mapped_column(String(64), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class LeadEvent(Base):
    """История изменений заявки: смена статуса, заметки."""

    __tablename__ = "lead_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lead_id: Mapped[int] = mapped_column(ForeignKey("leads.id", ondelete="CASCADE"), index=True)
    event: Mapped[str] = mapped_column(String(32), nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    actor_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class AuditLog(Base):
    """Журнал действий: кто, что и когда изменил. Манифест схемы, п. 12.4."""

    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    actor_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    entity: Mapped[str] = mapped_column(String(32), nullable=False)
    entity_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    payload: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

class Review(Base, TimestampMixin):
    """Отзыв клиента. Публикуется только при наличии согласия автора. Манифест схемы, п. 12."""

    __tablename__ = "reviews"
    # Публичная выборка фильтрует по этим трём полям — индекс держим в модели,
    # иначе autogenerate считает его лишним и предлагает удалить.
    __table_args__ = (Index("ix_reviews_public", "status", "consent_given", "deleted_at"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    public_id: Mapped[str] = mapped_column(String(36), default=lambda: str(uuid.uuid4()), unique=True, nullable=False)
    author_name: Mapped[str] = mapped_column(String(120), nullable=False)
    author_position: Mapped[str | None] = mapped_column(String(120), nullable=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    project_title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    consent_given: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    consent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    consent_version: Mapped[str | None] = mapped_column(String(16), nullable=True)
    status: Mapped[str] = mapped_column(String(16), default="draft", nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    @property
    def is_public(self) -> bool:
        """Отзыв виден на сайте только при согласии автора и статусе published."""
        return self.status == "published" and self.consent_given and self.deleted_at is None

class CalculatorOption(Base, TimestampMixin):
    """Дополнительная опция калькулятора. Цена настраивается, не зашита в код. Манифест схемы, п. 13."""

    __tablename__ = "calculator_options"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    price_delta: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true", nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)


class CalculatorComplexity(Base, TimestampMixin):
    """Коэффициент сложности. Ниже 1.0 опускаться нельзя: калькулятор не даёт цену ниже базовой."""

    __tablename__ = "calculator_complexity"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(60), nullable=False)
    factor: Mapped[float] = mapped_column(Numeric(4, 2), default=1, server_default="1.00", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true", nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)


class Portfolio(Base, TimestampMixin):
    """Кейс портфолио. Манифест: docs/manifests/ui/portfolio-articles.md."""

    __tablename__ = "portfolio"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(160), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    summary: Mapped[str] = mapped_column(String(320), nullable=False)
    problem_md: Mapped[str] = mapped_column(Text, default="", nullable=False)
    solution_md: Mapped[str] = mapped_column(Text, default="", nullable=False)
    technologies: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    # demo / own / commercial — статус обязателен: выдуманное внедрение недопустимо.
    status: Mapped[str] = mapped_column(
        String(16), default="demo", server_default="demo", nullable=False
    )
    published: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false", nullable=False
    )
    sort_order: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0", nullable=False
    )
    # Soft-delete: удалённое физически не вернуть, а ошибку надо уметь отменить.
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Article(Base, TimestampMixin):
    """Статья блога. Манифест: docs/manifests/ui/portfolio-articles.md."""

    __tablename__ = "articles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(160), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    excerpt: Mapped[str] = mapped_column(String(320), default="", nullable=False)
    body_md: Mapped[str] = mapped_column(Text, default="", nullable=False)
    # draft / published / archived
    status: Mapped[str] = mapped_column(
        String(16), default="draft", server_default="draft", nullable=False
    )
    # Ставится один раз при первой публикации и больше не меняется.
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sort_order: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0", nullable=False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class UploadedFile(Base, TimestampMixin):
    """Загруженный файл. Манифест: docs/manifests/uploads.md."""

    __tablename__ = "uploaded_files"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # Имя на диске генерируем сами: имя из запроса — это path traversal.
    stored_name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False, index=True)
    # Исходное имя только для показа человеку, никогда не используется как путь.
    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    kind: Mapped[str] = mapped_column(
        String(16), default="document", server_default="document", nullable=False
    )
    checksum: Mapped[str] = mapped_column(String(64), nullable=False)
    uploaded_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    # Soft-delete: файл с диска не стираем сразу — его могут ещё запрашивать.
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class SemanticQuery(Base, TimestampMixin):
    """Поисковый запрос семантического ядра (ТЗ 11.4).

    Одна страница закрывает группу запросов: target_path — обязательный, иначе запрос
    ни к чему не привязан и работать с ним нельзя.
    """

    __tablename__ = "semantic_queries"
    __table_args__ = (
        UniqueConstraint("query", "region", name="uq_semantic_query_region"),
        Index("ix_semantic_queries_group", "group_slug"),
        Index("ix_semantic_queries_target", "target_path"),
        Index("ix_semantic_queries_priority", "priority"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    query: Mapped[str] = mapped_column(String(200), nullable=False)
    group_slug: Mapped[str] = mapped_column(String(32), nullable=False)
    # NULL — «не измеряли», а не «ноль». Разница важна при сортировке и в отчётах.
    frequency: Mapped[int | None] = mapped_column(Integer, nullable=True)
    frequency_source: Mapped[str | None] = mapped_column(String(32), nullable=True)
    difficulty: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    region: Mapped[str] = mapped_column(
        String(32), default="ru", server_default="ru", nullable=False
    )
    target_path: Mapped[str] = mapped_column(String(255), nullable=False)
    priority: Mapped[str] = mapped_column(
        String(16), default="medium", server_default="medium", nullable=False
    )
    position: Mapped[int | None] = mapped_column(Integer, nullable=True)
    position_checked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    cluster: Mapped[str | None] = mapped_column(String(64), nullable=True)
    notes: Mapped[str] = mapped_column(Text, default="", server_default="", nullable=False)

class Solution(Base, TimestampMixin):
    """Готовое решение из библиотеки (ТЗ 7.4).

    Отличие от услуги: услуга — работа под заказ, решение — готовый модуль.
    Стартовая цена означает «внедрение от», внешние расходы в неё не входят.
    """

    __tablename__ = "solutions"
    __table_args__ = (
        Index("ix_solutions_kind", "kind"),
        Index("ix_solutions_status", "status"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(160), nullable=False, unique=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    summary: Mapped[str] = mapped_column(String(320), nullable=False)
    kind: Mapped[str] = mapped_column(String(32), nullable=False)
    description_md: Mapped[str] = mapped_column(
        Text, default="", server_default="", nullable=False
    )
    included: Mapped[list] = mapped_column(JSONB, default=list, server_default="[]", nullable=False)
    requirements_md: Mapped[str] = mapped_column(
        Text, default="", server_default="", nullable=False
    )
    technologies: Mapped[list] = mapped_column(
        JSONB, default=list, server_default="[]", nullable=False
    )
    # NULL при price_on_request — «по запросу» и «бесплатно» это разные вещи.
    price_from: Mapped[int | None] = mapped_column(Integer, nullable=True)
    price_on_request: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false", nullable=False
    )
    # Демо только реальное: NULL честнее нерабочей ссылки.
    demo_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Услуга, по которой внедряется модуль: даёт перелинковку с /services/<slug>/.
    # Слаги услуг не переименовываются, поэтому храним слагом, а не внешним ключом.
    service_slug: Mapped[str | None] = mapped_column(String(160), nullable=True)
    status: Mapped[str] = mapped_column(
        String(16), default="draft", server_default="draft", nullable=False
    )
    sort_order: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0", nullable=False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ArticleService(Base):
    """Связь статьи с услугой (ТЗ 11.10 перелинковка).

    Отдельная таблица, а не JSON-поле: пара должна быть уникальной и умирать
    вместе с любой из сторон.
    """

    __tablename__ = "article_services"

    article_id: Mapped[int] = mapped_column(
        ForeignKey("articles.id", ondelete="CASCADE"), primary_key=True
    )
    service_id: Mapped[int] = mapped_column(
        ForeignKey("services.id", ondelete="CASCADE"), primary_key=True
    )


class ArticleArticle(Base):
    """Связь статьи со статьёй (ТЗ 11.10 перелинковка, блок «Читайте также»).

    Направленная: source_id — статья, где показывается блок, target_id — куда ведём.
    Взаимность заводится двумя строками осознанно, а не автоматически.
    """

    __tablename__ = "article_articles"
    __table_args__ = (CheckConstraint("source_id <> target_id", name="ck_article_articles_self"),)

    source_id: Mapped[int] = mapped_column(
        ForeignKey("articles.id", ondelete="CASCADE"), primary_key=True
    )
    target_id: Mapped[int] = mapped_column(
        ForeignKey("articles.id", ondelete="CASCADE"), primary_key=True
    )


class Client(Base, TimestampMixin):
    """Клиент личного кабинета (ТЗ 9.1).

    Связь с users необязательна: карточку заводят по заявке раньше, чем у клиента
    появится учётная запись. NULL в user_id — «клиент есть, входа ещё нет».
    """

    __tablename__ = "clients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True
    )
    display_name: Mapped[str] = mapped_column(String(200), nullable=False)
    company: Mapped[str] = mapped_column(String(200), default="", server_default="", nullable=False)
    # Контакты в свободной форме: телефон, telegram, почта — у разных клиентов разный набор.
    contact_json: Mapped[dict] = mapped_column(
        JSONB, default=dict, server_default="{}", nullable=False
    )

    projects: Mapped[list["Project"]] = relationship(back_populates="client")


class Project(Base, TimestampMixin):
    """Проект клиента: работа с этапами и ценой (ТЗ 9.1, статусы по ТЗ 9.3).

    Статус меняется только через сервис смены статуса: он же пишет запись в
    project_status_history. Прямая правка колонки оставит историю без события.
    """

    __tablename__ = "projects"
    __table_args__ = (
        CheckConstraint(
            "status IN ('new', 'analysis', 'dev', 'testing', 'done')",
            name="ck_projects_status",
        ),
        CheckConstraint("price_rub IS NULL OR price_rub >= 0", name="ck_projects_price"),
        Index("ix_projects_status", "status"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", server_default="", nullable=False)
    status: Mapped[str] = mapped_column(
        String(24), default="new", server_default="new", nullable=False
    )
    # Цена проекта может быть не согласована — тогда NULL, а не ноль.
    price_rub: Mapped[int | None] = mapped_column(Integer, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    client: Mapped["Client"] = relationship(back_populates="projects")
    tasks: Mapped[list["ProjectTask"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    history: Mapped[list["ProjectStatusHistory"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )


class ProjectTask(Base, TimestampMixin):
    """Задача внутри проекта (ТЗ 9.1, «Задачи»).

    Статус задачи не равен статусу проекта: проект может быть в разработке,
    а конкретная задача уже закрыта.
    """

    __tablename__ = "project_tasks"
    __table_args__ = (
        CheckConstraint(
            "status IN ('todo', 'in_progress', 'done')",
            name="ck_project_tasks_status",
        ),
        Index("ix_project_tasks_project", "project_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", server_default="", nullable=False)
    status: Mapped[str] = mapped_column(
        String(16), default="todo", server_default="todo", nullable=False
    )
    due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    project: Mapped["Project"] = relationship(back_populates="tasks")


class ProjectStatusHistory(Base):
    """История смены статуса проекта (ТЗ 9.1, «История»).

    Пишется только сервисом смены статуса, вручную не редактируется.
    status_from = NULL означает первый статус при создании проекта.
    """

    __tablename__ = "project_status_history"
    __table_args__ = (Index("ix_project_status_history_project", "project_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    status_from: Mapped[str | None] = mapped_column(String(24), nullable=True)
    status_to: Mapped[str] = mapped_column(String(24), nullable=False)
    comment: Mapped[str] = mapped_column(Text, default="", server_default="", nullable=False)
    actor_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    project: Mapped["Project"] = relationship(back_populates="history")

