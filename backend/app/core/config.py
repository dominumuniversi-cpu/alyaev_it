"""Настройки приложения: читаются из окружения, секреты не хранятся в коде."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Конфигурация сервиса. Значения приходят из env (docker-compose / .env)."""

    app_name: str = "alyaev.it API"
    environment: str = "local"
    database_url: str = "postgresql+psycopg://alyaev:alyaev@db:5432/alyaev"

    class Config:
        env_prefix = ""
        env_file = ".env"
        extra = "ignore"


settings = Settings()
