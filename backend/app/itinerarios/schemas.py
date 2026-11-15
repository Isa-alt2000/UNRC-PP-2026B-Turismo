from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, StringConstraints

from app.hoteles.schemas import HotelCercano
from app.puntos_partida.schemas import PuntoPartidaPublico
from app.recintos.imagenes import Imagen, SinImagen
from app.recintos.schemas import PATRON_CLAVE
from app.recomendaciones.schemas import Gustos

# El mismo máximo que la pantalla de recomendaciones.
MAXIMO_RECINTOS = 4

ClaveRecinto = Annotated[str, StringConstraints(pattern=PATRON_CLAVE)]


def sin_repetidos(claves: list[str]) -> list[str]:
    if len(set(claves)) != len(claves):
        raise ValueError("no se puede repetir un recinto")
    return claves


class SolicitudItinerario(BaseModel):
    """desde dónde sale turista hasta qué lugares visita y sus gustos."""

    model_config = ConfigDict(extra="forbid")

    salida: str = Field(examples=["morelia"], description="Clave del punto de partida")
    recintos: Annotated[
        list[ClaveRecinto],
        Field(min_length=1, max_length=MAXIMO_RECINTOS, examples=[["R0001", "R0011"]]),
        AfterValidator(sin_repetidos),
    ]
    gustos: Gustos


class Trazo(BaseModel):
    """Forma del camino en GeoJSON [longitud, latitud]."""

    type: Literal["LineString"] = "LineString"
    coordinates: list[tuple[float, float]]


class Parada(BaseModel):
    orden: int = Field(description="Posición en todo el viaje, empezando en 1")
    id: str = Field(examples=["R0011"])
    nombre: str
    descripcion: str | None
    imagen: Imagen | SinImagen = Field(
        description="Foto de referencia con su crédito, o sin_imagen si el recinto no tiene"
    )
    latitud: float
    longitud: float
    km_desde_anterior: float = Field(description="Desde la parada anterior o el punto de partida")
    minutos_traslado: int
    minutos_visita: int = Field(description="Estimados por el modelo de minutos")


class TotalesDia(BaseModel):
    km: float
    minutos_traslado: int
    minutos_visita: int
    minutos_jornada: int = Field(description="Traslados más visitas")


class Dia(BaseModel):
    dia: int
    paradas: list[Parada]
    trazo: Trazo
    totales: TotalesDia
    excede_jornada: bool = Field(
        description="El día pasa del límite, solo ocurre con un lugar que por sí solo no cabe"
    )
    hoteles: list[HotelCercano] = Field(
        description="Hasta 5 alojamientos cerca de la última parada, por distancia; al menos 3 "
        "son negocios locales cuando los hay"
    )
    radio_hoteles_km: int = Field(
        description="10, o 25 si a 10 km había menos de 3 alojamientos"
    )


class Totales(BaseModel):
    km: float
    minutos_traslado: int
    minutos_visita: int
    dias: int


class Itinerario(BaseModel):
    aproximada: bool = Field(
        description="true si los km y el trazo son en línea recta porque falló la API de rutas"
    )
    salida: PuntoPartidaPublico
    minutos_por_dia: int = Field(description="Límite de la jornada con el que se repartió")
    dias: list[Dia]
    totales: Totales
