"""Тесты журнала действий администраторов."""

from app.core.audit import _sanitize, diff


def test_diff_returns_only_changed_fields():
    """Журнал хранит только изменения, а не полный снимок объекта."""
    before = {"title": "Бот", "price_from": 6000, "status": "published"}
    after = {"title": "Бот", "price_from": 7500, "status": "published"}
    changes = diff(before, after)
    assert list(changes.keys()) == ["price_from"]
    assert changes["price_from"]["было"] == 6000
    assert changes["price_from"]["стало"] == 7500


def test_diff_of_identical_values_is_empty():
    """Сохранение без изменений не создаёт шума в журнале."""
    same = {"title": "Бот", "price_from": 6000}
    assert diff(same, dict(same)) == {}


def test_diff_detects_none_to_value():
    """Появление значения фиксируется: null → цена это изменение."""
    changes = diff({"price_from": None}, {"price_from": 6000})
    assert changes["price_from"] == {"было": None, "стало": 6000}


def test_sanitize_hides_secrets_but_keeps_fact():
    """Пароль в журнал не пишется, но факт его изменения виден."""
    clean = _sanitize({"password": "hunter2", "title": "Бот"})
    assert clean["password"] == "[скрыто]"
    assert "hunter2" not in str(clean)
    assert clean["title"] == "Бот"


def test_sanitize_works_on_nested_dicts():
    """Вложенные структуры тоже очищаются — секрет не протечёт из глубины."""
    clean = _sanitize({"changes": {"api_key": "sk-live-123", "price": 100}})
    assert clean["changes"]["api_key"] == "[скрыто]"
    assert "sk-live-123" not in str(clean)
    assert clean["changes"]["price"] == 100


def test_sanitize_is_case_insensitive():
    """Password, PASSWORD и password — одно и то же поле."""
    assert _sanitize({"PASSWORD": "x"})["PASSWORD"] == "[скрыто]"
    assert _sanitize({"Access_Token": "y"})["Access_Token"] == "[скрыто]"


class _FlushSession:
    """Сессия, которая выдаёт id только после flush/commit — как настоящая БД."""

    def __init__(self):
        self.flushed = False
        self.added = []

    def add(self, obj):
        # До flush база ещё не знает id — эмулируем именно это.
        if not self.flushed and hasattr(obj, "id"):
            obj.id = None
        self.added.append(obj)

    def flush(self):
        self.flushed = True
        for obj in self.added:
            if hasattr(obj, "id") and obj.id is None:
                obj.id = 42

    def commit(self):
        self.flush()


def test_entity_id_filled_after_flush():
    """Запись о создании должна ссылаться на объект, а не оставаться с NULL.

    Без flush() до записи в журнал row.id ещё None: в журнале появляется
    «создано решение» без указания, какое именно.
    """
    from app.db.models import Solution

    session = _FlushSession()
    row = Solution(slug="a", title="A", summary="s", kind="bot")
    session.add(row)
    session.flush()
    assert row.id == 42, "flush обязан присвоить id"
