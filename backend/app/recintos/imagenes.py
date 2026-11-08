"""Imagen de referencia de cada recinto, buscada por convención y no guardada en la base.

La imagen de R0002 es static/recintos/R0002 con extensión .webp, .png o .jpg. Si hay varias, se
toma la primera en ese orden: así un .webp optimizado gana sobre el .jpg original. Para agregar
o cambiar una imagen basta con copiar el archivo; no hay migración.

Los créditos van en static/recintos/creditos.json, opcional:

    {"R0002": "Foto: Nombre del autor, CC BY-SA 4.0, Wikimedia Commons"}
"""

import json
import logging
from typing import Literal

from pydantic import BaseModel

from app.core.config import BACKEND, settings

log = logging.getLogger(__name__)

CARPETA_STATIC = BACKEND / "static"
CARPETA = CARPETA_STATIC / "recintos"
# Orden de preferencia cuando un recinto tiene la imagen en varios formatos.
EXTENSIONES = (".webp", ".png", ".jpg", ".jpeg")
ARCHIVO_CREDITOS = "creditos.json"


class Imagen(BaseModel):
    url: str
    credito: str | None


SinImagen = Literal["sin_imagen"]


def leer_creditos() -> dict[str, str]:
    """Créditos por clave. Si el archivo falta o está mal escrito, no hay créditos."""
    ruta = CARPETA / ARCHIVO_CREDITOS
    if not ruta.exists():
        return {}
    try:
        creditos = json.loads(ruta.read_text(encoding="utf-8"))
    except (OSError, ValueError) as error:
        log.warning(f"creditos_imagenes valido=false error={error}")
        return {}
    if not isinstance(creditos, dict):
        log.warning("creditos_imagenes valido=false error=no_es_objeto")
        return {}
    return {clave: texto for clave, texto in creditos.items() if isinstance(texto, str)}


def imagen_de(clave: str, creditos: dict[str, str]) -> Imagen | SinImagen:
    """La imagen del recinto con esa clave, o sin_imagen si no hay archivo.

    La clave ya viene validada como RXXXX, así que no puede salirse de la carpeta.
    """
    for extension in EXTENSIONES:
        archivo = CARPETA / f"{clave}{extension}"
        if archivo.is_file():
            return Imagen(
                url=f"{settings.api_prefix}/static/recintos/{archivo.name}",
                credito=creditos.get(clave),
            )
    return "sin_imagen"
