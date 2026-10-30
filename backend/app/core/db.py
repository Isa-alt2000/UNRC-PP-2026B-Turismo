from collections.abc import Iterator
from typing import Annotated, Any

from fastapi import Depends
from sqlalchemy import Engine, event
from sqlalchemy.engine import make_url
from sqlmodel import Session, create_engine

from app.core.config import settings


def activar_llaves_foraneas(conexion: Any, _: Any) -> None:
    cursor = conexion.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def crear_engine(url: str) -> Engine:
    if make_url(url).get_backend_name() != "sqlite":
        return create_engine(url)
    engine = create_engine(url, connect_args={"check_same_thread": False})
    event.listen(engine, "connect", activar_llaves_foraneas)
    return engine


engine = crear_engine(settings.database_url)


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]
