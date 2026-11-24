"""Вход и выход. Сессия в БД, cookie HttpOnly."""

import hashlib
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import select, update
from sqlalchemy.orm import Session as DbSession

from app.api.deps import SESSION_COOKIE, _client_ip, get_current_user
from app.core import throttle
from app.core.security import generate_session_token, hash_password, hash_token, needs_rehash, verify_password
from app.db.models import Session, User
from app.db.session import get_session

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

SESSION_HOURS = 12


class LoginPayload(BaseModel):
    """Данные входа."""

    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=200)


@router.post("/login")
def login(
    payload: LoginPayload,
    request: Request,
    response: Response,
    session: DbSession = Depends(get_session),
) -> dict[str, str]:
    """Проверяет пароль и выставляет cookie сессии."""
    email = payload.email.strip().lower()
    client_ip = _client_ip(request)

    # Перебор дорог: после порога отвечаем 429 и пароль не проверяем вообще.
    # Ответ нейтрален — существование почты не подтверждаем (манифест access-control.md).
    if throttle.is_blocked(email, client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Слишком много неверных попыток. Попробуйте через 15 минут.",
        )

    user = session.scalar(select(User).where(User.email == email))

    # Одинаковый ответ на неверную почту и неверный пароль: не подсказываем, что есть.
    if user is None or not verify_password(user.password_hash, payload.password):
        throttle.register_failure(email, client_ip)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверная почта или пароль")
    if user.status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Учётная запись заблокирована")

    if needs_rehash(user.password_hash):
        user.password_hash = hash_password(payload.password)

    token = generate_session_token()
    session.add(
        Session(
            user_id=user.id,
            token_hash=hash_token(token),
            user_agent=(request.headers.get("user-agent") or "")[:400] or None,
            ip=_client_ip(request),
            expires_at=datetime.now(UTC) + timedelta(hours=SESSION_HOURS),
        )
    )
    user.last_login_at = datetime.now(UTC)
    session.commit()
    # Успешный вход стирает счётчик почты: вспомнивший пароль не ждёт (манифест).
    throttle.reset(email)

    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=SESSION_HOURS * 3600,
        httponly=True,
        samesite="lax",
        secure=True,
        path="/",
    )
    return {"status": "ok"}


@router.post("/logout")
def logout(
    response: Response,
    request: Request,
    session: DbSession = Depends(get_session),
) -> dict[str, str]:
    """Завершает текущую сессию и стирает cookie."""
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        row = session.scalar(select(Session).where(Session.token_hash == hash_token(token)))
        if row is not None:
            row.revoked_at = datetime.now(UTC)
            session.commit()
    response.delete_cookie(SESSION_COOKIE, path="/")
    return {"status": "ok"}


@router.post("/logout-all")
def logout_all(
    response: Response,
    session: DbSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> dict[str, int]:
    """Завершает ВСЕ сессии пользователя (ТЗ 9.4, «выход со всех устройств»).

    Нужен, когда пароль мог утечь: смена пароля бесполезна, пока живы старые
    cookie. Здесь одним действием гасим все токены, включая текущий.
    """
    now = datetime.now(UTC)
    result = session.execute(
        update(Session)
        .where(Session.user_id == user.id, Session.revoked_at.is_(None))
        .values(revoked_at=now)
    )
    session.commit()
    response.delete_cookie(SESSION_COOKIE, path="/")
    return {"revoked": result.rowcount or 0}


@router.get("/sessions")
def list_sessions(
    request: Request,
    session: DbSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> dict:
    """Активные устройства (ТЗ 9.4). Токен не отдаём никогда — только метаданные."""
    current = request.cookies.get(SESSION_COOKIE)
    current_hash = hash_token(current) if current else None
    now = datetime.now(UTC)
    rows = session.scalars(
        select(Session)
        .where(
            Session.user_id == user.id,
            Session.revoked_at.is_(None),
            Session.expires_at > now,
        )
        .order_by(Session.created_at.desc())
    ).all()
    return {
        "items": [
            {
                "id": r.id,
                # Помечаем текущую сессию: клиенту нужно знать, какую он НЕ разлогинит.
                "current": r.token_hash == current_hash,
                "user_agent": r.user_agent or "",
                "created_at": r.created_at.isoformat(),
                "expires_at": r.expires_at.isoformat(),
            }
            for r in rows
        ],
        "count": len(rows),
    }

@router.get("/me")
def me(user: User = Depends(get_current_user)) -> dict:
    """Возвращает текущего пользователя и его роли."""
    return {
        "email": user.email,
        "display_name": user.display_name,
        "roles": [role.code for role in user.roles],
    }