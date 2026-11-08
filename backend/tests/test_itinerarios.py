from collections.abc import Iterator, Sequence
from dataclasses import dataclass, field
from itertools import pairwise
from typing import Any, ClassVar

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.itinerarios.rutas import (
    Coordenada,
    ErrorRutas,
    LineaRecta,
    Matriz,
    Tramo,
    proveedor_rutas,
)
from app.main import app
from app.ml.modelo_minutos import (
    VARIABLES,
    ArtefactoInvalido,
    leer_modelo,
    modelo_minutos,
)
from app.models import PuntoPartida, Recinto, RecintoValores
from app.models.recintos import CODIGOS_GUSTOS

URL = f"{settings.api_prefix}/itinerarios"
GUSTOS = {codigo: 3 for codigo in CODIGOS_GUSTOS}


@dataclass
class ModeloFalso:
    """Devuelve los minutos indicados, en el orden en que recibe los recintos."""

    respuestas: list[float]
    filas: list[dict[str, float]] = field(default_factory=list)

    def minutos(self, filas: list[dict[str, float]]) -> list[float]:
        self.filas = filas
        return self.respuestas[: len(filas)]


class PorCarretera:
    """Proveedor falso: los números de línea recta, pero marcados como exactos."""

    aproximado: ClassVar[bool] = False

    def __init__(self) -> None:
        self.llamadas: list[str] = []

    def matriz(self, puntos: Sequence[Coordenada]) -> Matriz:
        self.llamadas.append("matriz")
        return LineaRecta().matriz(puntos)

    def tramos(self, puntos: Sequence[Coordenada]) -> list[Tramo]:
        self.llamadas.append("tramos")
        # un punto intermedio por tramo, para distinguirlo de la línea recta
        return [[a, ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2), b] for a, b in pairwise(puntos)]


class Caido(PorCarretera):
    def matriz(self, puntos: Sequence[Coordenada]) -> Matriz:
        raise ErrorRutas("sin conexión")


class SinTrazo(PorCarretera):
    def tramos(self, puntos: Sequence[Coordenada]) -> list[Tramo]:
        raise ErrorRutas("sin conexión")


@pytest.fixture
def catalogo(db: Session) -> None:
    db.add(PuntoPartida(id="morelia", nombre="Morelia", latitud=19.71094, longitud=-101.2092, orden=1))
    # R0001 Pátzcuaro, R0002 Uruapan, R0003 Tzintzuntzan
    for nombre, latitud, longitud in [
        ("Pátzcuaro", 19.51134, -101.61304),
        ("Uruapan", 19.42443, -102.05194),
        ("Tzintzuntzan", 19.62847, -101.57794),
    ]:
        recinto = Recinto(nombre=nombre, latitud=latitud, longitud=longitud, tamano=2)
        recinto.valores = RecintoValores(**{codigo: 2 for codigo in CODIGOS_GUSTOS})
        db.add(recinto)
    db.commit()


@pytest.fixture
def usar(catalogo: None) -> Iterator[Any]:
    """Fija el modelo de minutos y el proveedor de rutas de la prueba."""

    def fijar(minutos: list[float], rutas: PorCarretera | None = None) -> tuple[ModeloFalso, PorCarretera]:
        modelo = ModeloFalso(minutos)
        rutas = rutas or PorCarretera()
        app.dependency_overrides[modelo_minutos] = lambda: modelo
        app.dependency_overrides[proveedor_rutas] = lambda: rutas
        return modelo, rutas

    yield fijar
    app.dependency_overrides.pop(modelo_minutos, None)
    app.dependency_overrides.pop(proveedor_rutas, None)


def pedir(client: TestClient, recintos: list[str], **cambios: Any) -> Any:
    return client.post(URL, json={"salida": "morelia", "recintos": recintos, "gustos": GUSTOS, **cambios})


# Validación

@pytest.mark.parametrize(
    "recintos",
    [[], ["R0001", "R0001"], ["R0001", "R0002", "R0003", "R0004", "R0005"], ["morelia"]],
    ids=["vacio", "repetido", "mas-de-4", "clave-invalida"],
)
def test_rechaza_selecciones_invalidas(client: TestClient, usar: Any, recintos: list[str]) -> None:
    usar([])
    assert pedir(client, recintos).status_code == 422


def test_rechaza_gustos_incompletos(client: TestClient, usar: Any) -> None:
    usar([])
    respuesta = pedir(client, ["R0001"], gustos={"historia": 3})
    assert respuesta.status_code == 422


def test_salida_inexistente_es_404(client: TestClient, usar: Any) -> None:
    usar([60])
    respuesta = pedir(client, ["R0001"], salida="cdmx")
    assert respuesta.status_code == 404
    assert "cdmx" in respuesta.json()["detail"]


def test_recinto_inexistente_es_404(client: TestClient, usar: Any) -> None:
    usar([60])
    assert pedir(client, ["R0099"]).status_code == 404


def test_recinto_sin_valores_es_422(client: TestClient, db: Session, usar: Any) -> None:
    db.add(Recinto(nombre="Sin valores", latitud=19.5, longitud=-101.5, tamano=1))
    db.commit()
    usar([60])

    respuesta = pedir(client, ["R0004"])

    assert respuesta.status_code == 422
    assert "R0004" in respuesta.json()["detail"]


# Modelo de minutos

def test_arma_las_variables_del_modelo_de_minutos(client: TestClient, usar: Any) -> None:
    modelo, _ = usar([60, 60])

    pedir(client, ["R0002", "R0001"])

    # En el orden pedido, con gustos, valores y tamaño.
    assert len(modelo.filas) == 2
    assert set(modelo.filas[0]) == set(VARIABLES)
    assert modelo.filas[0]["gusto_historia"] == 3
    assert modelo.filas[0]["recinto_historia"] == 2
    assert modelo.filas[0]["recinto_tamano"] == 2


# Respuesta

def test_responde_dias_paradas_trazo_y_totales(client: TestClient, usar: Any) -> None:
    usar([90, 120, 60])

    respuesta = pedir(client, ["R0001", "R0002", "R0003"])

    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert cuerpo["aproximada"] is False
    assert cuerpo["salida"]["id"] == "morelia"
    assert cuerpo["minutos_por_dia"] == 480
    paradas = [p for dia in cuerpo["dias"] for p in dia["paradas"]]
    assert sorted(p["id"] for p in paradas) == ["R0001", "R0002", "R0003"]
    assert [p["orden"] for p in paradas] == [1, 2, 3]
    assert all("descripcion" in p for p in paradas)
    visita = {p["id"]: p["minutos_visita"] for p in paradas}
    assert visita == {"R0001": 90, "R0002": 120, "R0003": 60}

    totales = cuerpo["totales"]
    assert totales["dias"] == len(cuerpo["dias"])
    assert totales["minutos_visita"] == 270
    assert totales["km"] == pytest.approx(sum(p["km_desde_anterior"] for p in paradas), abs=0.11)


def test_visita_en_el_orden_mas_corto(client: TestClient, usar: Any) -> None:
    usar([30, 30, 30])

    cuerpo = pedir(client, ["R0002", "R0001", "R0003"]).json()

    # Morelia -> Tzintzuntzan -> Pátzcuaro -> Uruapan, sin importar el orden en que se pidieron.
    paradas = [p["nombre"] for dia in cuerpo["dias"] for p in dia["paradas"]]
    assert paradas == ["Tzintzuntzan", "Pátzcuaro", "Uruapan"]
    assert len(cuerpo["dias"]) == 1


def test_el_trazo_de_cada_dia_empieza_donde_termino_el_anterior(client: TestClient, usar: Any) -> None:
    # 300 min por lugar: no caben dos en un día.
    usar([300, 300, 300])

    cuerpo = pedir(client, ["R0001", "R0002", "R0003"]).json()

    dias = cuerpo["dias"]
    assert len(dias) == 3
    morelia = [cuerpo["salida"]["longitud"], cuerpo["salida"]["latitud"]]
    assert dias[0]["trazo"]["type"] == "LineString"
    assert dias[0]["trazo"]["coordinates"][0] == morelia
    for anterior, siguiente in pairwise(dias):
        ultima = anterior["paradas"][-1]
        assert siguiente["trazo"]["coordinates"][0] == [ultima["longitud"], ultima["latitud"]]
    assert all(not dia["excede_jornada"] for dia in dias)
    assert all(dia["totales"]["minutos_jornada"] <= 480 for dia in dias)


def test_un_lugar_que_no_cabe_se_marca(client: TestClient, usar: Any) -> None:
    usar([600])

    dia = pedir(client, ["R0001"]).json()["dias"][0]

    assert dia["excede_jornada"] is True
    assert dia["totales"]["minutos_jornada"] > 480


# Respaldo en línea recta

def test_si_falla_la_matriz_todo_es_en_linea_recta(client: TestClient, usar: Any) -> None:
    _, rutas = usar([60, 60], Caido())

    respuesta = pedir(client, ["R0001", "R0002"])

    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert cuerpo["aproximada"] is True
    # tramos en línea recta: solo los puntos de las paradas, sin intermedios
    assert len(cuerpo["dias"][0]["trazo"]["coordinates"]) == 3
    assert "tramos" not in rutas.llamadas


def test_si_falla_solo_el_trazo_tambien_es_aproximada(client: TestClient, usar: Any) -> None:
    usar([60, 60], SinTrazo())

    cuerpo = pedir(client, ["R0001", "R0002"]).json()

    assert cuerpo["aproximada"] is True
    assert len(cuerpo["dias"][0]["trazo"]["coordinates"]) == 3


def test_por_carretera_el_trazo_trae_los_puntos_intermedios(client: TestClient, usar: Any) -> None:
    usar([60, 60])

    cuerpo = pedir(client, ["R0001", "R0002"]).json()

    # 2 tramos de 3 puntos que comparten el del medio
    assert len(cuerpo["dias"][0]["trazo"]["coordinates"]) == 5


# Modelo publicado

def test_sin_modelo_responde_503(client: TestClient, catalogo: None, tmp_path: Any, monkeypatch: Any) -> None:
    monkeypatch.setattr("app.ml.modelo_minutos.CARPETA", tmp_path)
    modelo_minutos.cache_clear()
    app.dependency_overrides[proveedor_rutas] = PorCarretera

    respuesta = pedir(client, ["R0001"])

    assert respuesta.status_code == 503
    modelo_minutos.cache_clear()


def test_el_modelo_publicado_es_valido() -> None:
    try:
        modelo = leer_modelo()
    except ArtefactoInvalido as error:
        pytest.skip(f"No hay modelo de minutos en backend/artifacts: {error}")

    fila = {f"gusto_{c}": 3 for c in CODIGOS_GUSTOS} | {f"recinto_{c}": 2 for c in CODIGOS_GUSTOS}
    assert modelo.minutos([fila | {"recinto_tamano": 2}])[0] > 0
