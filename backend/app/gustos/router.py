from collections.abc import Sequence

from fastapi import APIRouter

from app.core.db import SessionDep
from app.gustos import service
from app.gustos.schemas import GustoPublico
from app.models import Gusto

router = APIRouter(prefix="/gustos", tags=["gustos"])


@router.get("", response_model=list[GustoPublico])
def listar_gustos(session: SessionDep) -> Sequence[Gusto]:
    """Lista los gustos que califica el turista, en orden."""
    return service.listar_gustos(session)
