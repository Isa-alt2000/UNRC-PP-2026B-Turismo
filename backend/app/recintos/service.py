import logging
from collections.abc import Sequence

from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from app.core.exceptions import RecursoNoEncontrado
from app.models import Recinto, RecintoValores
from app.recintos.schemas import (
    RecintoActualizar,
    RecintoCrear,
    ValoresRecinto,
    a_clave,
    a_numero,
)

log = logging.getLogger(__name__)


def listar_recintos(session: Session) -> Sequence[Recinto]:
    """Todos los recintos con sus valores por clave RXXXX"""
    consulta = select(Recinto).options(selectinload(Recinto.valores)).order_by(Recinto.id)
    return session.exec(consulta).all()


def obtener_recinto(session: Session, clave: str) -> Recinto:
    recinto = session.get(Recinto, a_numero(clave))
    if recinto is None:
        raise RecursoNoEncontrado(f"No existe el recinto {clave}")
    return recinto


def guardar(session: Session, recinto: Recinto) -> Recinto:
    session.add(recinto)
    session.commit()
    session.refresh(recinto)
    return recinto


def crear_recinto(session: Session, datos: RecintoCrear) -> Recinto:
    """La base asigna el número al guardar desde ahí el recinto ya tiene su clave."""
    recinto = Recinto(
        **datos.model_dump(exclude={"valores"}),
        valores=RecintoValores(**datos.valores.model_dump()),
    )
    guardar(session, recinto)
    log.info(f"Recinto creado: {a_clave(recinto.id)}")
    return recinto


def actualizar_recinto(session: Session, clave: str, cambios: RecintoActualizar) -> Recinto:
    recinto = obtener_recinto(session, clave)
    datos = cambios.model_dump(exclude_unset=True)
    recinto.sqlmodel_update(datos)
    guardar(session, recinto)
    campos = ", ".join(sorted(datos)) or "sin cambios"
    log.info(f"Recinto actualizado: {clave} ({campos})")
    return recinto


def reemplazar_valores(session: Session, clave: str, valores: ValoresRecinto) -> Recinto:
    recinto = obtener_recinto(session, clave)
    if recinto.valores is None:
        recinto.valores = RecintoValores(**valores.model_dump())
    else:
        recinto.valores.sqlmodel_update(valores.model_dump())
    guardar(session, recinto)
    log.info(f"Valores reemplazados del recinto: {clave}")
    return recinto


def borrar_recinto(session: Session, clave: str) -> None:
    session.delete(obtener_recinto(session, clave))
    session.commit()
    log.info(f"Recinto borrado: {clave}")
