from typing import Literal

from pydantic import BaseModel, Field

Tamano = Literal["micro", "pequena", "mediana", "grande"]


class HotelCercano(BaseModel):
    """Un alojamiento cerca de la última parada de un día."""

    id: int
    nombre: str
    tipo: str = Field(examples=["Hotel", "Casa de huéspedes"])
    tamano: Tamano
    es_local: bool = Field(description="Micro o pequeña empresa: se muestra como negocio local")
    distancia_km: float = Field(description="En línea recta desde la parada")
    telefono: str | None
    sitio_web: str | None
    direccion: str | None
    latitud: float
    longitud: float
