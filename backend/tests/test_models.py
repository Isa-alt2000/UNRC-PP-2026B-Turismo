from collections.abc import Iterator

import pytest
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, SQLModel, select

from app.core.db import crear_engine
from app.models import Gusto, Recinto, RecintoValores
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
        sesion.add(Recinto(id="paricutin", nombre="Paricutín", latitud=19.49, longitud=-102.25, tamano=3))
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
    session.add(RecintoValores(recinto_id="paricutin", **VALORES_PARICUTIN))
    session.commit()

    assert session.get(RecintoValores, "paricutin").naturaleza == 3


@pytest.mark.parametrize("codigo", CODIGOS_GUSTOS)
@pytest.mark.parametrize("valor", [-1, 4])
def test_rechaza_valor_fuera_de_0_a_3(session: Session, codigo: str, valor: int) -> None:
    session.add(RecintoValores(recinto_id="paricutin", **{**VALORES_PARICUTIN, codigo: valor}))
    with pytest.raises(IntegrityError):
        session.commit()


@pytest.mark.parametrize("tamano", [0, 4])
def test_rechaza_tamano_fuera_de_1_a_3(session: Session, tamano: int) -> None:
    session.add(Recinto(id="otro", nombre="Otro", latitud=19.7, longitud=-101.2, tamano=tamano))
    with pytest.raises(IntegrityError):
        session.commit()


def test_rechaza_valores_de_un_recinto_inexistente(session: Session) -> None:
    session.add(RecintoValores(recinto_id="no_existe", **VALORES_PARICUTIN))
    with pytest.raises(IntegrityError):
        session.commit()


def test_borrar_un_recinto_borra_sus_valores(session: Session) -> None:
    session.add(RecintoValores(recinto_id="paricutin", **VALORES_PARICUTIN))
    session.commit()

    session.delete(session.get(Recinto, "paricutin"))
    session.commit()

    assert session.exec(select(RecintoValores)).all() == []
