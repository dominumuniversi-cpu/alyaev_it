"""Защита входа от перебора. Манифест: docs/manifests/access-control.md (ТЗ 9.4)."""

import pytest

from app.core import throttle


@pytest.fixture(autouse=True)
def _clean():
    """Каждый тест начинает с пустых счётчиков, иначе тесты влияют друг на друга."""
    throttle.clear_all()
    yield
    throttle.clear_all()


def test_not_blocked_before_limit():
    """Ниже порога вход не блокируется."""
    for _ in range(throttle.EMAIL_LIMIT - 1):
        throttle.register_failure("a@b.c", "10.0.0.1")
    assert throttle.is_blocked("a@b.c", "10.0.0.1") is False


def test_blocked_at_limit():
    """Ровно на пороге почта блокируется."""
    for _ in range(throttle.EMAIL_LIMIT):
        throttle.register_failure("a@b.c", None)
    assert throttle.is_blocked("a@b.c", None) is True


def test_email_is_case_insensitive():
    """Почта сравнивается без учёта регистра: смена регистра не обходит защиту."""
    for _ in range(throttle.EMAIL_LIMIT):
        throttle.register_failure("A@B.C", None)
    assert throttle.is_blocked("a@b.c", None) is True


def test_success_resets_counter():
    """Успешный вход обнуляет счётчик почты: вспомнивший пароль не ждёт."""
    for _ in range(throttle.EMAIL_LIMIT - 1):
        throttle.register_failure("a@b.c", None)
    throttle.reset("a@b.c")
    for _ in range(throttle.EMAIL_LIMIT - 1):
        throttle.register_failure("a@b.c", None)
    assert throttle.is_blocked("a@b.c", None) is False


def test_other_email_not_blocked():
    """Блокировка одной почты не мешает другим."""
    for _ in range(throttle.EMAIL_LIMIT):
        throttle.register_failure("a@b.c", "10.0.0.1")
    assert throttle.is_blocked("other@b.c", "10.0.0.2") is False


def test_ip_limit_is_higher_than_email():
    """Порог по IP выше: за одним адресом сидят живые люди."""
    assert throttle.IP_LIMIT > throttle.EMAIL_LIMIT


def test_ip_blocks_many_emails():
    """Перебор разных почт с одного адреса упирается в порог IP, когда он достигнут."""
    # До порога IP каждый адрес почты блокируется раньше, поэтому шлём по одной попытке
    # на разные почты: счётчик почты не растёт, а счётчик IP — растёт.
    for i in range(throttle.IP_LIMIT):
        throttle.register_failure(f"user{i}@example.com", "10.0.0.9")
    assert throttle.is_blocked("fresh@example.com", "10.0.0.9") is True
