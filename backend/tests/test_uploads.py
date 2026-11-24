"""Тесты проверки загрузок. Манифест: docs/manifests/uploads.md"""

import pytest

from app.core.uploads import (
    DOCUMENT_MAX,
    IMAGE_MAX,
    UploadRejected,
    check_upload,
    detect_type,
    extension_of,
)

PNG_HEAD = b"\x89PNG\r\n\x1a\n"
PDF_HEAD = b"%PDF-1.7\n"


def test_extension_parsing():
    """Расширение берётся в нижнем регистре; без точки — пустое."""
    assert extension_of("photo.PNG") == "png"
    assert extension_of("noext") == ""
    assert extension_of("a.b.jpeg") == "jpeg"


def test_forbidden_never_accepted():
    """Исполняемые в браузере файлы не принимаем никогда."""
    for name in ("virus.exe", "run.bat", "x.ps1", "page.html", "pic.svg", "s.js"):
        with pytest.raises(UploadRejected):
            check_upload(name, PNG_HEAD + b"x" * 100)


def test_svg_rejected_even_with_png_bytes():
    """Расширение важнее содержимого: .svg с байтами PNG всё равно отказ."""
    with pytest.raises(UploadRejected):
        check_upload("pic.svg", PNG_HEAD + b"x" * 100)


def test_real_png_accepted():
    """Настоящий PNG принимается, имя на диске генерируется."""
    checked = check_upload("photo.png", PNG_HEAD + b"data" * 10)
    assert checked.ext == "png"
    assert checked.kind == "image"
    assert checked.content_type == "image/png"
    assert checked.stored_name.endswith(".png")
    assert "photo" not in checked.stored_name


def test_renamed_executable_rejected():
    """EXE, переименованный в PNG, не пройдёт: байты не сходятся."""
    with pytest.raises(UploadRejected):
        check_upload("virus.png", b"MZ\x90\x00\x03" + b"\x00" * 100)


def test_pdf_accepted_as_document():
    """PDF — документ, а не картинка."""
    checked = check_upload("doc.pdf", PDF_HEAD + b"body")
    assert checked.kind == "document"
    assert checked.content_type == "application/pdf"


def test_empty_and_oversized():
    """Пустой файл и файл сверх лимита отклоняются."""
    with pytest.raises(UploadRejected):
        check_upload("a.png", b"")
    with pytest.raises(UploadRejected):
        check_upload("big.png", PNG_HEAD + b"x" * (IMAGE_MAX + 1))


def test_image_and_document_limits_differ():
    """Картинка ограничена 5 МБ, документ — 20 МБ."""
    assert IMAGE_MAX == 5 * 1024 * 1024
    assert DOCUMENT_MAX == 20 * 1024 * 1024
    # 6 МБ картинкой быть не может, документом — может.
    with pytest.raises(UploadRejected):
        check_upload("big.png", PNG_HEAD + b"x" * (6 * 1024 * 1024))


def test_detect_type_webp():
    """WebP узнаётся по RIFF на 0 и WEBP на 8."""
    assert detect_type(b"RIFF\x00\x00\x00\x00WEBPVP8 ", "") == "webp"


def test_checksum_stable():
    """Хеш зависит от содержимого: одинаковые байты — одинаковый хеш."""
    a = check_upload("a.png", PNG_HEAD + b"same")
    b = check_upload("b.png", PNG_HEAD + b"same")
    assert a.checksum == b.checksum
    # А имена на диске разные — файлы не перезапишут друг друга.
    assert a.stored_name != b.stored_name
