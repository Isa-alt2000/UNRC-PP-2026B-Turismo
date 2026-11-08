from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import api_router
from app.core.config import settings
from app.core.exceptions import registrar_manejadores
from app.core.logging import configurar_logging
from app.recintos.imagenes import CARPETA_STATIC


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    configurar_logging(settings.log_level, settings.log_file)
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
# Imágenes de los recintos. Bajo el prefijo de la API para que el proxy del frontend las reenvíe.
app.mount(
    f"{settings.api_prefix}/static",
    StaticFiles(directory=CARPETA_STATIC, check_dir=False),
    name="static",
)
registrar_manejadores(app)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    """Comprueba que la API responde."""
    return {"status": "ok"}
