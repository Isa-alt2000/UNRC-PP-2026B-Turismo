import json
from collections.abc import Callable

import httpx
import pytest

from app.itinerarios.rutas import ClienteORS, ErrorRutas, LineaRecta, km_en_linea_recta

MORELIA = (-101.2092, 19.71094)
PATZCUARO = (-101.61304, 19.51134)
URUAPAN = (-102.05194, 19.42443)


def cliente(responder: Callable[[httpx.Request], httpx.Response]) -> tuple[ClienteORS, list]:
    """Cliente cuyas peticiones contesta responder; devuelve también la lista de peticiones."""
    peticiones: list[httpx.Request] = []

    def manejar(peticion: httpx.Request) -> httpx.Response:
        peticiones.append(peticion)
        return responder(peticion)

    return ClienteORS("llave", "https://ors.test", 5, httpx.MockTransport(manejar)), peticiones


# Línea recta

def test_haversine_morelia_patzcuaro() -> None:
    # Unos 47 km en línea recta según cualquier mapa.
    assert km_en_linea_recta(MORELIA, PATZCUARO) == pytest.approx(47, abs=2)


def test_linea_recta_alarga_la_distancia_y_estima_minutos() -> None:
    matriz = LineaRecta().matriz([MORELIA, PATZCUARO])

    assert matriz.km[0][0] == 0
    assert matriz.km[0][1] > km_en_linea_recta(MORELIA, PATZCUARO)
    assert matriz.minutos[0][1] == pytest.approx(matriz.km[0][1] / 50 * 60)


def test_linea_recta_une_cada_par_de_puntos() -> None:
    assert LineaRecta().tramos([MORELIA, PATZCUARO, URUAPAN]) == [
        [MORELIA, PATZCUARO],
        [PATZCUARO, URUAPAN],
    ]


# OpenRouteService: matriz

def test_matriz_convierte_segundos_a_minutos() -> None:
    ors, peticiones = cliente(
        lambda _: httpx.Response(
            200, json={"distances": [[0, 55.2], [55.4, 0]], "durations": [[0, 3000], [3060, 0]]}
        )
    )

    matriz = ors.matriz([MORELIA, PATZCUARO])

    assert matriz.km == [[0, 55.2], [55.4, 0]]
    assert matriz.minutos == [[0, 50], [51, 0]]
    cuerpo = json.loads(peticiones[0].content)
    assert peticiones[0].url.path == "/v2/matrix/driving-car"
    assert peticiones[0].headers["Authorization"] == "llave"
    assert cuerpo["locations"] == [list(MORELIA), list(PATZCUARO)]
    assert cuerpo["units"] == "km"


def test_la_misma_matriz_se_pide_una_sola_vez() -> None:
    ors, peticiones = cliente(
        lambda _: httpx.Response(200, json={"distances": [[0, 1], [1, 0]], "durations": [[0, 60], [60, 0]]})
    )

    ors.matriz([MORELIA, PATZCUARO])
    ors.matriz([MORELIA, PATZCUARO])
    ors.matriz([PATZCUARO, MORELIA])

    # La tercera es otra combinación: sí se pide.
    assert len(peticiones) == 2


def test_matriz_sin_camino_es_error() -> None:
    ors, _ = cliente(
        lambda _: httpx.Response(200, json={"distances": [[0, None], [None, 0]], "durations": [[0, None], [None, 0]]})
    )
    with pytest.raises(ErrorRutas):
        ors.matriz([MORELIA, PATZCUARO])


@pytest.mark.parametrize(
    "respuesta",
    [
        httpx.Response(403, json={"error": "Access to this API has been disallowed"}),
        httpx.Response(429, json={"error": "Rate Limit Exceeded"}),
        httpx.Response(200, text="no es json"),
    ],
    ids=["llave-invalida", "cuota-agotada", "no-json"],
)
def test_errores_de_ors_son_error_de_rutas(respuesta: httpx.Response) -> None:
    ors, _ = cliente(lambda _: respuesta)
    with pytest.raises(ErrorRutas):
        ors.matriz([MORELIA, PATZCUARO])


def test_sin_conexion_es_error_de_rutas() -> None:
    def falla(peticion: httpx.Request) -> httpx.Response:
        raise httpx.ConnectTimeout("tardó demasiado", request=peticion)

    ors, _ = cliente(falla)
    with pytest.raises(ErrorRutas):
        ors.matriz([MORELIA, PATZCUARO])


def test_un_error_no_queda_en_cache() -> None:
    respuestas = iter(
        [
            httpx.Response(500),
            httpx.Response(200, json={"distances": [[0, 1], [1, 0]], "durations": [[0, 60], [60, 0]]}),
        ]
    )
    ors, peticiones = cliente(lambda _: next(respuestas))

    with pytest.raises(ErrorRutas):
        ors.matriz([MORELIA, PATZCUARO])
    ors.matriz([MORELIA, PATZCUARO])

    assert len(peticiones) == 2


# OpenRouteService: tramos

def direcciones(coordenadas: list[list[float]], way_points: list[int]) -> httpx.Response:
    return httpx.Response(
        200,
        json={
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {"type": "LineString", "coordinates": coordenadas},
                    "properties": {"way_points": way_points},
                }
            ],
        },
    )


def test_tramos_parte_la_linea_en_cada_punto_pedido() -> None:
    linea = [list(MORELIA), [-101.4, 19.6], list(PATZCUARO), [-101.8, 19.5], list(URUAPAN)]
    ors, peticiones = cliente(lambda _: direcciones(linea, [0, 2, 4]))

    tramos = ors.tramos([MORELIA, PATZCUARO, URUAPAN])

    assert tramos == [
        [MORELIA, (-101.4, 19.6), PATZCUARO],
        [PATZCUARO, (-101.8, 19.5), URUAPAN],
    ]
    assert peticiones[0].url.path == "/v2/directions/driving-car/geojson"
    assert json.loads(peticiones[0].content)["radiuses"] == [-1, -1, -1]


def test_tramos_con_formato_inesperado_es_error() -> None:
    ors, _ = cliente(lambda _: httpx.Response(200, json={"features": []}))
    with pytest.raises(ErrorRutas):
        ors.tramos([MORELIA, PATZCUARO])
