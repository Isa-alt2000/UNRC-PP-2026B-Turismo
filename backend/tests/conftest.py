import os

# Valores ficticios para que las pruebas no dependan del .env de cada quien ni toquen la base o
# los logs reales. Se fijan antes de importar la app: las variables de entorno tienen prioridad
# sobre el .env.
os.environ["API_PREFIX"] = "/prueba"
os.environ["DATABASE_URL"] = "sqlite://"  # base en memoria
os.environ["CORS_ORIGINS"] = '["http://cliente.test"]'  # .test está reservado para pruebas
os.environ["LOG_FILE"] = os.devnull  # descarta lo que se escribe
os.environ["ADMIN_API_KEY"] = "llave-de-prueba-" + "x" * 32

from collections.abc import Iterator  # noqa: E402
from pathlib import Path  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlmodel import Session, SQLModel  # noqa: E402

import app.models  # noqa: E402, F401  Registra las tablas en SQLModel.metadata
from app.core.db import crear_engine, get_session  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture
def db(tmp_path: Path) -> Iterator[Session]:
    """Base vacía con todas las tablas, en un archivo temporal para que la compartan los hilos."""
    engine = crear_engine(f"sqlite:///{tmp_path / 'prueba.db'}")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    engine.dispose()


@pytest.fixture
def client(db: Session) -> Iterator[TestClient]:
    """Cliente de la API que usa la base de prueba en lugar de la configurada."""
    app.dependency_overrides[get_session] = lambda: db
    with TestClient(app) as cliente:
        yield cliente
    app.dependency_overrides.clear()
