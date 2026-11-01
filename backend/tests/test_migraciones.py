from pathlib import Path

import pytest
from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext
from sqlalchemy import inspect
from sqlmodel import Session, SQLModel, create_engine, select

from app.core.config import BACKEND
from app.models import Gusto
from app.models.recintos import CODIGOS_GUSTOS


@pytest.fixture
def url(tmp_path: Path) -> str:
    """Base vacía en un archivo temporal."""
    return f"sqlite:///{tmp_path / 'migraciones.db'}"


def alembic(url: str) -> Config:
    # Sin alembic.ini para que fileConfig no reconfigure el logging de las demás pruebas.
    config = Config()
    config.set_main_option("script_location", str(BACKEND / "alembic"))
    config.set_main_option("sqlalchemy.url", url)
    return config


def test_las_migraciones_coinciden_con_los_modelos(url: str) -> None:
    command.upgrade(alembic(url), "head")

    with create_engine(url).connect() as conexion:
        diferencias = compare_metadata(MigrationContext.configure(conexion), SQLModel.metadata)

    assert diferencias == [], "Falta una migración: uv run alembic revision --autogenerate -m '...'"


def test_los_gustos_cargados_coinciden_con_las_columnas_de_valores(url: str) -> None:
    command.upgrade(alembic(url), "head")

    with Session(create_engine(url)) as session:
        codigos = session.exec(select(Gusto.codigo).order_by(Gusto.orden)).all()

    assert codigos == list(CODIGOS_GUSTOS)


def test_downgrade_borra_todas_las_tablas(url: str) -> None:
    config = alembic(url)
    command.upgrade(config, "head")

    command.downgrade(config, "base")

    assert inspect(create_engine(url)).get_table_names() == ["alembic_version"]
