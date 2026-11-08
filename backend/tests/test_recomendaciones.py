from collections.abc import Iterator
from dataclasses import dataclass, field
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.main import app
from app.ml.modelo_interes import VARIABLES, ArtefactoInvalido, leer_modelo, modelo_interes
from app.models import Recinto, RecintoValores
from app.models.recintos import CODIGOS_GUSTOS

URL = f"{settings.api_prefix}/recomendaciones"
GUSTOS = {codigo: 3 for codigo in CODIGOS_GUSTOS}


@dataclass
class ModeloFalso:
    """Devuelve las probabilidades indicadas, en el orden en que recibe los recintos."""

    respuestas: list[float]
    umbral: float = 0.4
    filas: list[dict[str, float]] = field(default_factory=list)

    def probabilidades(self, filas: list[dict[str, float]]) -> list[float]:
        self.filas = filas
        return self.respuestas[: len(filas)]


def agregar_recintos(db: Session, cantidad: int, **cambios: Any) -> None:
    for i in range(1, cantidad + 1):
        recinto = Recinto(nombre=f"Recinto {i}", latitud=19.5, longitud=-101.5, tamano=2)
        recinto.sqlmodel_update(cambios)
        recinto.valores = RecintoValores(**{codigo: i % 4 for codigo in CODIGOS_GUSTOS})
        db.add(recinto)
    db.commit()


@pytest.fixture
def usar_modelo() -> Iterator[Any]:
    def usar(respuestas: list[float]) -> ModeloFalso:
        modelo = ModeloFalso(respuestas)
        app.dependency_overrides[modelo_interes] = lambda: modelo
        return modelo

    yield usar
    app.dependency_overrides.pop(modelo_interes, None)


def pedir(client: TestClient, **cambios: Any) -> Any:
    return client.post(URL, json={"gustos": GUSTOS, "mes": 11, **cambios})


# Validación

@pytest.mark.parametrize(
    "cuerpo",
    [
        {"gustos": {**GUSTOS, "historia": 6}, "mes": 11},
        {"gustos": {k: v for k, v in GUSTOS.items() if k != "aventura"}, "mes": 11},
        {"gustos": {**GUSTOS, "deportes": 3}, "mes": 11},
        {"gustos": GUSTOS, "mes": 13},
        {"gustos": GUSTOS},
    ],
    ids=["nivel-6", "falta-gusto", "gusto-desconocido", "mes-13", "sin-mes"],
)
def test_rechaza_solicitudes_invalidas(
    client: TestClient, usar_modelo: Any, cuerpo: dict[str, Any]
) -> None:
    usar_modelo([])
    assert client.post(URL, json=cuerpo).status_code == 422


# Variables del modelo

def test_arma_las_variables_con_gusto_por_valor(
    client: TestClient, db: Session, usar_modelo: Any
) -> None:
    agregar_recintos(db, 1)
    modelo = usar_modelo([0.9])

    pedir(client, gustos={**GUSTOS, "historia": 5})

    # El recinto 1 tiene valor 1 en cada gusto.
    fila = modelo.filas[0]
    assert set(fila) == set(VARIABLES)
    assert fila["gusto_historia"] == 5
    assert fila["afinidad_historia"] == 5
    assert fila["afinidad_aventura"] == 3


# Recintos afines

def test_devuelve_los_afines_de_mayor_a_menor(
    client: TestClient, db: Session, usar_modelo: Any
) -> None:
    agregar_recintos(db, 4)
    usar_modelo([0.5, 0.2, 0.9, 0.4])

    respuesta = pedir(client).json()

    assert [r["id"] for r in respuesta["recintos"]] == ["R0003", "R0001", "R0004"]
    assert respuesta["recintos"][0]["probabilidad"] == 0.9


def test_devuelve_como_maximo_diez(client: TestClient, db: Session, usar_modelo: Any) -> None:
    agregar_recintos(db, 12)
    usar_modelo([0.9] * 12)

    assert len(pedir(client).json()["recintos"]) == 10


def test_cada_recinto_trae_sus_datos_y_etiquetas(
    client: TestClient, db: Session, usar_modelo: Any
) -> None:
    agregar_recintos(db, 1, tamano=3, descripcion="Volcán joven.")
    usar_modelo([0.8])

    assert pedir(client).json()["recintos"][0] == {
        "id": "R0001",
        "nombre": "Recinto 1",
        "descripcion": "Volcán joven.",
        "probabilidad": 0.8,
        "afluencia": "sin_datos",
        "etiquetas": ["familiar", "grande"],
    }


def test_con_dependientes_quita_los_recintos_no_aptos(
    client: TestClient, db: Session, usar_modelo: Any
) -> None:
    agregar_recintos(db, 2)
    db.get(Recinto, 1).es_apto_dependientes = False
    db.commit()
    modelo = usar_modelo([0.9, 0.9])

    respuesta = pedir(client, con_dependientes=True).json()

    assert len(modelo.filas) == 1
    assert [r["id"] for r in respuesta["recintos"]] == ["R0002"]


# Sugerencias por afluencia

def ids(recintos: list[dict[str, Any]]) -> list[str]:
    return [r["id"] for r in recintos]


def test_sin_afines_sugiere_tres_por_afluencia(
    client: TestClient, db: Session, usar_modelo: Any
) -> None:
    agregar_recintos(db, 5)
    usar_modelo([0.1, 0.3, 0.2, 0.05, 0.39])

    respuesta = pedir(client).json()

    assert respuesta["recintos"] == []
    assert ids(respuesta["recintos_por_afluencia"]) == ["R0001", "R0002", "R0003"]


def test_con_pocos_afines_sugiere_tres_que_no_se_repiten(
    client: TestClient, db: Session, usar_modelo: Any
) -> None:
    agregar_recintos(db, 6)
    usar_modelo([0.9, 0.1, 0.8, 0.1, 0.1, 0.1])

    respuesta = pedir(client).json()

    assert ids(respuesta["recintos"]) == ["R0001", "R0003"]
    assert ids(respuesta["recintos_por_afluencia"]) == ["R0002", "R0004", "R0005"]


def test_con_cuatro_afines_o_mas_no_hay_sugerencias(
    client: TestClient, db: Session, usar_modelo: Any
) -> None:
    agregar_recintos(db, 5)
    usar_modelo([0.9, 0.8, 0.7, 0.6, 0.1])

    respuesta = pedir(client).json()

    assert len(respuesta["recintos"]) == 4
    assert respuesta["recintos_por_afluencia"] == []


def test_sin_recintos_devuelve_listas_vacias(client: TestClient, usar_modelo: Any) -> None:
    usar_modelo([])

    assert pedir(client).json() == {"recintos": [], "recintos_por_afluencia": []}


# Modelo

def test_sin_modelo_responde_503(client: TestClient, tmp_path: Any, monkeypatch: Any) -> None:
    monkeypatch.setattr("app.ml.modelo_interes.CARPETA", tmp_path)
    modelo_interes.cache_clear()

    respuesta = pedir(client)

    assert respuesta.status_code == 503
    assert respuesta.json() == {"detail": "El modelo de recomendaciones no está disponible"}
    modelo_interes.cache_clear()


def test_el_modelo_publicado_es_valido() -> None:
    try:
        modelo = leer_modelo()
    except ArtefactoInvalido as error:
        pytest.skip(f"No hay modelo publicado en backend/artifacts: {error}")

    fila = {f"gusto_{c}": 3 for c in CODIGOS_GUSTOS} | {f"afinidad_{c}": 6 for c in CODIGOS_GUSTOS}
    assert modelo.umbral == 0.4
    assert 0 <= modelo.probabilidades([fila])[0] <= 1


# Logs

LOGGER = "app.recomendaciones.service"


def mensajes(caplog: pytest.LogCaptureFixture) -> list[str]:
    return [r.getMessage() for r in caplog.records if r.name == LOGGER]


def test_registra_los_gustos_y_los_afines(
    client: TestClient, db: Session, usar_modelo: Any, caplog: pytest.LogCaptureFixture
) -> None:
    caplog.set_level("INFO", logger=LOGGER)
    agregar_recintos(db, 3)
    usar_modelo([0.5, 0.1, 0.9])

    pedir(client, gustos={**GUSTOS, "naturaleza": 5})

    assert mensajes(caplog) == [
        "Gustos recibidos: historia=3, artes_artesanias=3, arquitectura=3, gastronomia=3, "
        "naturaleza=5, aventura=3 | mes=11 | con_dependientes=False",
        "Afinidades: 2 de 3 recintos superan el umbral 0.4: R0003 0.900, R0001 0.500",
        "Sugerencias por afluencia: R0002",
    ]


def test_registra_cuando_ninguno_es_afin(
    client: TestClient, db: Session, usar_modelo: Any, caplog: pytest.LogCaptureFixture
) -> None:
    caplog.set_level("INFO", logger=LOGGER)
    agregar_recintos(db, 4)
    usar_modelo([0.1] * 4)

    pedir(client)

    assert mensajes(caplog)[-2:] == [
        "Afinidades: 0 de 4 recintos superan el umbral 0.4: ninguno",
        "Sugerencias por afluencia: R0001, R0002, R0003",
    ]
