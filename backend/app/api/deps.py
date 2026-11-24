"""Зависимости FastAPI: текущий пользователь и проверка прав."""

import hashlib
from datetime import UTC, datetime

from fastapi import Cookie, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session as DbSession

from app.db.models import Session, User
from app.db.session import get_session

SESSION_COOKIE = "alyaev_session"


def _client_ip(request: Request) -> str | None:
    """IP клиента с учётом прокси. Храним только усечённый, для журнала."""
    forwarded = request.headers.get("x-forwarded-for", "")
    raw = forwarded.split(",")[0].strip() or (request.client.host if request.client else "")
    return raw or None


def get_current_user(
    request: Request,
    session: DbSession = Depends(get_session),
    token: str | None = Cookie(default=None, alias=SESSION_COOKIE),
) -> User:
    """Возвращает пользователя по сессионной cookie или отвечает 401."""
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Требуется вход")

    token_hash = hashlib.sha256(token.encode()).hexdigest()
    row = session.scalar(select(Session).where(Session.token_hash == token_hash))
    if row is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Сессия не найдена")
    if row.revoked_at is not None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Сессия завершена")
    if row.expires_at <= datetime.now(UTC):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Сессия истекла")

    user = session.get(User, row.user_id)
    if user is None or user.status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ закрыт")
    return user


STAFF_ROLES = frozenset({"admin", "manager", "editor"})


def require_staff(user: User = Depends(get_current_user)) -> User:
    """Пускает в админку только персонал: админ, менеджер, редактор."""
    if not (set(role.code for role in user.roles) & STAFF_ROLES):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Недостаточно прав")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    """Пускает только администратора."""
    if not user.has_role("admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Только для администратора")
    return user