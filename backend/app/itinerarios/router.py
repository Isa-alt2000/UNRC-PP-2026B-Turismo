from fastapi import APIRouter

from app.core.db import SessionDep
from app.itinerarios import service
from app.itinerarios.rutas import ProveedorRutasDep
from app.itinerarios.schemas import Itinerario, SolicitudItinerario
from app.ml.modelo_minutos import ModeloMinutosDep

router = APIRouter(prefix="/itinerarios", tags=["itinerarios"])


@router.post(
    "",
    response_model=Itinerario,
    responses={
        404: {"description": "No existe el punto de partida o alguno de los recintos"},
        422: {"description": "Solicitud inválida, o un recinto sin valores"},
        503: {"description": "El modelo de tiempos de visita no está disponible"},
    },
)
def armar_itinerario(
    solicitud: SolicitudItinerario,
    session: SessionDep,
    modelo: ModeloMinutosDep,
    rutas: ProveedorRutasDep,
) -> Itinerario:
    """Ordena los recintos elegidos, los reparte en días de 8 horas y devuelve el trazo de cada día.

    El orden y el reparto se resuelven de forma exacta, probando todas las combinaciones.
    Si la API de rutas falla, todo se calcula en línea recta y aproximada es true.
    """
    return service.armar_itinerario(session, modelo, rutas, solicitud)
