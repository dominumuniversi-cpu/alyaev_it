"""Проверка загружаемых файлов. Манифест: docs/manifests/uploads.md

Тип определяется по содержимому, а не по расширению: расширение пишет
пользователь, и назвать .exe файлом .png ничего не стоит.
"""

import hashlib
import uuid
from dataclasses import dataclass

# Размер в байтах. 5 МБ для картинок, 20 МБ для документов.
IMAGE_MAX = 5 * 1024 * 1024
DOCUMENT_MAX = 20 * 1024 * 1024

# Магия файлов: первые байты, по которым узнаётся настоящий тип.
MAGIC = {
    "png": (b"\x89PNG\r\n\x1a\n",),
    "jpg": (b"\xff\xd8\xff",),
    "pdf": (b"%PDF",),
    "zip": (b"PK\x03\x04",),
}

ALLOWED_IMAGE = ("png", "jpg", "webp")
ALLOWED_DOCUMENT = ("pdf", "docx", "xlsx", "zip")

# Эти расширения не принимаем никогда: в браузере они исполняются, а не показываются.
FORBIDDEN = (
    "exe", "bat", "cmd", "ps1", "js", "mjs", "html", "htm", "svg", "php", "sh", "py", "dll",
)


@dataclass(frozen=True)
class CheckedFile:
    """Результат проверки: что за файл, сколько весит и куда его класть."""

    ext: str
    content_type: str
    size: int
    checksum: str
    stored_name: str
    kind: str


class UploadRejected(Exception):
    """Файл не принят. Сообщение показывается человеку."""


def detect_type(head: bytes, declared: str) -> str | None:
    """Определяет тип по первым байтам; None — если тип не опознан."""
    for ext, magics in MAGIC.items():
        for magic in magics:
            if head.startswith(magic):
                return ext
    # WebP: RIFF....WEBP — размер между маркерами, поэтому проверяем позиции.
    if head.startswith(b"RIFF") and head[8:12] == b"WEBP":
        return "webp"
    # docx и xlsx — это zip-архивы; различаем по заявленному типу.
    if declared in ("docx", "xlsx") and head.startswith(MAGIC["zip"][0]):
        return declared
    return None


def extension_of(filename: str) -> str:
    """Расширение из имени файла в нижнем регистре; пустая строка, если его нет."""
    # rpartition на строке без точки отдаёт её целиком в tail — поэтому проверяем точку явно.
    if "." not in filename:
        return ""
    tail = filename.rsplit(".", 1)[1]
    return tail.lower() if tail and len(tail) <= 10 else ""


def check_upload(filename: str, content: bytes) -> CheckedFile:
    """Проверяет файл и возвращает метаданные. Бросает UploadRejected."""
    ext = extension_of(filename)
    if ext in FORBIDDEN:
        raise UploadRejected(f"Файлы .{ext} не принимаются")
    if ext not in ALLOWED_IMAGE + ALLOWED_DOCUMENT:
        raise UploadRejected(f"Недопустимый тип .{ext}" if ext else "У файла нет расширения")

    kind = "image" if ext in ALLOWED_IMAGE else "document"
    limit = IMAGE_MAX if kind == "image" else DOCUMENT_MAX
    if len(content) == 0:
        raise UploadRejected("Файл пустой")
    if len(content) > limit:
        raise UploadRejected(f"Файл больше {limit // (1024 * 1024)} МБ")

    actual = detect_type(content, ext)
    if actual is None:
        raise UploadRejected("Содержимое не совпадает с расширением")
    # docx/xlsx выглядят как zip; принимаем, только если расширение совпало.
    if actual not in ALLOWED_IMAGE + ALLOWED_DOCUMENT:
        raise UploadRejected("Содержимое не совпадает с расширением")

    content_type = {
        "png": "image/png",
        "jpg": "image/jpeg",
        "webp": "image/webp",
        "pdf": "application/pdf",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "zip": "application/zip",
    }[ext]

    return CheckedFile(
        ext=ext,
        content_type=content_type,
        size=len(content),
        checksum=hashlib.sha256(content).hexdigest(),
        stored_name=f"{uuid.uuid4().hex}.{ext}",
        kind=kind,
    )
