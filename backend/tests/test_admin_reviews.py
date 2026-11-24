"""Тесты отзывов. Манифест: docs/manifests/ui/admin-reviews.md"""

from datetime import UTC, datetime

import pytest
from fastapi import HTTPException

from app.api.admin_reviews import REVIEW_STATUSES, ReviewPayload, _apply
from app.db.models import Review


def _new(status="draft", consent=False) -> Review:
    """Пустой отзыв в состоянии «только создан»."""
    return Review(
        author_name="Иван",
        text="Хорошо",
        status=status,
        consent_given=consent,
        sort_order=0,
    )


def _payload(**kw) -> ReviewPayload:
    """Тело запроса с разумными значениями по умолчанию."""
    base = {
        "author_name": "Иван",
        "text": "Хорошо",
        "consent_given": False,
        "status": "draft",
    }
    base.update(kw)
    return ReviewPayload(**base)


def test_statuses_declared():
    """Набор статусов зафиксирован."""
    assert REVIEW_STATUSES == ("draft", "published", "archived")


def test_consent_date_set_when_given():
    """Момент согласия фиксируется, когда флаг включили."""
    row = _new()
    assert row.consent_at is None
    _apply(row, _payload(consent_given=True))
    assert row.consent_at is not None
    assert row.consent_given is True


def test_consent_date_kept_when_already_given():
    """Повторное сохранение с согласием не двигает дату согласия."""
    row = _new()
    _apply(row, _payload(consent_given=True))
    first = row.consent_at
    row.consent_at = first.replace(year=first.year - 1)
    old = row.consent_at
    _apply(row, _payload(consent_given=True))
    assert row.consent_at == old


def test_withdrawn_consent_unpublishes():
    """Отозвали согласие — отзыв снимается с публикации сам, без подсказок."""
    row = _new()
    _apply(row, _payload(consent_given=True, status="published"))
    assert row.status == "published"
    assert row.consent_at is not None

    _apply(row, _payload(consent_given=False, status="published"))
    assert row.status == "draft"
    assert row.consent_at is None
    assert row.published_at is None


def test_publish_sets_date():
    """Дата публикации появляется при переходе в published."""
    row = _new()
    _apply(row, _payload(consent_given=True, status="published"))
    assert row.published_at is not None


def test_unpublish_clears_date():
    """Снятие с публикации обнуляет дату публикации."""
    row = _new()
    _apply(row, _payload(consent_given=True, status="published"))
    _apply(row, _payload(consent_given=True, status="draft"))
    assert row.published_at is None


def test_bad_status_rejected():
    """Неизвестный статус не сохраняем: иначе отзыв выпадет из всех выборок."""
    with pytest.raises(HTTPException) as err:
        _apply(_new(), _payload(status="опубликован"))
    assert err.value.status_code == 422


def test_fields_trimmed_and_empty_to_none():
    """Пробелы срезаются, пустые необязательные поля становятся None."""
    row = _new()
    _apply(row, _payload(author_name="  Иван  ", author_position="   ", project_title=""))
    assert row.author_name == "Иван"
    assert row.author_position is None
    assert row.project_title is None


def test_consent_version_saved():
    """Версия текста согласия сохраняется — требование ТЗ 12.6."""
    row = _new()
    _apply(row, _payload(consent_given=True, consent_version="v1.0"))
    assert row.consent_version == "v1.0"
