"""Загрузка файлов. Манифест: docs/manifests/uploads.md

Файлы лежат вне образа в /app/media (bind-mount), в базе — только метаданные.
Отдача идёт через API, а не напрямую nginx: только так проверяются права.
"""

from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session as DbSession

from app.core import audit
from app.core.permissions import Permission, require_permission
from app.core.uploads import DOCUMENT_MAX, UploadRejected, check_upload
from app.db.models import UploadedFile, User
from app.db.session import get_session

router = APIRouter(prefix="/api/v1/admin/uploads", tags=["admin-uploads"])

MEDIA_ROOT = Path("/app/media")


def media_path(stored_name: str) -> Path:
    """Путь к файлу с защитой от выхода за каталог хранения."""
    root = MEDIA_ROOT.resolve()
    target = (root / stored_name).resolve()
    if not str(target).startswith(str(root) + "/") and target != root:
        raise HTTPException(400, "Недопустимый путь")
    return target


@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    session: DbSession = Depends(get_session),
    user: User = Depends(require_permission(Permission.CONTENT_WRITE)),
) -> dict:
    """Принимает один файл. Размер ограничиваем до чтения в память."""
    content = await file.read(DOCUMENT_MAX + 1)
    try:
        checked = check_upload(file.filename or "", content)
    except UploadRejected as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc)) from exc

    MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
    target = media_path(checked.stored_name)
    target.write_bytes(content)

    row = UploadedFile(
        stored_name=checked.stored_name,
        original_name=(file.filename or "file")[:255],
        content_type=checked.content_type,
        size_bytes=checked.size,
        kind=checked.kind,
        checksum=checked.checksum,
        uploaded_by=user.id,
    )
    session.add(row)
    audit.record(
        session,
        actor_user_id=user.id,
        action="upload.create",
        entity="upload",
        entity_id=row.id,
        payload={"name": checked.stored_name},
    )
    session.commit()
    return {
        "id": row.id,
        "url": "/api/v1/public/files/" + row.stored_name,
        "original_name": row.original_name,
        "content_type": row.content_type,
        "size_bytes": row.size_bytes,
        "kind": row.kind,
    }


@router.get("")
def list_files(
    session: DbSession = Depends(get_session),
    _: User = Depends(require_permission(Permission.CONTENT_READ)),
) -> dict:
    """Все файлы, включая удалённые позже; удалённые не показываем."""
    rows = session.scalars(
        select(UploadedFile).where(UploadedFile.deleted_at.is_(None)).order_by(UploadedFile.id.desc())
    ).all()
    return {
        "items": [
            {
                "id": r.id,
                "url": "/api/v1/public/files/" + r.stored_name,
                "original_name": r.original_name,
                "content_type": r.content_type,
                "size_bytes": r.size_bytes,
                "kind": r.kind,
            }
            for r in rows
        ]
    }


@router.delete("/{file_id}")
def delete_file(
    file_id: int,
    session: DbSession = Depends(get_session),
    user: User = Depends(require_permission(Permission.CONTENT_WRITE)),
) -> dict:
    """Soft-delete: запись скрывается, файл на диске остаётся до ручной чистки."""
    from datetime import UTC, datetime

    row = session.get(UploadedFile, file_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(404, "Файл не найден")
    row.deleted_at = datetime.now(UTC)
    audit.record(
        session,
        actor_user_id=user.id,
        action="upload.delete",
        entity="upload",
        entity_id=file_id,
    )
    session.commit()
    return {"id": file_id, "deleted": True}
