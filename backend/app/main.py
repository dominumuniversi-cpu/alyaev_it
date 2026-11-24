"""Точка входа FastAPI: публичный API сайта."""

from fastapi import FastAPI

from app.api import admin, admin_services, auth, leads, public
from app.core.config import settings

app = FastAPI(title=settings.app_name, docs_url=None, redoc_url=None, openapi_url=None)
app.include_router(public.router)
app.include_router(leads.router)
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(admin_services.router)


@app.get("/api/health")
def health() -> dict[str, str]:
    """Liveness-проба для Docker healthcheck и nginx."""
    return {"status": "ok", "service": "alyaev-it-backend"}