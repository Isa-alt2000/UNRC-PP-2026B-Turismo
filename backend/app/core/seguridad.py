"""Protección de las rutas que modifican datos."""

from secrets import compare_digest
from typing import Annotated

from fastapi import Depends
from fastapi.security import APIKeyHeader

from app.core.config import settings
from app.core.exceptions import NoAutorizado


encabezado_api_key = APIKeyHeader(
    name="X-API-Key",
    auto_error=False,
    description="Llave de administración definida en ADMIN_API_KEY.",
)


def requiere_api_key(
    api_key: Annotated[str | None, Depends(encabezado_api_key)],
) -> None:
    """Deja pasar solo a quien envía la llave correcta en el encabezado X-API-Key."""
    esperada = settings.admin_api_key.get_secret_value()
    # compare_digest tarda lo mismo acierte o no, para no revelar la llave por tiempos.
    if api_key is None or not compare_digest(api_key.encode(), esperada.encode()):
        raise NoAutorizado("Falta la llave de administración o no es válida")


RequiereApiKey = Depends(requiere_api_key)
