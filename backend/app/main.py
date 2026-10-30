from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.config import settings
from app.core.exceptions import registrar_manejadores
from app.core.logging import configurar_logging


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    configurar_logging(settings.log_level, settings.log_file)
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)
registrar_manejadores(app)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    """Comprueba que la API responde."""
    return {"status": "ok"}
