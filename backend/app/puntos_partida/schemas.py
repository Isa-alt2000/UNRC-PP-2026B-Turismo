from pydantic import BaseModel, ConfigDict


class PuntoPartidaPublico(BaseModel):
    """Un punto de partida tal como lo recibe el frontend."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    nombre: str
    latitud: float
    longitud: float
