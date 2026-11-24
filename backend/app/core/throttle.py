"""Счётчик неверных попыток входа. Защита от перебора (ТЗ 9.4).

Манифест: docs/manifests/access-control.md, раздел «Защита от перебора паролей».

Почему в памяти процесса, а не в базе: это защита от флуда, а не учётная запись.
Лишняя запись в базу на каждую попытку входа — нагрузка без пользы. При перезапуске
контейнера счётчики обнуляются; это осознанно и записано в манифесте.
"""

import threading
import time
from collections import defaultdict

# Окно и пороги — из манифеста. Менять только вместе с ним.
WINDOW_SECONDS = 15 * 60
EMAIL_LIMIT = 10
IP_LIMIT = 30

# Попытки: ключ -> список моментов. Списки обрезаются окном при каждой проверке.
_attempts: dict[str, list[float]] = defaultdict(list)
_lock = threading.Lock()


def _key(kind: str, value: str) -> str:
    """Ключ счётчика: тип и значение разделены префиксом, чтобы не смешивать почту и IP."""
    return f"{kind}:{value.strip().lower()}"


def _recent(key: str, now: float) -> list[float]:
    """Моменты попыток внутри окна. Заодно чистит старое, чтобы память не росла."""
    cutoff = now - WINDOW_SECONDS
    fresh = [t for t in _attempts[key] if t > cutoff]
    if fresh:
        _attempts[key] = fresh
    else:
        _attempts.pop(key, None)
    return fresh


def is_blocked(email: str, ip: str | None) -> bool:
    """Превышен ли порог для этой почты или этого IP."""
    now = time.monotonic()
    with _lock:
        if len(_recent(_key("email", email), now)) >= EMAIL_LIMIT:
            return True
        if ip and len(_recent(_key("ip", ip), now)) >= IP_LIMIT:
            return True
    return False


def register_failure(email: str, ip: str | None) -> None:
    """Записывает неверную попытку по почте и по IP."""
    now = time.monotonic()
    with _lock:
        _attempts[_key("email", email)].append(now)
        if ip:
            _attempts[_key("ip", ip)].append(now)


def reset(email: str) -> None:
    """Успешный вход обнуляет счётчик почты: человек, вспомнивший пароль, не ждёт."""
    with _lock:
        _attempts.pop(_key("email", email), None)


def clear_all() -> None:
    """Полный сброс. Нужен только тестам, в рабочем коде не вызывается."""
    with _lock:
        _attempts.clear()
