"""Точка входа FastAPI: публичный API сайта. Префикс API — /api/v1 (ТЗ раздел 13)."""

from fastapi import FastAPI
from sqlalchemy import text

from app.api import (
    admin,
    admin_content,
    admin_reviews,
    admin_seo,
    admin_services,
    admin_uploads,
    auth,
    leads,
    public,
)
from app.core.config import settings
from app.db.session import engine

app = FastAPI(title=settings.app_name, docs_url="/api/v1/docs", redoc_url=None, openapi_url="/api/v1/openapi.json")
app.include_router(public.router)
app.include_router(leads.router)
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(admin_services.router)
app.include_router(admin_seo.router)
app.include_router(admin_content.router)
app.include_router(admin_reviews.router)
app.include_router(admin_uploads.router)


@app.get("/api/v1/health")
def health() -> dict[str, str]:
    """Liveness-проба: не раскрывает конфигурацию, только факт работоспособности."""
    return {"status": "ok", "service": "alyaev-it-backend"}


@app.get("/api/v1/ready")
def ready() -> dict[str, str]:
    """Readiness-проба: проверяет доступность базы данных."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception:
        return {"status": "degraded", "database": "unavailable"}
    return {"status": "ready", "database": "ok"}


@app.get("/api/health")
def health_legacy() -> dict[str, str]:
    """Старый адрес для Docker healthcheck; новый — /api/v1/health."""
    return {"status": "ok", "service": "alyaev-it-backend"}