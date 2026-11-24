"""Хеширование паролей и токенов. argon2id для паролей, sha256 для сессионных токенов."""

import hashlib
import secrets

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError

# Параметры argon2id по рекомендациям OWASP: память 64 МБ, 3 итерации.
_hasher = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4)


def hash_password(password: str) -> str:
    """Возвращает хеш пароля argon2id. Пароль открытым текстом не хранится нигде."""
    return _hasher.hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    """Проверяет пароль по хешу, не раскрывая причину неверного входа."""
    try:
        return _hasher.verify(password_hash, password)
    except (VerifyMismatchError, InvalidHashError):
        return False


def needs_rehash(password_hash: str) -> bool:
    """Сообщает, что хеш устарел и его надо пересчитать при следующем входе."""
    try:
        return _hasher.check_needs_rehash(password_hash)
    except InvalidHashError:
        return True


def generate_session_token() -> str:
    """Создаёт случайный токен сессии для cookie."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """Хеш токена для хранения в БД: утечка базы не даёт войти."""
    return hashlib.sha256(token.encode()).hexdigest()