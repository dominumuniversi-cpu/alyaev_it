"""Тесты матрицы прав. Манифест: docs/manifests/access-control.md

Проверяется не «работает ли запрос», а «не пускает ли лишнего»:
права нужны именно для отказа."""

from types import SimpleNamespace

from app.core.permissions import (
    ROLE_PERMISSIONS,
    Permission,
    permissions_for,
    user_has_permission,
)


def _user(*codes: str):
    """Пользователь с набором ролей — без базы, проверяем только логику прав."""
    return SimpleNamespace(roles=[SimpleNamespace(code=c) for c in codes])


def test_admin_has_everything():
    """Администратор не должен упираться в отказ ни в одной области."""
    admin = _user("admin")
    for permission in Permission.USERS_MANAGE, Permission.SERVICES_WRITE, Permission.LEADS_WRITE:
        assert user_has_permission(admin, permission)


def test_manager_cannot_change_prices():
    """Менеджер продаёт, но не правит прайс — иначе цена уедет в переписке с клиентом."""
    manager = _user("manager")
    assert user_has_permission(manager, Permission.LEADS_WRITE)
    assert not user_has_permission(manager, Permission.SERVICES_WRITE)
    assert not user_has_permission(manager, Permission.USERS_MANAGE)


def test_editor_cannot_touch_leads():
    """Редактор пишет тексты и не видит персональные данные клиентов."""
    editor = _user("editor")
    assert user_has_permission(editor, Permission.CONTENT_WRITE)
    assert not user_has_permission(editor, Permission.LEADS_READ)
    assert not user_has_permission(editor, Permission.LEADS_WRITE)


def test_client_cannot_see_foreign_projects():
    """Клиенту доступны только свои проекты — и никакой админки."""
    client = _user("client")
    assert user_has_permission(client, Permission.PROJECTS_OWN)
    assert not user_has_permission(client, Permission.PROJECTS_ALL)
    assert not user_has_permission(client, Permission.LEADS_READ)
    assert not user_has_permission(client, Permission.SERVICES_WRITE)


def test_roles_combine():
    """Несколько ролей складываются: редактор с ролью менеджера видит и заявки."""
    both = _user("editor", "manager")
    assert user_has_permission(both, Permission.CONTENT_WRITE)
    assert user_has_permission(both, Permission.LEADS_READ)


def test_unknown_role_grants_nothing():
    """Незнакомая роль не даёт ни одного права — нет доступа по умолчанию."""
    stranger = _user("unknown_role")
    assert permissions_for(stranger) == frozenset()


def test_no_role_grants_nothing():
    """Пользователь без ролей не получает ничего."""
    assert permissions_for(_user()) == frozenset()


def test_every_permission_used_by_someone():
    """Право, которое никому не выдано, — мёртвый код: эндпоинт с ним закрыт навсегда."""
    granted: set[str] = set()
    for codes in ROLE_PERMISSIONS.values():
        granted.update(codes)
    declared = {v for k, v in vars(Permission).items() if not k.startswith("_")}
    assert declared == granted, f"не выданы: {declared - granted}, лишние: {granted - declared}"