"""Публичный API сайта: каталог услуг, настройки, SEO."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_session
from app.repo import public_data

router = APIRouter(prefix="/api", tags=["public"])


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


@router.get("/services/{slug}")
def service_detail(slug: str, session: Session = Depends(get_session)) -> dict:
    """Полная услуга по слагу; 404 для черновиков и несуществующих."""
    service = public_data.get_service_by_slug(session, slug)
    if service is None:
        raise HTTPException(status_code=404, detail="Услуга не найдена")
    return _service_full(service)


@router.get("/settings")
def settings(session: Session = Depends(get_session)) -> dict[str, dict]:
    """Публичные настройки сайта (контакты и т.п.)."""
    return public_data.list_settings(session)
