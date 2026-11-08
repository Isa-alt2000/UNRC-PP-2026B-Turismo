from sqlalchemy import CheckConstraint
from sqlmodel import Field, SQLModel


class PuntoPartida(SQLModel, table=True):
    """Ciudad desde la que sale el turista. No se visita ni se recomienda, es un catalogo"""

    __tablename__ = "puntos_partida"
    __table_args__ = (
        CheckConstraint("latitud BETWEEN -90 AND 90", name="punto_latitud_valida"),
        CheckConstraint("longitud BETWEEN -180 AND 180", name="punto_longitud_valida"),
    )

    id: str = Field(primary_key=True, description="Clave como morelia, la misma del frontend")
    nombre: str = Field(description="Nombre para mostrar, como Pátzcuaro")
    latitud: float
    longitud: float
    orden: int = Field(unique=True, description="Posición en la que se muestra")
