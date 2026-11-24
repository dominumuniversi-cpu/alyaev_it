"""Вход и выход. Сессия в БД, cookie HttpOnly."""

import hashlib
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session as DbSession

from app.api.deps import SESSION_COOKIE, _client_ip, get_current_user
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
    user = session.scalar(select(User).where(User.email == email))

    # Одинаковый ответ на неверную почту и неверный пароль: не подсказываем, что есть.
    if user is None or not verify_password(user.password_hash, payload.password):
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


@router.get("/me")
def me(user: User = Depends(get_current_user)) -> dict:
    """Возвращает текущего пользователя и его роли."""
    return {
        "email": user.email,
        "display_name": user.display_name,
        "roles": [role.code for role in user.roles],
    }