"""Личный кабинет клиента (ТЗ 9.1, 9.3).

Главное правило безопасности: клиент видит ТОЛЬКО свои проекты. Проверка
происходит на сервере — отбор по client_id идёт в SQL, а не скрытием строк
в интерфейсе. Запрос чужого проекта отвечает 404, а не 403: иначе по разнице
кодов можно перебором узнать, какие проекты существуют.
"""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session as DbSession, selectinload

from app.api.admin_uploads import MEDIA_ROOT, media_path
from app.api.deps import get_current_user
from app.core.uploads import DOCUMENT_MAX, UploadRejected, check_upload
from app.db.models import Client, Document, Message, Notification, Project, UploadedFile, User
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

# Категории документов: те же, что в ограничении таблицы documents (ck_documents_category).
DOCUMENT_CATEGORIES = ("tz", "act", "instruction", "other")

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


def _own_project(session: DbSession, client: Client, project_id: int) -> Project:
    """Проект клиента или 404.

    Одна функция на все вложенные ресурсы (задачи, документы, переписка):
    проверка доступа не должна размножаться по маршрутам — там она расходится.
    """
    project = session.scalar(
        select(Project).where(Project.id == project_id, Project.client_id == client.id)
    )
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Проект не найден")
    return project

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


@router.get("/projects/{project_id}/documents")
def project_documents(
    project_id: int,
    session: DbSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> dict:
    """Документы проекта (ТЗ 9.1). Ссылки на скачивание — только для своих файлов."""
    client = _current_client(session, user)
    project = _own_project(session, client, project_id)
    rows = session.execute(
        select(Document, UploadedFile)
        .join(UploadedFile, UploadedFile.id == Document.file_id)
        .where(Document.project_id == project.id, Document.deleted_at.is_(None))
        .order_by(Document.created_at.desc())
    ).all()
    items = [
        {
            "id": doc.id,
            "title": doc.title,
            "category": doc.category,
            "file_name": file.original_name,
            "size_bytes": file.size_bytes,
            "created_at": _iso(doc.created_at),
            "download_url": "/api/v1/account/projects/" + str(project.id) + "/documents/" + str(doc.id),
        }
        for doc, file in rows
    ]
    return {"items": items, "count": len(items)}


@router.get("/projects/{project_id}/messages")
def project_messages(
    project_id: int,
    session: DbSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> dict:
    """Переписка по проекту в порядке отправки (ТЗ 9.1)."""
    client = _current_client(session, user)
    project = _own_project(session, client, project_id)
    rows = session.scalars(
        select(Message).where(Message.project_id == project.id).order_by(Message.id)
    ).all()
    items = [
        {
            "id": m.id,
            "author_role": m.author_role,
            "body": m.body,
            "created_at": _iso(m.created_at),
        }
        for m in rows
    ]
    return {"items": items, "count": len(items)}


@router.post("/projects/{project_id}/messages", status_code=status.HTTP_201_CREATED)
def send_message(
    project_id: int,
    body: str = Query(min_length=1, max_length=5000),
    session: DbSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> dict:
    """Клиент пишет сообщение по своему проекту.

    author_role пишется снимком: если роль пользователя потом сменится,
    история переписки не должна переписаться задним числом.
    """
    client = _current_client(session, user)
    project = _own_project(session, client, project_id)
    text = body.strip()
    if not text:
        # Пробелы вместо текста — это пустое сообщение, а не сообщение пробелов.
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Сообщение не может быть пустым",
        )
    message = Message(
        project_id=project.id,
        author_user_id=user.id,
        author_role="client",
        body=text,
    )
    session.add(message)
    session.commit()
    session.refresh(message)
    return {"id": message.id, "created_at": _iso(message.created_at)}


@router.get("/projects/{project_id}/documents/{document_id}")
def download_document(
    project_id: int,
    document_id: int,
    session: DbSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    """Отдаёт файл документа. Доступ — только через свой проект.

    Документ ищется вместе с project_id: чужой получает 404 так же, как несуществующий.
    Имя файла из базы, а не из запроса — иначе это path traversal.
    """
    from fastapi.responses import FileResponse

    from app.api.admin_uploads import media_path

    client = _current_client(session, user)
    project = _own_project(session, client, project_id)
    row = session.execute(
        select(Document, UploadedFile)
        .join(UploadedFile, UploadedFile.id == Document.file_id)
        .where(
            Document.id == document_id,
            Document.project_id == project.id,
            Document.deleted_at.is_(None),
        )
    ).first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Документ не найден")
    doc, file = row
    # media_path сам не даст выйти за каталог хранения — одна защита на весь проект.
    path = media_path(file.stored_name)
    if not path.is_file():
        # Файл пропал с диска: честная ошибка лучше пустого ответа.
        raise HTTPException(
            status_code=status.HTTP_410_GONE, detail="Файл документа недоступен"
        )
    return FileResponse(
        path,
        media_type=file.content_type,
        filename=file.original_name,
    )


@router.get("/notifications")
def list_notifications(
    session: DbSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> dict:
    """Уведомления пользователя: свежие сверху, плюс счётчик непрочитанных."""
    rows = session.scalars(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.id.desc())
        .limit(50)
    ).all()
    unread = session.scalar(
        select(func.count())
        .select_from(Notification)
        .where(Notification.user_id == user.id, Notification.read_at.is_(None))
    )
    return {
        "items": [
            {
                "id": x.id,
                "kind": x.kind,
                "title": x.title,
                "body": x.body,
                "project_id": x.project_id,
                "read": x.read_at is not None,
                "created_at": _iso(x.created_at),
            }
            for x in rows
        ],
        "unread": unread or 0,
    }


@router.post("/notifications/{notification_id}/read")
def mark_read(
    notification_id: int,
    session: DbSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> dict:
    """Отмечает уведомление прочитанным.

    Идемпотентно: повторный вызов не переписывает дату первого прочтения.
    Чужое уведомление неотличимо от несуществующего — 404.
    """
    note = session.scalar(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user.id,
        )
    )
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Уведомление не найдено")
    if note.read_at is None:
        note.read_at = datetime.now(UTC)
        session.commit()
    return {"id": note.id, "read": True}


@router.post("/projects/{project_id}/documents", status_code=status.HTTP_201_CREATED)
async def upload_project_document(
    project_id: int,
    file: UploadFile = File(...),
    title: str = Form(""),
    category: str = Form("other"),
    session: DbSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> dict:
    """Загрузка документа клиентом (ТЗ 9.1, «Документы»).

    Клиент грузит только в СВОЙ проект: проверка идёт на сервере через _own_project.
    Право CONTENT_WRITE здесь не подходит -- оно административное, поэтому чужой
    проект отсекается владением, а не ролью.
    """
    client = _current_client(session, user)
    project = _own_project(session, client, project_id)

    if category not in DOCUMENT_CATEGORIES:
        raise HTTPException(422, "Недопустимая категория документа")

    # Размер ограничиваем до чтения в память, как в админской загрузке.
    content = await file.read(DOCUMENT_MAX + 1)
    try:
        checked = check_upload(file.filename or "", content)
    except UploadRejected as exc:
        raise HTTPException(422, str(exc)) from exc

    MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
    target = media_path(checked.stored_name)
    target.write_bytes(content)

    uploaded = UploadedFile(
        stored_name=checked.stored_name,
        original_name=(file.filename or "file")[:255],
        content_type=checked.content_type,
        size_bytes=checked.size,
        kind=checked.kind,
        checksum=checked.checksum,
        uploaded_by=user.id,
    )
    session.add(uploaded)
    session.flush()

    doc = Document(
        project_id=project.id,
        file_id=uploaded.id,
        title=(title.strip() or uploaded.original_name)[:200],
        category=category,
        uploaded_by=user.id,
    )
    session.add(doc)
    session.commit()
    session.refresh(doc)

    return {"id": doc.id, "title": doc.title, "category": doc.category}
