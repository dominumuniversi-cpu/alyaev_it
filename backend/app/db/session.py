"""Подключение к PostgreSQL: движок приложения и фабрика сессий."""

from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    """Базовый класс моделей SQLAlchemy."""


def get_session() -> Iterator[Session]:
    """Отдаёт сессию БД и гарантированно закрывает её после запроса."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
