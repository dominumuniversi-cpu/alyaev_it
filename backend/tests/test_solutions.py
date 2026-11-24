"""Библиотека решений: типы, публикация, цена, права. Манифест: ui/solutions-library.md."""

import pytest
from pydantic import ValidationError

from app.api.admin_solutions import (
    SOLUTION_KINDS,
    SOLUTION_STATUSES,
    SolutionPayload,
    _apply,
)
from app.db.models import Solution


def _payload(**kw):
    base = dict(slug="bot-zayavok", title="Бот заявок", summary="Принимает заявки")
    base.update(kw)
    return SolutionPayload(**base)


def test_kinds_are_fixed():
    """Список типов закрытый — иначе каталог превратится в свободный текст."""
    assert SOLUTION_KINDS == ("bot", "ai", "parser", "report", "integration", "script")


def test_statuses_match_content_rule():
    """Те же три статуса, что у статей: черновик/опубликовано/архив."""
    assert SOLUTION_STATUSES == ("draft", "published", "archived")


def test_price_on_request_clears_price():
    """«По запросу» стирает цену: противоречие путает и витрину, и админку."""
    row = Solution(slug="a", title="A", summary="s", kind="bot")
    _apply(row, _payload(price_on_request=True, price_from=5000))
    assert row.price_on_request is True
    assert row.price_from is None


def test_price_clears_flag():
    """Обычная цена снимает флаг «по запросу»."""
    row = Solution(slug="a", title="A", summary="s", kind="bot")
    _apply(row, _payload(price_on_request=False, price_from=5000))
    assert row.price_on_request is False
    assert row.price_from == 5000


def test_included_drops_empty_items():
    """Пустые пункты в списке «что входит» — мусор на странице."""
    row = Solution(slug="a", title="A", summary="s", kind="bot")
    _apply(row, _payload(included=["Первый", "  ", "", "Второй "]))
    assert row.included == ["Первый", "Второй"]


def test_demo_url_none_by_default():
    """Демо нет — NULL, а не пустая строка и не выдуманный адрес."""
    row = Solution(slug="a", title="A", summary="s", kind="bot")
    _apply(row, _payload())
    assert row.demo_url is None


def test_unknown_field_rejected():
    """Опечатка в имени поля не должна молча давать пустую запись."""
    with pytest.raises(ValidationError):
        SolutionPayload(slug="a", title="A", summary="s", price=5000)


def test_empty_summary_rejected():
    """Краткое описание обязательно: карточка без него пустая."""
    with pytest.raises(ValidationError):
        SolutionPayload(slug="a", title="A", summary="")
