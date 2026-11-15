"""Alojamientos cerca de un punto, con prioridad a los negocios locales.

Búsqueda en dos pasos, para no calcular distancias contra toda la tabla:
1. La base filtra un recuadro de latitud y longitud alrededor del punto (usa el índice).
2. Con los candidatos se calcula la distancia exacta (haversine) y se descartan las esquinas del
   recuadro que quedan fuera del círculo.

Si dentro de RADIO_KM hay menos de MINIMO alojamientos, se busca otra vez con RADIO_AMPLIADO_KM.

Selección con cuota: de los MAXIMO que se muestran, hasta CUOTA_LOCALES son los micro o pequeños
más cercanos; el resto, los más cercanos de cualquier tamaño. La lista final va por distancia real:
la cuota decide quién entra, no altera el orden ni las distancias.
"""

import logging
import math

from sqlmodel import Session, col, select

from app.hoteles.schemas import HotelCercano
from app.itinerarios.rutas import km_en_linea_recta
from app.models import Hotel

log = logging.getLogger(__name__)

RADIO_KM = 10
RADIO_AMPLIADO_KM = 25
MINIMO = 3
MAXIMO = 5
CUOTA_LOCALES = 3
TAMANOS_LOCALES = ("micro", "pequena")
KM_POR_GRADO = 111.32


def en_radio(
    session: Session, latitud: float, longitud: float, radio_km: float
) -> list[tuple[float, Hotel]]:
    """Alojamientos a radio_km o menos del punto, del más cercano al más lejano."""
    delta_lat = radio_km / KM_POR_GRADO
    delta_lon = radio_km / (KM_POR_GRADO * math.cos(math.radians(latitud)))
    candidatos = session.exec(
        select(Hotel).where(
            col(Hotel.latitud).between(latitud - delta_lat, latitud + delta_lat),
            col(Hotel.longitud).between(longitud - delta_lon, longitud + delta_lon),
        )
    ).all()
    con_distancia = [
        (km_en_linea_recta((longitud, latitud), (hotel.longitud, hotel.latitud)), hotel)
        for hotel in candidatos
    ]
    return sorted((par for par in con_distancia if par[0] <= radio_km), key=lambda par: par[0])


def seleccionar(cercanos: list[tuple[float, Hotel]]) -> list[tuple[float, Hotel]]:
    """Hasta CUOTA_LOCALES locales más cercanos y el resto por cercanía; todo ordenado por distancia."""
    locales = [par for par in cercanos if par[1].tamano in TAMANOS_LOCALES][:CUOTA_LOCALES]
    elegidos = {par[1].id for par in locales}
    resto = [par for par in cercanos if par[1].id not in elegidos][: MAXIMO - len(locales)]
    return sorted(locales + resto, key=lambda par: par[0])


def hoteles_cercanos(
    session: Session, latitud: float, longitud: float
) -> tuple[list[HotelCercano], int]:
    """Los alojamientos a mostrar cerca del punto y el radio con el que se encontraron."""
    radio = RADIO_KM
    cercanos = en_radio(session, latitud, longitud, radio)
    if len(cercanos) < MINIMO:
        radio = RADIO_AMPLIADO_KM
        cercanos = en_radio(session, latitud, longitud, radio)

    seleccion = seleccionar(cercanos)
    log.info(
        f"hoteles_cercanos radio_km={radio} candidatos={len(cercanos)} mostrados={len(seleccion)} "
        f"locales={sum(1 for _, h in seleccion if h.tamano in TAMANOS_LOCALES)}"
    )
    return [
        HotelCercano(
            id=hotel.id,
            nombre=hotel.nombre,
            tipo=hotel.tipo,
            tamano=hotel.tamano,  # type: ignore[arg-type]
            es_local=hotel.tamano in TAMANOS_LOCALES,
            distancia_km=round(distancia, 1),
            telefono=hotel.telefono,
            sitio_web=hotel.sitio_web,
            direccion=hotel.direccion,
            latitud=hotel.latitud,
            longitud=hotel.longitud,
        )
        for distancia, hotel in seleccion
    ], radio
