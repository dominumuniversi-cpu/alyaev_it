"""Точка входа FastAPI: публичный API сайта."""

from fastapi import FastAPI

from app.core.config import settings

app = FastAPI(title=settings.app_name, docs_url=None, redoc_url=None, openapi_url=None)


@app.get("/api/health")
def health() -> dict[str, str]:
    """Liveness-проба для Docker healthcheck и nginx."""
    return {"status": "ok", "service": "alyaev-it-backend"}
