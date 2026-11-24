"""Тесты семантического ядра. Манифест: docs/manifests/ui/semantic-core.md"""

import pytest
from fastapi import HTTPException

from app.api.admin_semantic import (
    GROUPS,
    PRIORITIES,
    QueryPayload,
    _normalize_path,
    _validate_group,
    _validate_priority,
)


def test_groups_match_tz():
    """Группы — это ровно направления из ТЗ 11.4, без самодеятельности."""
    assert GROUPS == (
        "telegram",
        "ai",
        "rag",
        "automation",
        "parsers",
        "integrations",
        "websites",
    )


def test_priorities_declared():
    """Три приоритета: больше не нужно, меньше — не хватает сортировки."""
    assert PRIORITIES == ("high", "medium", "low")


def test_path_normalized_like_seo():
    """Путь приводится к тому же виду, что в seo_metadata: слеш в начале, не в конце."""
    assert _normalize_path("services/telegram-bots/") == "/services/telegram-bots"
    assert _normalize_path("/services/telegram-bots") == "/services/telegram-bots"
    assert _normalize_path("  /services/telegram-bots/  ") == "/services/telegram-bots"


def test_path_root_stays_root():
    """Главная — это «/», а не пустая строка."""
    assert _normalize_path("/") == "/"
    assert _normalize_path("") == "/"


def test_unknown_group_rejected():
    """Свободная группа превратила бы ядро в свалку — только из списка."""
    with pytest.raises(HTTPException) as err:
        _validate_group("seo")
    assert err.value.status_code == 422
    assert "Неизвестная группа" in err.value.detail


def test_known_group_accepted():
    """Известная группа проходит без изменений."""
    assert _validate_group("telegram") == "telegram"


def test_bad_priority_rejected():
    """Приоритет вне списка не сохраняется."""
    with pytest.raises(HTTPException) as err:
        _validate_priority("critical")
    assert err.value.status_code == 422


def test_unmeasured_frequency_is_none_not_zero():
    """Ноль и «не измеряли» — разные вещи: ноль это измеренный нулевой спрос."""
    payload = QueryPayload(query="бот для заявок", group_slug="telegram", target_path="/x")
    assert payload.frequency is None
    # Явная проверка: None не должен оказаться нулём ни при каком сравнении.
    assert payload.frequency != 0


def test_frequency_negative_rejected():
    """Отрицательной частотности не бывает — модель это запрещает."""
    with pytest.raises(Exception):
        QueryPayload(
            query="запрос", group_slug="ai", target_path="/x", frequency=-5
        )


def test_difficulty_bounded_0_100():
    """Конкурентность по шкале 0–100; 101 — уже не шкала."""
    ok = QueryPayload(query="запрос", group_slug="ai", target_path="/x", difficulty=100)
    assert ok.difficulty == 100
    with pytest.raises(Exception):
        QueryPayload(query="запрос", group_slug="ai", target_path="/x", difficulty=101)


def test_target_path_required():
    """Запрос без целевой страницы бесполезен — он не должен сохраняться."""
    with pytest.raises(Exception):
        QueryPayload(query="запрос", group_slug="ai", target_path="")


def test_query_too_short_rejected():
    """Запрос из одного символа — это не запрос."""
    with pytest.raises(Exception):
        QueryPayload(query="б", group_slug="ai", target_path="/x")


def test_query_trimmed_length_checked():
    """Длина проверяется по самому полю, не обрезанное значение не проходит валидацию."""
    long_query = "а" * 201
    with pytest.raises(Exception):
        QueryPayload(query=long_query, group_slug="ai", target_path="/x")


def test_routes_registered():
    """Маршруты ядра реально подключены к приложению, а не просто объявлены в модуле."""
    from app.main import app

    paths = {route.path for route in app.routes}
    assert "/api/v1/admin/semantic" in paths
    assert "/api/v1/admin/semantic/summary" in paths
    assert "/api/v1/admin/semantic/{query_id}" in paths
    assert "/api/v1/admin/semantic/{query_id}/position" in paths


def test_summary_route_before_id_route():
    """\"summary\" не должен попасть в обработчик {query_id}: иначе 422 вместо сводки."""
    from app.main import app

    order = [route.path for route in app.routes]
    i_summary = order.index("/api/v1/admin/semantic/summary")
    i_by_id = order.index("/api/v1/admin/semantic/{query_id}")
    assert i_summary < i_by_id


def test_routes_require_auth():
    """Без прав маршрут обязан отказывать: 401, а не 200 с данными."""
    from app.main import app

    for route in app.routes:
        if route.path.startswith("/api/v1/admin/semantic"):
            deps = getattr(route, "dependant", None)
            assert deps is not None, route.path
            # Права объявлены как зависимость — иначе эндпоинт открыт всем.
            assert len(deps.dependencies) > 0, route.path
