"""Тесты журнала действий: маршруты и разметка."""

from app.api.admin_audit import ACTION_LABELS


def test_audit_route_registered():
    """Маршрут чтения журнала действительно подключён к приложению."""
    from app.main import app

    paths = {route.path for route in app.routes}
    assert "/api/v1/admin/audit" in paths


def test_audit_requires_auth():
    """Журнал не открыт анонимно: без прав — отказ."""
    from app.main import app

    for route in app.routes:
        if route.path == "/api/v1/admin/audit":
            assert len(route.dependant.dependencies) > 0


def test_audit_not_in_public_routers():
    """Журнал не попадает в публичное API даже случайно."""
    from app.main import app

    for route in app.routes:
        path = getattr(route, "path", "")
        if "audit" in path:
            assert path.startswith("/api/v1/admin/"), path


def test_every_logged_action_has_label():
    """У каждого действия в коде есть человеческая подпись для админки."""
    import re
    from pathlib import Path

    api_dir = Path(__file__).resolve().parent.parent / "app" / "api"
    actions: set[str] = set()
    for file in api_dir.glob("admin_*.py"):
        text = file.read_text(encoding="utf-8")
        actions.update(re.findall(r'action="([a-z_]+\.[a-z_]+)"', text))
    missing = actions - set(ACTION_LABELS)
    assert not missing, f"нет подписи для действий: {sorted(missing)}"


def test_sensitive_actions_are_logged():
    """Все изменяющие админские маршруты пишут в журнал — иначе их не отследить."""
    import re
    from pathlib import Path

    api_dir = Path(__file__).resolve().parent.parent / "app" / "api"
    gaps = []
    for file in api_dir.glob("admin_*.py"):
        text = file.read_text(encoding="utf-8")
        routes = len(re.findall(r"@router\.(post|patch|put|delete)\(", text))
        logged = len(re.findall(r"audit\.record\(", text))
        if routes > logged:
            gaps.append(f"{file.name}: маршрутов {routes}, записей {logged}")
    assert not gaps, "не все изменения логируются: " + "; ".join(gaps)
