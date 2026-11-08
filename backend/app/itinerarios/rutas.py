"""
ClienteORS OpenRouteService, por carretera con caché en memoria
LineaRecta cálculo local y aproximado cuando OpenRouteService falla

Las coordenadas van como (longitud, latitud), el orden de GeoJSON y de OpenRouteService.
"""

import logging
import math
import time
from collections import OrderedDict
from collections.abc import Sequence
from dataclasses import dataclass
from functools import cache
from itertools import pairwise
from threading import Lock
from typing import Annotated, Any, ClassVar, Protocol

import httpx
from fastapi import Depends

from app.core.config import settings

log = logging.getLogger(__name__)

Coordenada = tuple[float, float]
Tramo = list[Coordenada]


@dataclass(frozen=True)
class Matriz:
    """km[i][j] y minutos[i][j] van del punto i al punto j."""

    km: list[list[float]]
    minutos: list[list[float]]


class ErrorRutas(Exception):
    """El proveedor no pudo calcular la ruta."""


class ProveedorRutas(Protocol):
    aproximado: ClassVar[bool]

    def matriz(self, puntos: Sequence[Coordenada]) -> Matriz:
        """Distancia y tiempo entre cada par de puntos."""
        ...

    def tramos(self, puntos: Sequence[Coordenada]) -> list[Tramo]:
        """La forma del camino entre cada par de puntos seguidos: n puntos dan n - 1 tramos."""
        ...


# Línea recta

RADIO_TIERRA_KM = 6371.0
# Las carreteras no van en línea recta: se alarga la distancia para acercarla a la real.
FACTOR_RODEO = 1.3
VELOCIDAD_KMH = 50.0


def km_en_linea_recta(a: Coordenada, b: Coordenada) -> float:
    """Distancia sobre la superficie de la Tierra (fórmula de haversine)."""
    lon1, lat1, lon2, lat2 = map(math.radians, (*a, *b))
    h = (
        math.sin((lat2 - lat1) / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    )
    return 2 * RADIO_TIERRA_KM * math.asin(math.sqrt(h))


class LineaRecta:
    aproximado: ClassVar[bool] = True

    def matriz(self, puntos: Sequence[Coordenada]) -> Matriz:
        km = [[km_en_linea_recta(a, b) * FACTOR_RODEO for b in puntos] for a in puntos]
        minutos = [[d / VELOCIDAD_KMH * 60 for d in fila] for fila in km]
        return Matriz(km=km, minutos=minutos)

    def tramos(self, puntos: Sequence[Coordenada]) -> list[Tramo]:
        return [[a, b] for a, b in pairwise(puntos)]


# OpenRouteService

PERFIL = "driving-car"
MAXIMO_EN_CACHE = 256
DECIMALES_CLAVE = 5  # 1.1 m


class ClienteORS:
    """Cliente de OpenRouteService. Guarda en memoria las respuestas para no repetir llamadas"""

    aproximado: ClassVar[bool] = False

    def __init__(
        self, llave: str, url: str, timeout: float, transport: httpx.BaseTransport | None = None
    ) -> None:
        # transport solo se pasa en pruebas, para responder sin salir a internet
        self._http = httpx.Client(
            base_url=url,
            timeout=timeout,
            headers={"Authorization": llave, "Content-Type": "application/json"},
            transport=transport,
        )
        self._cache: OrderedDict[tuple[Any, ...], Any] = OrderedDict()
        self._candado = Lock()

    def matriz(self, puntos: Sequence[Coordenada]) -> Matriz:
        datos = self._pedir(
            "matriz",
            f"/v2/matrix/{PERFIL}",
            puntos,
            {"locations": [list(p) for p in puntos], "metrics": ["distance", "duration"], "units": "km"},
        )
        km, segundos = datos.get("distances"), datos.get("durations")
        if not km or not segundos or any(v is None for fila in km + segundos for v in fila):
            raise ErrorRutas("matriz_sin_camino")
        return Matriz(km=km, minutos=[[s / 60 for s in fila] for fila in segundos])

    def tramos(self, puntos: Sequence[Coordenada]) -> list[Tramo]:
        datos = self._pedir(
            "tramos",
            f"/v2/directions/{PERFIL}/geojson",
            puntos,
            {
                "coordinates": [list(p) for p in puntos],
                # solo busca carretera a 350 m del punto. -1 quita el límite.
                "radiuses": [-1] * len(puntos),
            },
        )
        try:
            ruta = datos["features"][0]
            coordenadas = [(c[0], c[1]) for c in ruta["geometry"]["coordinates"]]
            # índice, dentro de coordenadas, de cada punto pedido
            paradas = ruta["properties"]["way_points"]
        except (KeyError, IndexError, TypeError) as error:
            raise ErrorRutas("direcciones_formato_inesperado") from error
        if len(paradas) != len(puntos):
            raise ErrorRutas("direcciones_puntos_incompletos")
        return [coordenadas[i : j + 1] for i, j in pairwise(paradas)]

    def _pedir(
        self, tipo: str, ruta: str, puntos: Sequence[Coordenada], cuerpo: dict[str, Any]
    ) -> Any:
        clave = (tipo, *((round(x, DECIMALES_CLAVE), round(y, DECIMALES_CLAVE)) for x, y in puntos))
        with self._candado:
            if clave in self._cache:
                self._cache.move_to_end(clave)
                log.info(f"ors_consulta tipo={tipo} puntos={len(puntos)} origen=cache")
                return self._cache[clave]

        inicio = time.perf_counter()
        try:
            respuesta = self._http.post(ruta, json=cuerpo)
        except httpx.HTTPError as error:
            log.warning(f"ors_sin_respuesta tipo={tipo} error={type(error).__name__} detalle={error}")
            raise ErrorRutas(f"ors_sin_respuesta error={type(error).__name__}") from error
        if respuesta.status_code != httpx.codes.OK:
            log.warning(
                f"ors_error tipo={tipo} status={respuesta.status_code} respuesta={respuesta.text[:300]}"
            )
            raise ErrorRutas(f"ors_status={respuesta.status_code}")
        try:
            datos = respuesta.json()
        except ValueError as error:
            raise ErrorRutas("ors_respuesta_no_json") from error

        segundos = time.perf_counter() - inicio
        log.info(f"ors_consulta tipo={tipo} puntos={len(puntos)} origen=api segundos={segundos:.2f}")
        with self._candado:
            self._cache[clave] = datos
            if len(self._cache) > MAXIMO_EN_CACHE:
                self._cache.popitem(last=False)  # se descarta el que lleva más tiempo sin usarse
        return datos


@cache
def proveedor_rutas() -> ProveedorRutas:
    """OpenRouteService si hay llave y si no, línea recta"""
    if settings.ors_api_key is None:
        log.warning("ors_api_key=ausente rutas=linea_recta")
        return LineaRecta()
    return ClienteORS(
        settings.ors_api_key.get_secret_value(), settings.ors_url, settings.ors_timeout
    )


ProveedorRutasDep = Annotated[ProveedorRutas, Depends(proveedor_rutas)]
