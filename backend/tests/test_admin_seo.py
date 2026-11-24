"""Тесты SEO-панели. Манифест: docs/manifests/ui/seo-panel.md"""

from app.api.admin_seo import _is_forced_noindex, _normalize_path, _warnings


def test_path_normalized():
    """Путь приводится к одному виду: без ведущего/замыкающего слеша не плодим дубли."""
    assert _normalize_path("services") == "/services/"
    assert _normalize_path("/services") == "/services/"
    assert _normalize_path("/services/") == "/services/"
    assert _normalize_path("  /calculator/  ") == "/calculator/"


def test_closed_sections_are_noindex():
    """Кабинет, вход, админка и API закрыты по правилу — переключатель не спасает."""
    for path in ("/account/", "/login/", "/register/", "/admin/leads/", "/api/v1/x/"):
        assert _is_forced_noindex(path), path


def test_public_pages_are_indexable():
    """Обычные страницы не попадают под правило — их индексируют."""
    for path in ("/", "/services/", "/services/telegram-bots/", "/contacts/"):
        assert not _is_forced_noindex(path), path


def test_long_title_warns():
    """Слишком длинный Title обрежется в выдаче — предупреждаем."""
    warnings = _warnings("Заголовок " * 10, "д" * 120, "H1")
    assert any("Title" in w for w in warnings)


def test_short_description_warns():
    """Короткое описание выглядит пустым — предупреждаем."""
    warnings = _warnings("Хороший заголовок услуги ровно тут", "коротко", "H1")
    assert any("Description" in w for w in warnings)


def test_empty_h1_warns():
    """Без H1 страница теряет структуру."""
    warnings = _warnings("Нормальный заголовок приемлемой длины", "д" * 120, "   ")
    assert any("H1" in w for w in warnings)


def test_good_page_has_no_warnings():
    """Корректная страница не должна ругаться — иначе предупреждения станут шумом."""
    title = "Разработка Telegram-ботов для бизнеса"  # 39 символов
    description = "Создание ботов для приёма заявок и поддержки клиентов. Стоимость от 6 000 ₽." * 2
    warnings = _warnings(title, description[:160], "Разработка Telegram-ботов")
    assert warnings == []
