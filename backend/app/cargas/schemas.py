"""Formato de cada fila de los CSV de datos_iniciales"""

import re
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator

from app.models.hoteles import TAMANOS_HOTEL
from app.recintos.schemas import (
    PATRON_CLAVE,
    Latitud,
    Longitud,
    RecintoCrear,
    Texto,
    a_numero,
)


class PuntoPartidaCarga(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: Annotated[str, StringConstraints(pattern=r"^[a-z_]+$")]
    nombre: Texto
    latitud: Latitud
    longitud: Longitud
    orden: int = Field(ge=1)


BOOLEANOS_HOJA = {"verdadero": True, "falso": False, "true": True, "false": False}


class RecintoCarga(RecintoCrear):
    """Lo mismo que se pide en POST /recintos, más el id para conservar las claves R0001…

    Acepta el CSV exportado tal cual de Google Sheets: id como R0001 y casillas como
    VERDADERO/FALSO (o TRUE/FALSE si la hoja está en inglés)."""

    id: int = Field(ge=1)

    @field_validator("id", mode="before")
    @classmethod
    def clave_a_numero(cls, valor: object) -> object:
        if isinstance(valor, str) and re.fullmatch(PATRON_CLAVE, valor.strip()):
            return a_numero(valor.strip())
        return valor

    @field_validator("es_apto_dependientes", mode="before")
    @classmethod
    def casilla_de_la_hoja(cls, valor: object) -> object:
        if isinstance(valor, str):
            return BOOLEANOS_HOJA.get(valor.strip().lower(), valor)
        return valor


class HotelCarga(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: int = Field(ge=1)
    nombre: Texto
    tipo: Texto
    codigo_scian: int = Field(ge=721000, le=721999)
    tamano: Literal[TAMANOS_HOTEL]  # type: ignore[valid-type]
    telefono: Annotated[str, StringConstraints(pattern=r"^\d{10}$")] | None = None
    sitio_web: Annotated[str, StringConstraints(pattern=r"^https?://\S+$")] | None = None
    direccion: str | None = None
    localidad: Texto
    municipio: Texto
    latitud: Latitud
    longitud: Longitud
