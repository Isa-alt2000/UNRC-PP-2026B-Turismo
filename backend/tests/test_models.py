from collections.abc import Iterator
from typing import Any

import pytest
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, SQLModel, select

from app.core.db import crear_engine
from app.models import Gusto, Hotel, PuntoPartida, Recinto, RecintoValores
from app.models.recintos import CODIGOS_GUSTOS

VALORES_PARICUTIN = {
    "historia": 2,
    "artes_artesanias": 0,
    "arquitectura": 1,
    "gastronomia": 0,
    "naturaleza": 3,
    "aventura": 3,
}


@pytest.fixture
def session() -> Iterator[Session]:
    """Base en memoria con las tablas creadas y un recinto de ejemplo."""
    engine = crear_engine("sqlite://")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as sesion:
        sesion.add(Recinto(id=1, nombre="Paricutín", latitud=19.49, longitud=-102.25, tamano=3))
        sesion.commit()
        yield sesion


def test_las_columnas_de_valores_son_los_codigos_de_gustos() -> None:
    columnas = [c.name for c in RecintoValores.__table__.columns if c.name != "recinto_id"]
    assert columnas == list(CODIGOS_GUSTOS)


def test_guarda_un_gusto(session: Session) -> None:
    session.add(Gusto(codigo="naturaleza", nombre="Naturaleza", pregunta="¿Cuánto disfrutas…?", orden=5))
    session.commit()

    assert session.get(Gusto, "naturaleza").nombre == "Naturaleza"


def test_rechaza_dos_gustos_con_el_mismo_orden(session: Session) -> None:
    session.add(Gusto(codigo="historia", nombre="Historia", pregunta="¿…?", orden=1))
    session.add(Gusto(codigo="aventura", nombre="Aventura", pregunta="¿…?", orden=1))
    with pytest.raises(IntegrityError):
        session.commit()


def test_guarda_los_valores_de_un_recinto(session: Session) -> None:
    session.add(RecintoValores(recinto_id=1, **VALORES_PARICUTIN))
    session.commit()

    assert session.get(RecintoValores, 1).naturaleza == 3


@pytest.mark.parametrize("codigo", CODIGOS_GUSTOS)
@pytest.mark.parametrize("valor", [-1, 4])
def test_rechaza_valor_fuera_de_0_a_3(session: Session, codigo: str, valor: int) -> None:
    session.add(RecintoValores(recinto_id=1, **{**VALORES_PARICUTIN, codigo: valor}))
    with pytest.raises(IntegrityError):
        session.commit()


@pytest.mark.parametrize("tamano", [0, 4])
def test_rechaza_tamano_fuera_de_1_a_3(session: Session, tamano: int) -> None:
    session.add(Recinto(nombre="Otro", latitud=19.7, longitud=-101.2, tamano=tamano))
    with pytest.raises(IntegrityError):
        session.commit()


def test_rechaza_valores_de_un_recinto_inexistente(session: Session) -> None:
    session.add(RecintoValores(recinto_id=999, **VALORES_PARICUTIN))
    with pytest.raises(IntegrityError):
        session.commit()


def test_borrar_un_recinto_borra_sus_valores(session: Session) -> None:
    session.add(RecintoValores(recinto_id=1, **VALORES_PARICUTIN))
    session.commit()

    session.delete(session.get(Recinto, 1))
    session.commit()

    assert session.exec(select(RecintoValores)).all() == []


# Puntos de partida

def morelia(**cambios: Any) -> PuntoPartida:
    return PuntoPartida(
        **{"id": "morelia", "nombre": "Morelia", "latitud": 19.70, "longitud": -101.19, "orden": 1}
        | cambios
    )


def test_guarda_un_punto_de_partida(session: Session) -> None:
    session.add(morelia())
    session.commit()

    assert session.get(PuntoPartida, "morelia").nombre == "Morelia"


def test_rechaza_dos_puntos_con_el_mismo_orden(session: Session) -> None:
    session.add(morelia())
    session.add(morelia(id="uruapan", nombre="Uruapan"))
    with pytest.raises(IntegrityError):
        session.commit()


@pytest.mark.parametrize("coordenadas", [{"latitud": 91}, {"longitud": -181}])
def test_rechaza_coordenadas_fuera_de_rango(
    session: Session, coordenadas: dict[str, float]
) -> None:
    session.add(morelia(**coordenadas))
    with pytest.raises(IntegrityError):
        session.commit()


# Hoteles

def hotel(**cambios: Any) -> Hotel:
    return Hotel(
        **{
            "id": 2576300,
            "nombre": "Hotel Posada Refugio",
            "tipo": "Casa de huéspedes",
            "codigo_scian": 721311,
            "tamano": "micro",
            "localidad": "Morelia",
            "municipio": "Morelia",
            "latitud": 19.695,
            "longitud": -101.189,
        }
        | cambios
    )


def test_guarda_un_hotel_con_el_id_del_denue(session: Session) -> None:
    session.add(hotel(telefono="4433121955"))
    session.commit()

    guardado = session.get(Hotel, 2576300)
    assert guardado.nombre == "Hotel Posada Refugio"
    assert guardado.telefono == "4433121955"
    assert guardado.sitio_web is None


def test_rechaza_dos_hoteles_con_el_mismo_id(session: Session) -> None:
    session.add(hotel())
    session.commit()
    session.add(hotel(nombre="Otro"))
    with pytest.raises(IntegrityError):
        session.commit()


@pytest.mark.parametrize(
    "cambios",
    [{"tamano": "enorme"}, {"latitud": 91}, {"longitud": -181}],
    ids=["tamano-desconocido", "latitud", "longitud"],
)
def test_rechaza_hoteles_invalidos(session: Session, cambios: dict[str, Any]) -> None:
    session.add(hotel(**cambios))
    with pytest.raises(IntegrityError):
        session.commit()
