"""Создание учётной записи администратора из переменных окружения."""

import os
import sys

from sqlalchemy import select

from app.core.security import hash_password
from app.db.models import Role, User
from app.db.session import SessionLocal

ROLES = [
    ("admin", "Администратор"),
    ("manager", "Менеджер"),
    ("editor", "Редактор"),
    ("client", "Клиент"),
]


def ensure_roles(session) -> dict[str, Role]:
    """Создаёт справочник ролей, если его ещё нет."""
    result: dict[str, Role] = {}
    for code, title in ROLES:
        role = session.scalar(select(Role).where(Role.code == code))
        if role is None:
            role = Role(code=code, title=title)
            session.add(role)
            session.flush()
        result[code] = role
    return result


def main() -> int:
    """Создаёт администратора по ADMIN_EMAIL и ADMIN_PASSWORD."""
    email = (os.environ.get("ADMIN_EMAIL") or "").strip().lower()
    password = os.environ.get("ADMIN_PASSWORD") or ""
    if not email or len(password) < 12:
        print("Нужны ADMIN_EMAIL и ADMIN_PASSWORD (минимум 12 символов).")
        return 1

    with SessionLocal() as session:
        roles = ensure_roles(session)
        user = session.scalar(select(User).where(User.email == email))
        if user is None:
            user = User(
                email=email,
                password_hash=hash_password(password),
                display_name=os.environ.get("ADMIN_NAME", "Администратор"),
                status="active",
            )
            session.add(user)
            session.flush()
            print(f"Создан администратор: {email}")
        else:
            print(f"Пользователь уже есть: {email}")

        if not user.has_role("admin"):
            session.refresh(user)
            if roles["admin"] not in user.roles:
                user.roles.append(roles["admin"])
                print("Выдана роль admin")

        session.commit()
    return 0


if __name__ == "__main__":
    sys.exit(main())