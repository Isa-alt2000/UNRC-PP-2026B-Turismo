from fastapi import APIRouter

from app.core.config import settings
from app.gustos.router import router as gustos_router
from app.recintos.router import router as recintos_router
from app.recomendaciones.router import router as recomendaciones_router

api_router = APIRouter(prefix=settings.api_prefix)
api_router.include_router(gustos_router)
api_router.include_router(recintos_router)
api_router.include_router(recomendaciones_router)
