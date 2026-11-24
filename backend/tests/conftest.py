"""Общие фикстуры тестов."""

import os

# Тесты не должны ходить в прод-БД: подменяем строку подключения на заглушку.
os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://test:test@127.0.0.1:1/test")