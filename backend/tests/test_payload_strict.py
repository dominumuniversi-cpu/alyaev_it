"""Строгая проверка тела запроса: лишние поля — ошибка, а не тихий дефолт.

История: клиент прислал {"body": "..."} вместо {"body_md": "..."}.
Pydantic молча проигнорировал неизвестное поле, взял body_md="" и status="draft",
API ответил 200, в базе появилась пустая статья-черновик. Ошибка обнаружилась
только при попытке открыть статью на сайте — через два шага после создания.
"""

import pytest
from pydantic import ValidationError

from app.api.admin_content import ArticlePayload, PortfolioPayload


def test_article_payload_rejects_unknown_field():
    """Опечатка в имени поля должна падать сразу, а не давать пустую статью."""
    with pytest.raises(ValidationError) as err:
        ArticlePayload(slug="a", title="A", body="текст вместо body_md")
    assert "body" in str(err.value)


def test_article_payload_accepts_known_fields():
    """Правильные поля проходят без замечаний."""
    payload = ArticlePayload(slug="a", title="A", body_md="## Заголовок", status="published")
    assert payload.body_md == "## Заголовок"
    assert payload.status == "published"


def test_portfolio_payload_rejects_unknown_field():
    """То же правило для кейсов."""
    with pytest.raises(ValidationError):
        PortfolioPayload(slug="a", title="A", summary="s", unknown_field=1)
