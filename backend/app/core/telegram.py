"""Уведомления о новых заявках в Telegram.

Манифест: docs/manifests/telegram-notifications.md

Главное правило: сбой Telegram никогда не ломает приём заявки. Заявка к этому моменту
уже сохранена, поэтому ошибку отправки пишем в лог и забываем.
"""

import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# Таймаут короткий: пользователь не должен ждать, пока Telegram ответит.
TIMEOUT_SECONDS = 5.0


def is_configured() -> bool:
    """Настроены ли и токен, и получатель. Без обоих слать некуда."""
    return bool(settings.telegram_bot_token and settings.telegram_chat_id)


def _build_message(lead) -> str:
    """Текст сообщения. Пустые поля пропускаем: «Задача: » без значения выглядит как сбой."""
    lines = ["🔔 Новая заявка с сайта", f"Имя: {lead.name}", f"Контакт: {lead.contact_value}"]
    if lead.task_type:
        lines.append(f"Задача: {lead.task_type}")
    if lead.message:
        lines.append(f"Сообщение: {lead.message}")
    if lead.source_page:
        lines.append(f"Страница: {lead.source_page}")
    return "\n".join(lines)


async def notify_new_lead(lead) -> bool:
    """Отправляет уведомление. Возвращает True при успехе.

    Никогда не бросает исключение: вызывающий код не должен зависеть от Telegram.
    parse_mode намеренно не задан — текст от посторонних людей не должен
    разбираться как разметка.
    """
    if not is_configured():
        return False

    url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"
    payload = {"chat_id": settings.telegram_chat_id, "text": _build_message(lead)}

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
            response = await client.post(url, json=payload)
        if response.status_code != 200:
            # Тело ответа Telegram не логируем целиком: там может быть токен в описании ошибки.
            logger.warning("Telegram отклонил уведомление: статус %s", response.status_code)
            return False
        return True
    except Exception as exc:  # noqa: BLE001 - уведомление не должно ронять приём заявки
        logger.warning("Не удалось отправить уведомление в Telegram: %s", type(exc).__name__)
        return False
