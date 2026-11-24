"""Настройки приложения: читаются из окружения, секреты не хранятся в коде."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Конфигурация сервиса. Значения приходят из env (docker-compose / .env)."""

    app_name: str = "alyaev.it API"
    environment: str = "local"
    database_url: str = "postgresql+psycopg://alyaev:alyaev@db:5432/alyaev"

    # Уведомления о заявках (docs/manifests/telegram-notifications.md).
    # Пустые значения = уведомления выключены, сайт работает как обычно.
    telegram_bot_token: str = ""
    telegram_chat_id: str = ""

    class Config:
        env_prefix = ""
        env_file = ".env"
        extra = "ignore"


settings = Settings()
