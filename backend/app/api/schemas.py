"""Схемы входных данных API с валидацией."""

from pydantic import BaseModel, Field, field_validator


class LeadCreate(BaseModel):
    """Заявка с публичной формы. Поля и ограничения — по манифесту UI (field.md)."""

    name: str = Field(min_length=2, max_length=100)
    contact: str = Field(min_length=3, max_length=64)
    task_type: str | None = Field(default=None, max_length=64)
    message: str = Field(min_length=20, max_length=5000)
    company_site: str | None = Field(default=None, max_length=255)
    source_page: str | None = Field(default=None, max_length=255)
    utm: dict[str, str] = Field(default_factory=dict)
    consent_version: str = Field(max_length=16)
    # Honeypot: скрытое поле. У человека всегда пусто, боты заполняют.
    website_check: str | None = Field(default=None, max_length=100)

    @field_validator("company_site")
    @classmethod
    def check_site(cls, value: str | None) -> str | None:
        """Разрешает пустое значение или http(s)-ссылку."""
        if not value:
            return None
        if not value.startswith(("http://", "https://")):
            raise ValueError("Ссылка должна начинаться с http:// или https://")
        return value

    @field_validator("name", "message")
    @classmethod
    def strip_text(cls, value: str) -> str:
        """Убирает лишние пробелы по краям."""
        return value.strip()