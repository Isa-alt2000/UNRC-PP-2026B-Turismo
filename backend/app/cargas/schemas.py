"""Formato de cada fila de los CSV de datos_iniciales"""

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

from app.models.hoteles import TAMANOS_HOTEL
from app.recintos.schemas import Latitud, Longitud, RecintoCrear, Texto


class PuntoPartidaCarga(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: Annotated[str, StringConstraints(pattern=r"^[a-z_]+$")]
    nombre: Texto
    latitud: Latitud
    longitud: Longitud
    orden: int = Field(ge=1)


class RecintoCarga(RecintoCrear):
    """Lo mismo que se pide en POST /recintos, más el id para conservar las claves R0001…"""

    id: int = Field(ge=1)


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
