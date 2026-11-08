from collections.abc import Sequence

from fastapi import APIRouter

from app.core.db import SessionDep
from app.models import PuntoPartida
from app.puntos_partida import service
from app.puntos_partida.schemas import PuntoPartidaPublico

router = APIRouter(prefix="/puntos-partida", tags=["puntos de partida"])


@router.get("", response_model=list[PuntoPartidaPublico])
def listar_puntos_partida(session: SessionDep) -> Sequence[PuntoPartida]:
    """Lista las ciudades desde las que puede salir el turista, en orden."""
    return service.listar_puntos_partida(session)
