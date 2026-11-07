import os
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.core.config import settings
from app.models import RecintoValores
from app.models.recintos import CODIGOS_GUSTOS
from app.recintos.schemas import ValoresRecinto

URL = f"{settings.api_prefix}/recintos"
LLAVE = {"X-API-Key": os.environ["ADMIN_API_KEY"]}

VALORES = {
    "historia": 2,
    "artes_artesanias": 0,
    "arquitectura": 1,
    "gastronomia": 0,
    "naturaleza": 3,
    "aventura": 3,
}


def paricutin(**cambios: Any) -> dict[str, Any]:
    return {
        "nombre": "Volcán Paricutín",
        "latitud": 19.49,
        "longitud": -102.25,
        "tamano": 3,
        "valores": VALORES,
        **cambios,
    }


@pytest.fixture
def creado(client: TestClient) -> dict[str, Any]:
    respuesta = client.post(URL, json=paricutin(), headers=LLAVE)
    assert respuesta.status_code == 201
    return respuesta.json()


# Esquema

def test_los_valores_de_la_api_son_los_codigos_de_gustos() -> None:
    assert tuple(ValoresRecinto.model_fields) == CODIGOS_GUSTOS


# Llave de administración

@pytest.mark.parametrize("encabezados", [{}, {"X-API-Key": "llave-incorrecta"}])
def test_escribir_sin_llave_valida_responde_401(
    client: TestClient, encabezados: dict[str, str]
) -> None:
    respuesta = client.post(URL, json=paricutin(), headers=encabezados)

    assert respuesta.status_code == 401
    assert respuesta.json() == {"detail": "Falta la llave de administración o no es válida"}


def test_leer_no_pide_llave(client: TestClient) -> None:
    assert client.get(URL).status_code == 200


# Crear

def test_crea_un_recinto_con_sus_valores(creado: dict[str, Any]) -> None:
    assert creado["id"] == "R0001"
    assert creado["valores"] == VALORES


def test_por_defecto_es_apto_para_dependientes(creado: dict[str, Any]) -> None:
    assert creado["es_apto_dependientes"] is True


def test_el_backend_asigna_claves_consecutivas(
    client: TestClient, creado: dict[str, Any]
) -> None:
    segundo = client.post(URL, json=paricutin(nombre="Tzintzuntzan"), headers=LLAVE).json()

    assert (creado["id"], segundo["id"]) == ("R0001", "R0002")


def test_no_reutiliza_la_clave_de_un_recinto_borrado(
    client: TestClient, creado: dict[str, Any]
) -> None:
    client.delete(f"{URL}/R0001", headers=LLAVE)
    nuevo = client.post(URL, json=paricutin(nombre="Tzintzuntzan"), headers=LLAVE).json()

    assert nuevo["id"] == "R0002"


@pytest.mark.parametrize(
    "datos",
    [
        paricutin(id="R0001"),
        paricutin(nombre="   "),
        paricutin(tamano=4),
        paricutin(latitud=91),
        paricutin(valores={**VALORES, "naturaleza": 4}),
        paricutin(valores={k: v for k, v in VALORES.items() if k != "aventura"}),
        paricutin(tamaño=3),
    ],
    ids=[
        "id-lo-asigna-el-backend",
        "nombre",
        "tamano",
        "latitud",
        "valor",
        "falta-valor",
        "campo-extra",
    ],
)
def test_rechaza_datos_invalidos(client: TestClient, datos: dict[str, Any]) -> None:
    assert client.post(URL, json=datos, headers=LLAVE).status_code == 422


# Leer

def test_lista_y_obtiene_recintos(client: TestClient, creado: dict[str, Any]) -> None:
    assert client.get(URL).json() == [creado]
    assert client.get(f"{URL}/R0001").json() == creado


def test_lista_en_orden_de_clave(client: TestClient) -> None:
    # Se crean en orden alfabético inverso para comprobar que no se ordena por nombre.
    for nombre in ("Zirahuén", "Morelia", "Angahuan"):
        client.post(URL, json=paricutin(nombre=nombre), headers=LLAVE)

    assert [r["id"] for r in client.get(URL).json()] == ["R0001", "R0002", "R0003"]


def test_recinto_inexistente_responde_404(client: TestClient) -> None:
    respuesta = client.get(f"{URL}/R9999")

    assert respuesta.status_code == 404
    assert respuesta.json() == {"detail": "No existe el recinto R9999"}


def test_clave_con_formato_invalido_en_la_ruta_responde_422(client: TestClient) -> None:
    assert client.get(f"{URL}/paricutin").status_code == 422


# Actualizar

def test_actualiza_solo_lo_que_se_envia(client: TestClient, creado: dict[str, Any]) -> None:
    cambios = {"es_apto_dependientes": False, "descripcion": "Volcán joven."}
    respuesta = client.patch(f"{URL}/R0001", json=cambios, headers=LLAVE)

    assert respuesta.status_code == 200
    assert respuesta.json() == {**creado, **cambios}


def test_permite_borrar_la_descripcion(client: TestClient, creado: dict[str, Any]) -> None:
    client.patch(f"{URL}/R0001", json={"descripcion": "Volcán joven."}, headers=LLAVE)
    respuesta = client.patch(f"{URL}/R0001", json={"descripcion": None}, headers=LLAVE)

    assert respuesta.json()["descripcion"] is None


def test_no_permite_vaciar_un_campo_obligatorio(
    client: TestClient, creado: dict[str, Any]
) -> None:
    respuesta = client.patch(f"{URL}/R0001", json={"nombre": None}, headers=LLAVE)

    assert respuesta.status_code == 422


def test_reemplaza_los_valores(client: TestClient, creado: dict[str, Any]) -> None:
    nuevos = {**VALORES, "historia": 3, "aventura": 1}
    respuesta = client.put(f"{URL}/R0001/valores", json=nuevos, headers=LLAVE)

    assert respuesta.status_code == 200
    assert respuesta.json()["valores"] == nuevos


def test_actualizar_un_recinto_inexistente_responde_404(client: TestClient) -> None:
    respuesta = client.patch(f"{URL}/R9999", json={"tamano": 1}, headers=LLAVE)

    assert respuesta.status_code == 404


# Borrar

def test_borra_el_recinto_y_sus_valores(
    client: TestClient, db: Session, creado: dict[str, Any]
) -> None:
    respuesta = client.delete(f"{URL}/R0001", headers=LLAVE)

    assert respuesta.status_code == 204
    assert client.get(f"{URL}/R0001").status_code == 404
    assert db.exec(select(RecintoValores)).all() == []


# Logs

LOGGER = "app.recintos.service"


def mensajes(caplog: pytest.LogCaptureFixture) -> list[str]:
    return [r.getMessage() for r in caplog.records if r.name == LOGGER and r.levelname == "INFO"]


def test_cada_cambio_deja_un_log(client: TestClient, caplog: pytest.LogCaptureFixture) -> None:
    caplog.set_level("INFO", logger=LOGGER)

    client.post(URL, json=paricutin(), headers=LLAVE)
    client.patch(f"{URL}/R0001", json={"tamano": 2, "descripcion": "x"}, headers=LLAVE)
    client.put(f"{URL}/R0001/valores", json=VALORES, headers=LLAVE)
    client.delete(f"{URL}/R0001", headers=LLAVE)

    assert mensajes(caplog) == [
        "Recinto creado: R0001",
        "Recinto actualizado: R0001 (descripcion, tamano)",
        "Valores reemplazados del recinto: R0001",
        "Recinto borrado: R0001",
    ]


def test_lecturas_y_cambios_rechazados_no_dejan_log(
    client: TestClient, creado: dict[str, Any], caplog: pytest.LogCaptureFixture
) -> None:
    caplog.set_level("INFO", logger=LOGGER)

    client.get(URL)
    client.get(f"{URL}/R0001")
    client.post(URL, json=paricutin(tamano=4), headers=LLAVE)
    client.delete(f"{URL}/R0001")

    assert mensajes(caplog) == []
