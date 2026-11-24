"""Личный кабинет клиента (ТЗ 9.1, 9.3).

Главное правило безопасности: клиент видит ТОЛЬКО свои проекты. Проверка
происходит на сервере — отбор по client_id идёт в SQL, а не скрытием строк
в интерфейсе. Запрос чужого проекта отвечает 404, а не 403: иначе по разнице
кодов можно перебором узнать, какие проекты существуют.
"""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session as DbSession, selectinload

from app.api.deps import get_current_user
from app.db.models import Client, Project, User
from app.db.session import get_session

router = APIRouter(prefix="/api/v1/account", tags=["account"])

# Подписи статусов для клиента. В базе хранятся короткие коды, клиенту показываем
# человеческий текст: «dev» посетителю ничего не говорит.
STATUS_LABELS: dict[str, str] = {
    "new": "Новый",
    "analysis": "Анализ",
    "dev": "Разработка",
    "testing": "Тестирование",
    "done": "Завершён",
}

TASK_STATUS_LABELS: dict[str, str] = {
    "todo": "Ожидает",
    "in_progress": "В работе",
    "done": "Готово",
}


def _iso(value: datetime | None) -> str | None:
    """Дата в ISO или None. Клиент сам решит, как её показать."""
    return value.isoformat() if value else None


def _current_client(session: DbSession, user: User) -> Client:
    """Клиент, привязанный к текущему пользователю.

    Карточка заводится администратором после заявки, поэтому у свежего
    пользователя её может не быть — тогда 404 с понятным текстом, а не пустой кабинет.
    """
    client = session.scalar(select(Client).where(Client.user_id == user.id))
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Кабинет ещё не заведён. Обратитесь к администратору.",
        )
    return client


def _project_brief(project: Project) -> dict:
    """Короткая карточка проекта для списка."""
    return {
        "id": project.id,
        "title": project.title,
        "status": project.status,
        "status_label": STATUS_LABELS.get(project.status, project.status),
        "price_rub": project.price_rub,
        "due_at": _iso(project.due_at),
        "created_at": _iso(project.created_at),
    }


@router.get("/profile")
def profile(
    session: DbSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> dict:
    """Профиль клиента: имя, компания, контакты (ТЗ 9.1)."""
    client = _current_client(session, user)
    return {
        "display_name": client.display_name,
        "company": client.company,
        "contact": client.contact_json,
        "email": user.email,
    }


@router.get("/projects")
def list_projects(
    session: DbSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> dict:
    """Список проектов клиента. Чужие не попадают даже в счётчик."""
    client = _current_client(session, user)
    projects = session.scalars(
        select(Project)
        .where(Project.client_id == client.id)
        .order_by(Project.created_at.desc())
    ).all()
    return {"items": [_project_brief(p) for p in projects], "count": len(projects)}


@router.get("/projects/{project_id}")
def project_detail(
    project_id: int,
    session: DbSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> dict:
    """Проект с задачами и историей статусов (ТЗ 9.1).

    Чужой проект неотличим от несуществующего — намеренно, см. шапку модуля.
    """
    client = _current_client(session, user)
    project = session.scalar(
        select(Project)
        .where(Project.id == project_id, Project.client_id == client.id)
        .options(selectinload(Project.tasks), selectinload(Project.history))
    )
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Проект не найден")

    return {
        **_project_brief(project),
        "description": project.description,
        "started_at": _iso(project.started_at),
        "completed_at": _iso(project.completed_at),
        "updated_at": _iso(project.updated_at),
        "tasks": [
            {
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "status": t.status,
                "status_label": TASK_STATUS_LABELS.get(t.status, t.status),
                "due_at": _iso(t.due_at),
                "completed_at": _iso(t.completed_at),
            }
            for t in sorted(project.tasks, key=lambda x: (x.status == "done", x.id))
        ],
        "history": [
            {
                "status_from": h.status_from,
                "status_to": h.status_to,
                "status_to_label": STATUS_LABELS.get(h.status_to, h.status_to),
                "comment": h.comment,
                "created_at": _iso(h.created_at),
            }
            for h in sorted(project.history, key=lambda x: x.created_at)
        ],
    }
