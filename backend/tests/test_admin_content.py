"""Тесты портфолио и статей. Манифест: docs/manifests/ui/portfolio-articles.md"""

from datetime import UTC, datetime, timedelta

import pytest
from fastapi import HTTPException

from app.api.admin_content import (
    ARTICLE_STATUSES,
    PORTFOLIO_STATUSES,
    ArticlePayload,
    _apply_article,
    _check_slug,
)
from app.db.models import Article


def test_slug_rejects_cyrillic():
    """Русский слаг ломает URL и SEO — отказываем сразу."""
    with pytest.raises(HTTPException) as err:
        _check_slug("телеграм-боты")
    assert err.value.status_code == 422


def test_slug_accepts_latin():
    """Обычный слаг принимается и приводится к нижнему регистру."""
    assert _check_slug("Telegram-Bot") == "telegram-bot"
    assert _check_slug("ai-assistant-2") == "ai-assistant-2"


def test_slug_rejects_bad_shapes():
    """Подчёркивания, пробелы и двойные дефисы дают некрасивый адрес."""
    for bad in ("a_b", "a b", "a--b", "-a", "a-"):
        with pytest.raises(HTTPException):
            _check_slug(bad)


def test_statuses_declared():
    """Набор статусов зафиксирован: три для кейса, три для статьи."""
    assert PORTFOLIO_STATUSES == ("demo", "own", "commercial")
    assert ARTICLE_STATUSES == ("draft", "published", "archived")


def test_publish_sets_date_once():
    """Дата публикации ставится при первой публикации."""
    row = Article(slug="a", title="A", excerpt="", body_md="", status="draft")
    _apply_article(row, ArticlePayload(slug="a", title="A", status="published"))
    assert row.published_at is not None
    first = row.published_at

    # Повторное сохранение через день не должно двигать дату.
    row.published_at = first - timedelta(days=3)
    _apply_article(row, ArticlePayload(slug="a", title="A правка", status="published"))
    assert row.published_at == first - timedelta(days=3)


def test_draft_keeps_no_date():
    """Черновик не получает дату публикации."""
    row = Article(slug="b", title="B", excerpt="", body_md="", status="draft")
    _apply_article(row, ArticlePayload(slug="b", title="B", status="draft"))
    assert row.published_at is None


def test_unpublish_keeps_date():
    """Снятие с публикации не стирает историю: дата остаётся."""
    row = Article(slug="c", title="C", excerpt="", body_md="", status="draft")
    row.published_at = datetime.now(UTC)
    _apply_article(row, ArticlePayload(slug="c", title="C", status="draft"))
    assert row.published_at is not None
