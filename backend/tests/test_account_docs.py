"""Тесты документов и переписки в кабинете (ТЗ 9.1, 9.3).

Главное, что проверяется: клиент не получает документы и переписку чужого проекта.
Это та дыра, которую не видно, пока в базе один клиент.
"""

import os

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://test:test@127.0.0.1:1/test")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import JSON, create_engine, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_current_user
from app.db.models import (
    Base,
    Client,
    Document,
    Message,
    Project,
    Role,
    UploadedFile,
    User,
    user_roles,
)
from app.db.session import get_session
from app.main import app


@pytest.fixture()
def env():
    """Два клиента, у каждого свой проект; у первого — документ и сообщение."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    tables = [
        User.__table__,
        Role.__table__,
        user_roles,
        Client.__table__,
        Project.__table__,
        Document.__table__,
        Message.__table__,
        UploadedFile.__table__,
    ]
    for table in tables:
        for column in table.columns:
            if isinstance(column.type, JSONB):
                column.type = JSON()
    Base.metadata.create_all(engine, tables=tables)
    Session_ = sessionmaker(bind=engine)
    db = Session_()

    me = User(email="me@test.local", password_hash="x", display_name="Я", status="active")
    other = User(email="other@test.local", password_hash="x", display_name="Другой", status="active")
    db.add_all([me, other])
    db.flush()
    my_client = Client(display_name="Мой", user_id=me.id)
    other_client = Client(display_name="Чужой", user_id=other.id)
    db.add_all([my_client, other_client])
    db.flush()
    my_project = Project(client_id=my_client.id, title="Мой проект", status="new")
    other_project = Project(client_id=other_client.id, title="Чужой проект", status="new")
    db.add_all([my_project, other_project])
    db.flush()
    file = UploadedFile(
        stored_name="abc123.pdf",
        original_name="ТЗ.pdf",
        content_type="application/pdf",
        size_bytes=1234,
        checksum="deadbeef",
    )
    db.add(file)
    db.flush()
    db.add(Document(project_id=my_project.id, file_id=file.id, title="ТЗ", category="tz"))
    db.add(Message(project_id=my_project.id, author_user_id=me.id, author_role="client", body="Привет"))
    ids = {
        "me": me.id,
        "my_project": my_project.id,
        "other_project": other_project.id,
    }
    db.commit()
    db.close()
    return Session_, ids


@pytest.fixture(autouse=True)
def clean_overrides():
    yield
    app.dependency_overrides.clear()


def _client(env, user_key="me"):
    """TestClient от имени указанного пользователя."""
    Session_, ids = env

    def override_session():
        db = Session_()
        try:
            yield db
        finally:
            db.close()

    def override_user():
        db = Session_()
        try:
            return db.get(User, ids[user_key])
        finally:
            db.close()

    app.dependency_overrides[get_session] = override_session
    app.dependency_overrides[get_current_user] = override_user
    return TestClient(app)


def test_own_documents_are_returned(env):
    """Свои документы видны."""
    c = _client(env)
    r = c.get("/api/v1/account/projects/" + str(env[1]["my_project"]) + "/documents")
    assert r.status_code == 200
    data = r.json()
    assert data["count"] == 1
    assert data["items"][0]["file_name"] == "ТЗ.pdf"


def test_foreign_project_documents_are_404(env):
    """Документы чужого проекта недоступны — 404, а не пустой список."""
    c = _client(env)
    r = c.get("/api/v1/account/projects/" + str(env[1]["other_project"]) + "/documents")
    assert r.status_code == 404


def test_foreign_project_messages_are_404(env):
    """Переписка чужого проекта недоступна."""
    c = _client(env)
    r = c.get("/api/v1/account/projects/" + str(env[1]["other_project"]) + "/messages")
    assert r.status_code == 404


def test_client_cannot_write_to_foreign_project(env):
    """Нельзя написать сообщение в чужой проект — иначе это утечка наружу."""
    c = _client(env)
    r = c.post(
        "/api/v1/account/projects/" + str(env[1]["other_project"]) + "/messages",
        params={"body": "Влез"},
    )
    assert r.status_code == 404

    db = env[0]()
    assert db.scalars(select(Message)).all() != []
    count = len([m for m in db.scalars(select(Message)).all() if m.body == "Влез"])
    db.close()
    assert count == 0


def test_message_author_role_is_client(env):
    """Роль автора фиксируется как client, а не вычисляется потом."""
    c = _client(env)
    r = c.post(
        "/api/v1/account/projects/" + str(env[1]["my_project"]) + "/messages",
        params={"body": "Вопрос по срокам"},
    )
    assert r.status_code == 201

    db = env[0]()
    sent = db.scalar(select(Message).where(Message.body == "Вопрос по срокам"))
    db.close()
    assert sent is not None
    assert sent.author_role == "client"


def test_empty_message_is_422(env):
    """Пробелы вместо текста — пустое сообщение, а не сообщение пробелов."""
    c = _client(env)
    r = c.post(
        "/api/v1/account/projects/" + str(env[1]["my_project"]) + "/messages",
        params={"body": "   "},
    )
    assert r.status_code == 422


def test_download_foreign_document_is_404(env):
    """Скачивание чужого документа закрыто — та же дыра, что и в списке."""
    c = _client(env)
    db = env[0]()
    want = db.scalar(select(Document))
    doc_id = want.id
    db.close()
    r = c.get(
        "/api/v1/account/projects/" + str(env[1]["other_project"]) + "/documents/" + str(doc_id)
    )
    assert r.status_code == 404


def test_download_missing_file_is_410(env):
    """Файл пропал с диска — 410 «недоступен», а не 500 и не пустой ответ."""
    c = _client(env)
    r = c.get(
        "/api/v1/account/projects/" + str(env[1]["my_project"]) + "/documents/1"
    )
    # Файла на диске нет (в тесте его никто не создавал) — честная ошибка.
    assert r.status_code == 410


PDF_HEAD = b"%PDF-1.4\n"


def test_client_uploads_document_to_own_project(env):
    """Клиент может приложить документ в свой проект (ТЗ 9.1, «Документы»)."""
    c = _client(env)
    r = c.post(
        "/api/v1/account/projects/" + str(env[1]["my_project"]) + "/documents",
        files={"file": ("Смета.pdf", PDF_HEAD + b"body", "application/pdf")},
        data={"title": "Смета", "category": "act"},
    )
    assert r.status_code == 201
    assert r.json()["title"] == "Смета"

    # Документ действительно появился в проекте, а не только в ответе.
    listed = c.get(
        "/api/v1/account/projects/" + str(env[1]["my_project"]) + "/documents"
    ).json()
    titles = [d["title"] for d in listed["items"]]
    assert "Смета" in titles


def test_upload_to_foreign_project_is_404(env):
    """Загрузка в чужой проект отбивается: иначе клиент подсунет файл соседу."""
    c = _client(env)
    db = env[0]()
    before = len(db.scalars(select(Document)).all())
    db.close()

    r = c.post(
        "/api/v1/account/projects/" + str(env[1]["other_project"]) + "/documents",
        files={"file": ("Чужое.pdf", PDF_HEAD + b"body", "application/pdf")},
    )
    assert r.status_code == 404

    db = env[0]()
    after = len(db.scalars(select(Document)).all())
    db.close()
    assert after == before


def test_upload_forbidden_type_is_422(env):
    """Тип файла вне белого списка не принимается (ТЗ 12.5)."""
    c = _client(env)
    r = c.post(
        "/api/v1/account/projects/" + str(env[1]["my_project"]) + "/documents",
        files={"file": ("script.exe", b"MZ\x90\x00", "application/octet-stream")},
    )
    assert r.status_code == 422


def test_upload_bad_category_is_422(env):
    """Категория вне ck_documents_category не принимается."""
    c = _client(env)
    r = c.post(
        "/api/v1/account/projects/" + str(env[1]["my_project"]) + "/documents",
        files={"file": ("Акт.pdf", PDF_HEAD + b"body", "application/pdf")},
        data={"category": "выдумка"},
    )
    assert r.status_code == 422
