"""Схемы входных данных API с валидацией."""

from pydantic import BaseModel, Field, field_validator


# Поля брифа (ТЗ 14): ключ -> максимальная длина. Значения — из выпадающих списков,
# поэтому длина небольшая: это метки, а не сочинения.
BRIEF_FIELDS: dict[str, int] = {
    "current": 200,      # что используется сейчас
    "systems": 200,      # какие системы связать
    "staff": 64,         # сколько сотрудников задействовано
    "result": 300,       # какой результат ожидается
    "tech_task": 32,     # есть ли ТЗ
    "files": 32,         # есть ли материалы
    "budget": 32,        # бюджет
    "deadline": 32,      # желаемый срок
}


class LeadCreate(BaseModel):
    """Заявка с публичной формы. Поля и ограничения — по манифесту UI (field.md)."""

    name: str = Field(min_length=2, max_length=100)
    contact: str = Field(min_length=3, max_length=64)
    task_type: str | None = Field(default=None, max_length=64)
    message: str = Field(min_length=20, max_length=5000)
    company_site: str | None = Field(default=None, max_length=255)
    source_page: str | None = Field(default=None, max_length=255)
    utm: dict[str, str] = Field(default_factory=dict)
    # Ответы онлайн-брифа (ТЗ 14). Набор ключей фиксирован — см. BRIEF_FIELDS.
    brief: dict[str, str] = Field(default_factory=dict)
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

    @field_validator("brief")
    @classmethod
    def check_brief(cls, value: dict[str, str]) -> dict[str, str]:
        """Оставляет только известные вопросы брифа и обрезает длину.

        Неизвестные ключи отбрасываются молча, а не отклоняют заявку:
        клиент заполнил форму — терять её из-за лишнего поля нельзя.
        """
        cleaned: dict[str, str] = {}
        for key, raw in value.items():
            if key not in BRIEF_FIELDS:
                continue
            text = (raw or "").strip()[:BRIEF_FIELDS[key]]
            if text:
                # Пустые ответы не храним: они не несут смысла и мешают фильтрам.
                cleaned[key] = text
        return cleaned


    @field_validator("name", "message")
    @classmethod
    def strip_text(cls, value: str) -> str:
        """Убирает лишние пробелы по краям."""
        return value.strip()