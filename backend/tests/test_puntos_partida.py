from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.models import PuntoPartida

URL = f"{settings.api_prefix}/puntos-partida"


def test_sin_puntos_devuelve_lista_vacia(client: TestClient) -> None:
    respuesta = client.get(URL)

    assert respuesta.status_code == 200
    assert respuesta.json() == []


def test_lista_los_puntos_por_orden(client: TestClient, db: Session) -> None:
    # Se insertan desordenados para comprobar que la API ordena por orden y no por inserción.
    db.add(PuntoPartida(id="uruapan", nombre="Uruapan", latitud=19.42, longitud=-102.05, orden=2))
    db.add(PuntoPartida(id="morelia", nombre="Morelia", latitud=19.71, longitud=-101.21, orden=1))
    db.commit()

    assert client.get(URL).json() == [
        {"id": "morelia", "nombre": "Morelia", "latitud": 19.71, "longitud": -101.21},
        {"id": "uruapan", "nombre": "Uruapan", "latitud": 19.42, "longitud": -102.05},
    ]
