"""Админка: клиенты, проекты, выдача доступа (ТЗ 9.2).

Клиент не регистрируется сам (ТЗ 9.4): учётную запись заводит администратор
после заказа. Здесь — создание карточки клиента, выдача входа и ведение проектов.

Смена статуса идёт ТОЛЬКО через сервис _set_status: он же пишет историю.
Прямой UPDATE колонки оставил бы историю без события — манифест db/schema.md.
"""

import secrets

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select, update
from sqlalchemy.orm import Session as DbSession, selectinload

from app.core import audit
from app.core.permissions import Permission, require_permission
from app.core.security import hash_password
from app.db.models import (
    Client,
    Message,
    Project,
    ProjectStatusHistory,
    ProjectTask,
    Role,
    Session as SessionRow,
    User,
)
from app.db.session import get_session
from app.services.notify import notify_client_owner

router = APIRouter(prefix="/api/v1/admin", tags=["admin-clients"])

PROJECT_STATUSES = ("new", "analysis", "dev", "testing", "done")

# Подписи для уведомлений: клиенту «dev» ничего не говорит.
PROJECT_STATUS_LABELS: dict[str, str] = {
    "new": "Новый",
    "analysis": "Анализ",
    "dev": "Разработка",
    "testing": "Тестирование",
    "done": "Завершён",
}
TASK_STATUSES = ("todo", "in_progress", "done")

# Набор символов для временного пароля. Убраны похожие 0/O и 1/l/I:
# пароль диктуют по телефону или переписывают руки, и «ноль или буква О»
# превращается в лишний круг поддержки.
PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"


class ClientPayload(BaseModel):
    """Новый клиент. user_id не принимается: пользователь создаётся вместе с доступом."""

    display_name: str = Field(min_length=1, max_length=200)
    company: str = Field(default="", max_length=200)
    contact_json: dict = Field(default_factory=dict)


class ProjectPayload(BaseModel):
    """Новый проект клиента."""

    client_id: int
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=20000)
    price_rub: int | None = Field(default=None, ge=0)
    due_at: datetime | None = None


class StatusChangePayload(BaseModel):
    """Смена статуса проекта с комментарием для истории."""

    status: str = Field(max_length=24)
    comment: str = Field(default="", max_length=1000)


class TaskPayload(BaseModel):
    """Новая задача проекта."""

    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=5000)
    due_at: datetime | None = None


class TaskStatusPayload(BaseModel):
    """Смена статуса задачи."""

    status: str = Field(max_length=16)


def _generate_password(length: int = 12) -> str:
    """Временный пароль из безопасного алфавита.

    secrets, а не random: random предсказуем и для пароля не годится.
    """
    return "".join(secrets.choice(PASSWORD_ALPHABET) for _ in range(length))


def _set_status(
    session: DbSession, project: Project, new_status: str, comment: str, actor: User | None
) -> None:
    """Единственный путь смены статуса проекта: пишет историю в той же транзакции.

    Молча позволить статус вне списка нельзя — его отвергнет и CHECK в базе,
    но тогда ошибка прилетит как 500 вместо понятного 422.
    """
    if new_status not in PROJECT_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Недопустимый статус: " + new_status,
        )
    if new_status == project.status:
        # Смена на тот же статус не событие: история из повторов бесполезна.
        return
    now = datetime.now(UTC)
    session.add(
        ProjectStatusHistory(
            project_id=project.id,
            status_from=project.status,
            status_to=new_status,
            comment=comment,
            actor_user_id=actor.id if actor else None,
        )
    )
    project.status = new_status
    # Уведомляем клиента здесь, а не в маршруте: статус меняется только
    # этим путём, значит ни одна смена не останется без уведомления.
    notify_client_owner(
        session,
        project,
        kind="status",
        title="Статус проекта «" + project.title + "»: " + PROJECT_STATUS_LABELS.get(new_status, new_status),
        body=comment,
        exclude_user_id=actor.id if actor else None,
    )
    if new_status == "done" and project.completed_at is None:
        project.completed_at = now
    if new_status != "done":
        # Вернули в работу — дата завершения больше не верна.
        project.completed_at = None
    if project.started_at is None and new_status != "new":
        project.started_at = now


@router.get("/clients")
def list_clients(
    session: DbSession = Depends(get_session),
    _: User = Depends(require_permission(Permission.PROJECTS_ALL)),
) -> dict:
    """Все клиенты с числом проектов и признаком «вход выдан».

    Признак важен: администратор должен видеть, кому пароль уже выдан,
    а кому нет — иначе непонятно, почему клиент не может войти.
    """
    clients = session.scalars(select(Client).order_by(Client.created_at.desc())).all()
    items = []
    for c in clients:
        projects = session.scalars(select(Project).where(Project.client_id == c.id)).all()
        items.append(
            {
                "id": c.id,
                "display_name": c.display_name,
                "company": c.company,
                "has_login": c.user_id is not None,
                "projects_count": len(projects),
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
        )
    return {"items": items, "count": len(items)}


@router.post("/clients", status_code=status.HTTP_201_CREATED)
def create_client(
    payload: ClientPayload,
    session: DbSession = Depends(get_session),
    actor: User = Depends(require_permission(Permission.PROJECTS_ALL)),
) -> dict:
    """Создаёт карточку клиента без входа. Вход выдаётся отдельным действием."""
    client = Client(
        display_name=payload.display_name.strip(),
        company=payload.company.strip(),
        contact_json=payload.contact_json,
    )
    session.add(client)
    session.flush()
    # Журнал пишется в ту же транзакцию: при откате изменения откатится и запись.
    audit.record(
        session,
        actor_user_id=actor.id,
        action="client.create",
        entity="client",
        entity_id=client.id,
        payload={"display_name": client.display_name, "company": client.company},
    )
    session.commit()
    session.refresh(client)
    return {"id": client.id, "display_name": client.display_name}


@router.post("/clients/{client_id}/access")
def grant_access(
    client_id: int,
    email: str = Query(min_length=3, max_length=320),
    session: DbSession = Depends(get_session),
    actor: User = Depends(require_permission(Permission.USERS_MANAGE)),
) -> dict:
    """Выдаёт клиенту вход: создаёт пользователя с ролью client и возвращает пароль.

    Пароль возвращается ОДИН раз, в ответе на создание. Хранится только хеш,
    поэтому «посмотреть пароль клиента» потом невозможно — только перевыпустить.
    """
    client = session.get(Client, client_id)
    if client is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Клиент не найден")
    if client.user_id is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Доступ уже выдан. Чтобы сменить пароль, перевыпустите его.",
        )

    normalized = email.strip().lower()
    if session.scalar(select(User).where(User.email == normalized)) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Пользователь с такой почтой уже существует",
        )

    role = session.scalar(select(Role).where(Role.code == "client"))
    if role is None:
        # Роли засеяны миграцией; их отсутствие — сломанная установка, а не ошибка ввода.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Роль client не найдена. Проверьте сиды ролей.",
        )

    password = _generate_password()
    user = User(
        email=normalized,
        password_hash=hash_password(password),
        display_name=client.display_name,
        status="active",
    )
    user.roles.append(role)
    session.add(user)
    session.flush()
    client.user_id = user.id
    # Пароль в журнал НЕ попадает: журнал читают другие роли.
    audit.record(
        session,
        actor_user_id=actor.id,
        action="client.access_granted",
        entity="client",
        entity_id=client.id,
        payload={"email": normalized, "user_id": user.id},
    )
    session.commit()

    return {
        "user_id": user.id,
        "email": normalized,
        "password": password,
        "warning": "Пароль показывается один раз. Передайте его клиенту и больше не храните.",
    }


@router.post("/clients/{client_id}/reset-password")
def reset_client_password(
    client_id: int,
    session: DbSession = Depends(get_session),
    actor: User = Depends(require_permission(Permission.USERS_MANAGE)),
) -> dict:
    """Перевыпускает пароль клиенту и гасит его сессии.

    Сессии гасим обязательно: иначе старые cookie продолжают работать,
    и смена пароля ничего не защищает (ТЗ 9.4).
    """
    client = session.get(Client, client_id)
    if client is None or client.user_id is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="У клиента нет доступа")
    user = session.get(User, client.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    password = _generate_password()
    user.password_hash = hash_password(password)
    session.execute(
        update(SessionRow)
        .where(SessionRow.user_id == user.id, SessionRow.revoked_at.is_(None))
        .values(revoked_at=datetime.now(UTC))
    )
    audit.record(
        session,
        actor_user_id=actor.id,
        action="client.password_reset",
        entity="client",
        entity_id=client.id,
        payload={"email": user.email},
    )
    session.commit()
    return {
        "email": user.email,
        "password": password,
        "warning": "Старые сессии завершены. Пароль показывается один раз.",
    }


@router.get("/projects")
def list_projects(
    client_id: int | None = Query(default=None),
    session: DbSession = Depends(get_session),
    _: User = Depends(require_permission(Permission.PROJECTS_ALL)),
) -> dict:
    """Все проекты или проекты одного клиента."""
    query = select(Project).options(selectinload(Project.client))
    if client_id is not None:
        query = query.where(Project.client_id == client_id)
    projects = session.scalars(query.order_by(Project.created_at.desc())).all()
    return {
        "items": [
            {
                "id": p.id,
                "client_id": p.client_id,
                "client_name": p.client.display_name if p.client else "",
                "title": p.title,
                "status": p.status,
                "price_rub": p.price_rub,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in projects
        ],
        "count": len(projects),
    }


@router.post("/projects", status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectPayload,
    session: DbSession = Depends(get_session),
    actor: User = Depends(require_permission(Permission.PROJECTS_ALL)),
) -> dict:
    """Создаёт проект. Первый статус фиксируется в истории сразу."""
    client = session.get(Client, payload.client_id)
    if client is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Клиент не найден")
    project = Project(
        client_id=client.id,
        title=payload.title.strip(),
        description=payload.description,
        status="new",
        price_rub=payload.price_rub,
        due_at=payload.due_at,
    )
    session.add(project)
    session.flush()
    # status_from = NULL означает «первый статус при создании» (манифест схемы).
    session.add(
        ProjectStatusHistory(
            project_id=project.id,
            status_from=None,
            status_to="new",
            comment="Проект создан",
            actor_user_id=actor.id,
        )
    )
    audit.record(
        session,
        actor_user_id=actor.id,
        action="project.create",
        entity="project",
        entity_id=project.id,
        payload={"client_id": client.id, "title": project.title},
    )
    session.commit()
    session.refresh(project)
    return {"id": project.id, "title": project.title}


@router.patch("/projects/{project_id}/status")
def change_project_status(
    project_id: int,
    payload: StatusChangePayload,
    session: DbSession = Depends(get_session),
    actor: User = Depends(require_permission(Permission.PROJECTS_ALL)),
) -> dict:
    """Меняет статус проекта и пишет событие в историю."""
    project = session.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Проект не найден")
    _set_status(session, project, payload.status, payload.comment, actor)
    audit.record(
        session,
        actor_user_id=actor.id,
        action="project.status",
        entity="project",
        entity_id=project.id,
        payload={"status": payload.status, "comment": payload.comment},
    )
    session.commit()
    return {"id": project.id, "status": project.status}


@router.patch("/projects/{project_id}/tasks/{task_id}")
def change_task_status(
    project_id: int,
    task_id: int,
    payload: TaskStatusPayload,
    session: DbSession = Depends(get_session),
    actor: User = Depends(require_permission(Permission.PROJECTS_ALL)),
) -> dict:
    """Закрывает или возвращает в работу задачу проекта.

    Задача ищется вместе с project_id: так чужая задача получает 404,
    а не «нельзя менять» — не подтверждаем её существование.
    """
    if payload.status not in TASK_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Недопустимый статус задачи: " + payload.status,
        )
    task = session.scalar(
        select(ProjectTask).where(ProjectTask.id == task_id, ProjectTask.project_id == project_id)
    )
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Задача не найдена")
    if task.status == payload.status:
        # Повтор того же статуса — не событие; журнал не засоряем.
        return {"id": task.id, "status": task.status}
    task.status = payload.status
    # Дата выполнения ставится и снимается вместе со статусом:
    # закрытая задача без даты бесполезна, открытая с датой — врёт.
    task.completed_at = datetime.now(UTC) if payload.status == "done" else None
    audit.record(
        session,
        actor_user_id=actor.id,
        action="project.task_status",
        entity="project",
        entity_id=project_id,
        payload={"task_id": task.id, "status": payload.status},
    )
    session.commit()
    return {"id": task.id, "status": task.status}


@router.get("/projects/{project_id}/tasks")
def list_tasks(
    project_id: int,
    session: DbSession = Depends(get_session),
    _: User = Depends(require_permission(Permission.PROJECTS_ALL)),
) -> dict:
    """Задачи проекта в порядке создания."""
    tasks = session.scalars(
        select(ProjectTask).where(ProjectTask.project_id == project_id).order_by(ProjectTask.id)
    ).all()
    return {
        "items": [
            {
                "id": x.id,
                "title": x.title,
                "status": x.status,
                "completed_at": x.completed_at.isoformat() if x.completed_at else None,
            }
            for x in tasks
        ],
        "count": len(tasks),
    }

@router.post("/projects/{project_id}/tasks", status_code=status.HTTP_201_CREATED)
def create_task(
    project_id: int,
    payload: TaskPayload,
    session: DbSession = Depends(get_session),
    actor: User = Depends(require_permission(Permission.PROJECTS_ALL)),
) -> dict:
    """Добавляет задачу в проект."""
    project = session.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Проект не найден")
    task = ProjectTask(
        project_id=project.id,
        title=payload.title.strip(),
        description=payload.description,
        status="todo",
        due_at=payload.due_at,
    )
    session.add(task)
    session.flush()
    audit.record(
        session,
        actor_user_id=actor.id,
        action="project.task_create",
        entity="project",
        entity_id=project.id,
        payload={"task_id": task.id, "title": task.title},
    )
    session.commit()
    session.refresh(task)
    return {"id": task.id, "title": task.title}



@router.get("/projects/{project_id}/messages")
def project_messages(
    project_id: int,
    session: DbSession = Depends(get_session),
    _: User = Depends(require_permission(Permission.PROJECTS_ALL)),
) -> dict:
    """Переписка проекта для сотрудника — та же, что видит клиент."""
    project = session.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Проект не найден")
    rows = session.scalars(
        select(Message).where(Message.project_id == project_id).order_by(Message.id)
    ).all()
    return {
        "items": [
            {
                "id": m.id,
                "author_role": m.author_role,
                "body": m.body,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in rows
        ],
        "count": len(rows),
    }


class ReplyPayload(BaseModel):
    """Ответ студии в переписке."""

    body: str = Field(min_length=1, max_length=5000)


@router.post("/projects/{project_id}/messages", status_code=status.HTTP_201_CREATED)
def reply_to_client(
    project_id: int,
    payload: ReplyPayload,
    session: DbSession = Depends(get_session),
    actor: User = Depends(require_permission(Permission.PROJECTS_ALL)),
) -> dict:
    """Сотрудник отвечает клиенту в переписке проекта.

    author_role="staff" — снимок, как и у сообщений клиента:
    история не должна меняться задним числом при смене ролей.
    """
    project = session.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Проект не найден")
    text = payload.body.strip()
    if not text:
        # Пробелы вместо ответа — пустой ответ, а не ответ пробелов.
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Сообщение не может быть пустым",
        )
    message = Message(
        project_id=project.id,
        author_user_id=actor.id,
        author_role="staff",
        body=text,
    )
    session.add(message)
    # Уведомление в той же транзакции, что и сообщение:
    # либо есть оба, либо ни одного.
    notify_client_owner(
        session,
        project,
        kind="message",
        title="Ответ по проекту «" + project.title + "»",
        body=text[:200],
        exclude_user_id=actor.id,
    )
    audit.record(
        session,
        actor_user_id=actor.id,
        action="project.reply",
        entity="project",
        entity_id=project.id,
        payload={"length": len(text)},
    )
    session.commit()
    session.refresh(message)
    return {"id": message.id, "created_at": message.created_at.isoformat() if message.created_at else None}
