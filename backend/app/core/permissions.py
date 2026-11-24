"""Права доступа: одна матрица для всего приложения. Манифест: docs/manifests/access-control.md

Правило «нет доступа по умолчанию»: право выдаётся явно. Забыть защитить эндпоинт
нельзя — забыть разрешить можно, и это видно сразу."""

from fastapi import Depends, HTTPException, status

from app.api.deps import get_current_user
from app.db.models import User


class Permission:
    """Коды прав. Имя = область + действие, чтобы читалось без словаря."""

    LEADS_READ = "leads:read"
    LEADS_WRITE = "leads:write"
    SERVICES_READ = "services:read"
    SERVICES_WRITE = "services:write"
    CONTENT_READ = "content:read"
    CONTENT_WRITE = "content:write"
    REVIEWS_MODERATE = "reviews:moderate"
    CALCULATOR_WRITE = "calculator:write"
    USERS_MANAGE = "users:manage"
    AUDIT_READ = "audit:read"
    PROJECTS_OWN = "projects:own"
    PROJECTS_ALL = "projects:all"


# Матрица: роль → набор прав. Здесь видно всё разом, не надо искать по файлам.
ROLE_PERMISSIONS: dict[str, frozenset[str]] = {
    "admin": frozenset({
        Permission.LEADS_READ,
        Permission.LEADS_WRITE,
        Permission.SERVICES_READ,
        Permission.SERVICES_WRITE,
        Permission.CONTENT_READ,
        Permission.CONTENT_WRITE,
        Permission.REVIEWS_MODERATE,
        Permission.CALCULATOR_WRITE,
        Permission.USERS_MANAGE,
        Permission.AUDIT_READ,
        Permission.PROJECTS_OWN,
        Permission.PROJECTS_ALL,
    }),
    "manager": frozenset({
        Permission.LEADS_READ,
        Permission.LEADS_WRITE,
        Permission.SERVICES_READ,
        Permission.CONTENT_READ,
        Permission.AUDIT_READ,
        Permission.PROJECTS_OWN,
        Permission.PROJECTS_ALL,
    }),
    "editor": frozenset({
        Permission.SERVICES_READ,
        Permission.SERVICES_WRITE,
        Permission.CONTENT_READ,
        Permission.CONTENT_WRITE,
        Permission.REVIEWS_MODERATE,
        Permission.CALCULATOR_WRITE,
    }),
    "client": frozenset({Permission.PROJECTS_OWN}),
}


def permissions_for(user: User) -> frozenset[str]:
    """Собирает права пользователя из всех его ролей."""
    result: set[str] = set()
    for role in user.roles:
        result.update(ROLE_PERMISSIONS.get(role.code, frozenset()))
    return frozenset(result)


def user_has_permission(user: User, permission: str) -> bool:
    """Есть ли у пользователя конкретное право."""
    return permission in permissions_for(user)


def require_permission(permission: str):
    """Зависимость FastAPI: пускает только с правом, иначе 403."""

    def dependency(user: User = Depends(get_current_user)) -> User:
        if not user_has_permission(user, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав для этого действия",
            )
        return user

    return dependency
