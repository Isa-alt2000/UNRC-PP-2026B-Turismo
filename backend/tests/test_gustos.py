from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.models import Gusto

URL = f"{settings.api_prefix}/gustos"


def test_sin_gustos_devuelve_lista_vacia(client: TestClient) -> None:
    respuesta = client.get(URL)

    assert respuesta.status_code == 200
    assert respuesta.json() == []


def test_lista_los_gustos_por_orden(client: TestClient, db: Session) -> None:
    # Se insertan desordenados para comprobar que la API ordena por orden y no por inserción.
    db.add(Gusto(codigo="naturaleza", nombre="Naturaleza", pregunta="¿Naturaleza?", orden=2))
    db.add(Gusto(codigo="historia", nombre="Historia", pregunta="¿Historia?", orden=1))
    db.commit()

    respuesta = client.get(URL)

    assert respuesta.status_code == 200
    assert [g["codigo"] for g in respuesta.json()] == ["historia", "naturaleza"]


def test_cada_gusto_trae_codigo_nombre_y_pregunta(client: TestClient, db: Session) -> None:
    db.add(Gusto(codigo="historia", nombre="Historia", pregunta="¿Historia?", orden=1))
    db.commit()

    assert client.get(URL).json() == [
        {"codigo": "historia", "nombre": "Historia", "pregunta": "¿Historia?"}
    ]
