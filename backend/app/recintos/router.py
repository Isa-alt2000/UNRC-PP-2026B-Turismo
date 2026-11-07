from collections.abc import Sequence
from typing import Annotated, Any

from fastapi import APIRouter, Path, status

from app.core.db import SessionDep
from app.core.seguridad import RequiereApiKey
from app.models import Recinto
from app.recintos import service
from app.recintos.schemas import (
    PATRON_CLAVE,
    RecintoActualizar,
    RecintoCrear,
    RecintoPublico,
    ValoresRecinto,
)

router = APIRouter(prefix="/recintos", tags=["recintos"])

ClaveEnRuta = Annotated[str, Path(pattern=PATRON_CLAVE, examples=["R0001"])]

# lectura publica, escritura requiere apikey
NO_ENCONTRADO: dict[int | str, dict[str, Any]] = {404: {"description": "No existe el recinto"}}
ESCRITURA: dict[int | str, dict[str, Any]] = {
    401: {"description": "Falta la llave de administración o no es válida"}
}


@router.get("", response_model=list[RecintoPublico])
def listar_recintos(session: SessionDep) -> Sequence[Recinto]:
    """Lista los recintos del catálogo con sus valores por gusto."""
    return service.listar_recintos(session)


@router.get("/{clave}", response_model=RecintoPublico, responses=NO_ENCONTRADO)
def obtener_recinto(clave: ClaveEnRuta, session: SessionDep) -> Recinto:
    """Devuelve un recinto con sus valores por gusto."""
    return service.obtener_recinto(session, clave)


@router.post(
    "",
    response_model=RecintoPublico,
    status_code=status.HTTP_201_CREATED,
    dependencies=[RequiereApiKey],
    responses=ESCRITURA,
)
def crear_recinto(datos: RecintoCrear, session: SessionDep) -> Recinto:
    """Da de alta un recinto junto con sus valores del 0 al 3. La clave la asigna el backend."""
    return service.crear_recinto(session, datos)


@router.patch(
    "/{clave}",
    response_model=RecintoPublico,
    dependencies=[RequiereApiKey],
    responses={**ESCRITURA, **NO_ENCONTRADO},
)
def actualizar_recinto(
    clave: ClaveEnRuta, cambios: RecintoActualizar, session: SessionDep
) -> Recinto:
    """Modifica solo los datos que se envían; los demás se conservan."""
    return service.actualizar_recinto(session, clave, cambios)


@router.put(
    "/{clave}/valores",
    response_model=RecintoPublico,
    dependencies=[RequiereApiKey],
    responses={**ESCRITURA, **NO_ENCONTRADO},
)
def reemplazar_valores(
    clave: ClaveEnRuta, valores: ValoresRecinto, session: SessionDep
) -> Recinto:
    """Reemplaza los seis valores del recinto"""
    return service.reemplazar_valores(session, clave, valores)


@router.delete(
    "/{clave}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[RequiereApiKey],
    responses={**ESCRITURA, **NO_ENCONTRADO},
)
def borrar_recinto(clave: ClaveEnRuta, session: SessionDep) -> None:
    """Borra el recinto y sus valores."""
    service.borrar_recinto(session, clave)
