from sqlalchemy import text
from sqlmodel import Session

from app.core.db import crear_engine


def test_sqlite_activa_llaves_foraneas() -> None:
    engine = crear_engine("sqlite://")
    with Session(engine) as session:
        assert session.exec(text("PRAGMA foreign_keys")).one()[0] == 1
