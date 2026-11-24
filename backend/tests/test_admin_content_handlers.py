"""Обработчики статей и кейсов вызываются целиком, а не по частям.

Причина появления этих тестов: обработчик создания статьи обращался к
row.published, которого у статьи нет. Ошибка дожила до живого деплоя,
потому что тесты проверяли только вспомогательные функции (_apply_article,
_check_slug), но ни разу не вызывали сам обработчик.
"""

from app.api import admin_content
from app.api.admin_content import ArticlePayload, PortfolioPayload
from app.db.models import Article, Portfolio


class FakeSession:
    """Минимальная замена Session: собирает добавленное, имитирует commit."""

    def __init__(self):
        self.added = []
        self.committed = 0

    def add(self, obj):
        self.added.append(obj)

    def flush(self):
        """Обработчики вызывают flush, чтобы получить id до записи в журнал."""
        for obj in self.added:
            if hasattr(obj, "id") and obj.id is None:
                obj.id = 1

    def commit(self):
        self.committed += 1

    def scalar(self, _stmt):
        return None

    def get(self, _model, _id):
        return None


class FakeUser:
    id = 1


def test_create_article_runs_without_attribute_error():
    """Создание статьи обращается только к существующим полям модели."""
    session = FakeSession()
    payload = ArticlePayload(
        slug="skolko-stoit-avtomatizaciya",
        title="Сколько стоит автоматизация",
        excerpt="Короткое описание",
        body_md="## Конкретная проблема\n\nТекст.",
        status="published",
    )
    result = admin_content.create_article(payload, session, FakeUser())

    assert result["slug"] == "skolko-stoit-avtomatizaciya"
    assert session.committed == 1, "изменение не сохранено"
    assert any(isinstance(o, Article) for o in session.added), "статья не добавлена в сессию"
    assert any(
        getattr(o, "action", None) == "article.create" for o in session.added
    ), "действие не попало в журнал"


def test_create_portfolio_runs_without_attribute_error():
    """Создание кейса тоже проходит обработчик целиком."""
    session = FakeSession()
    payload = PortfolioPayload(
        slug="telegram-ai-konsultant",
        title="Telegram AI-консультант",
        summary="Ответы по базе знаний",
        problem_md="Проблема",
        solution_md="Решение",
        technologies=["Python", "LLM"],
        status="demo",
        published=True,
    )
    result = admin_content.create_portfolio(payload, session, FakeUser())

    assert result["slug"] == "telegram-ai-konsultant"
    assert session.committed == 1
    assert any(isinstance(o, Portfolio) for o in session.added)
    assert any(
        getattr(o, "action", None) == "portfolio.create" for o in session.added
    ), "действие не попало в журнал"
