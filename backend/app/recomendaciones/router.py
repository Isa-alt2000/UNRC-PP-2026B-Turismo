from fastapi import APIRouter

from app.core.db import SessionDep
from app.ml.modelo_interes import ModeloInteresDep
from app.recomendaciones import service
from app.recomendaciones.schemas import RespuestaRecomendaciones, SolicitudRecomendaciones

router = APIRouter(prefix="/recomendaciones", tags=["recomendaciones"])


@router.post(
    "",
    response_model=RespuestaRecomendaciones,
    responses={503: {"description": "El modelo de recomendaciones no está disponible"}},
)
def recomendar(
    solicitud: SolicitudRecomendaciones, session: SessionDep, modelo: ModeloInteresDep
) -> RespuestaRecomendaciones:
    """Recibe los gustos del turista y devuelve hasta 10 recintos afines.

    Si ninguno supera el umbral del modelo, devuelve 3 de respaldo con son_predecidos en false.
    """
    return service.recomendar(session, modelo, solicitud)
