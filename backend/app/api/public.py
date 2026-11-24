"""Публичный API сайта: каталог услуг, настройки, SEO."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_session
from app.repo import public_data

router = APIRouter(prefix="/api/v1/public", tags=["public"])


def _service_card(service) -> dict:
    """Карточка услуги для списков: без тяжёлых полей."""
    return {
        "slug": service.slug,
        "title": service.title,
        "short_description": service.short_description,
        "price_from": service.price_from,
        "price_currency": service.price_currency,
        "price_on_request": service.price_on_request,
        "duration_text": service.duration_text,
        "examples": service.examples,
        "category_slug": service.category.slug if service.category else None,
        "category_title": service.category.title if service.category else None,
    }


def _service_full(service) -> dict:
    """Полная карточка услуги для посадочной страницы."""
    data = _service_card(service)
    data.update(
        {
            "body_md": service.body_md,
            "show_problems": service.show_problems,
            "included": service.included,
            "excluded": service.excluded,
            "client_data": service.client_data,
            "extra_costs": service.extra_costs,
            "warranty_text": service.warranty_text,
            "faq": service.faq,
        }
    )
    return data


@router.get("/categories")
def categories(session: Session = Depends(get_session)) -> list[dict]:
    """Категории услуг с количеством опубликованных услуг."""
    result = []
    for category in public_data.list_categories(session):
        result.append(
            {
                "slug": category.slug,
                "title": category.title,
                "short_description": category.short_description,
            }
        )
    return result


@router.get("/services")
def services(session: Session = Depends(get_session)) -> list[dict]:
    """Все опубликованные услуги в виде карточек."""
    return [_service_card(s) for s in public_data.list_published_services(session)]




# Алиасы URL из ТЗ v1.0 (раздел 3): часть посадочных страниц — подгруппы внутри категории.
# Мастер-список: docs/manifests/url-structure.md. Правка здесь = правка ТЗ.
TZ_PAGE_ALIASES: dict[str, dict] = {
    "ai-assistants": {
        "title": "AI-ассистенты для автоматизации бизнеса",
        "short_description": "Консультанты по товарам и услугам, передача сложных вопросов менеджеру, ответы с опорой на знания компании.",
        "service_slugs": ["ai-consultant-bot"],
    },
    "knowledge-base": {
        "title": "AI-бот с базой знаний по документам",
        "short_description": "Поиск по инструкциям, регламентам и прайсам с ответами и ссылками на источники.",
        "service_slugs": ["knowledge-base-bot"],
    },
}


@router.get("/categories/{slug}")
def category_detail(slug: str, session: Session = Depends(get_session)) -> dict:
    """Категория услуг с её опубликованными услугами; 404 если нет."""
    category = public_data.get_category_by_slug(session, slug)
    if category is None:
        alias = TZ_PAGE_ALIASES.get(slug)
        if alias is None:
            raise HTTPException(status_code=404, detail="Категория не найдена")
        wanted = set(alias["service_slugs"])
        items = [s for s in public_data.list_published_services(session) if s.slug in wanted]
        return {
            "slug": slug,
            "title": alias["title"],
            "short_description": alias["short_description"],
            "services": [_service_card(s) for s in items],
        }
    items = [s for s in public_data.list_published_services(session) if s.category and s.category.slug == slug]
    return {
        "slug": category.slug,
        "title": category.title,
        "short_description": category.short_description,
        "services": [_service_card(s) for s in items],
    }


@router.get("/services/{slug}")
def service_detail(slug: str, session: Session = Depends(get_session)) -> dict:
    """Полная услуга по слагу; 404 для черновиков и несуществующих."""
    service = public_data.get_service_by_slug(session, slug)
    if service is None:
        raise HTTPException(status_code=404, detail="Услуга не найдена")
    return _service_full(service)


@router.get("/reviews")
def reviews(session: Session = Depends(get_session)) -> list[dict]:
    """Опубликованные отзывы с согласием автора. Пустой список, если таких нет."""
    rows = public_data.list_public_reviews(session)
    return [
        {
            "author_name": row.author_name,
            "author_position": row.author_position,
            "text": row.text,
            "project_title": row.project_title,
            "published_at": row.published_at.isoformat() if row.published_at else None,
        }
        for row in rows
    ]


@router.get("/calculator")
def calculator(session: Session = Depends(get_session)) -> dict:
    """Конфиг калькулятора: услуги с ценами, опции и коэффициенты. Пустой список = калькулятор не работает."""
    config = public_data.get_calculator_config(session)
    return {
        "services": [
            {"slug": row.slug, "title": row.title, "price_from": row.price_from}
            for row in config["services"]
        ],
        "options": [
            {"slug": row.slug, "title": row.title, "price_delta": row.price_delta}
            for row in config["options"]
        ],
        "complexity": [
            {"slug": row.slug, "title": row.title, "factor": float(row.factor)}
            for row in config["complexity"]
        ],
    }


@router.get("/settings")
def settings(session: Session = Depends(get_session)) -> dict[str, dict]:
    """Публичные настройки сайта (контакты и т.п.)."""
    return public_data.list_settings(session)