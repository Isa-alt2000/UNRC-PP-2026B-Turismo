from sqlalchemy import CheckConstraint
from sqlmodel import Field, SQLModel

CODIGOS_GUSTOS = (
    "historia",
    "artes_artesanias",
    "arquitectura",
    "gastronomia",
    "naturaleza",
    "aventura",
)


class Recinto(SQLModel, table=True):
    """Lugar del catálogo turístico y sus datos descriptivos."""

    __tablename__ = "recintos"
    __table_args__ = (
        CheckConstraint("tamano BETWEEN 1 AND 3", name="tamano_1_a_3"),
        CheckConstraint("latitud BETWEEN -90 AND 90", name="latitud_valida"),
        CheckConstraint("longitud BETWEEN -180 AND 180", name="longitud_valida"),
    )

    id: str = Field(primary_key=True, description="Identificador")
    nombre: str
    descripcion: str | None = None
    latitud: float
    longitud: float
    tamano: int = Field(description="1 chico, 2 mediano, 3 grande. Lo usa el modelo de minutos")


class RecintoValores(SQLModel, table=True):
    """0 no, 1 secundario, 2 importante, 3 razon principal"""

    __tablename__ = "recinto_valores"
    __table_args__ = tuple(
        CheckConstraint(f"{codigo} BETWEEN 0 AND 3", name=f"{codigo}_0_a_3")
        for codigo in CODIGOS_GUSTOS
    )

    recinto_id: str = Field(foreign_key="recintos.id", primary_key=True, ondelete="CASCADE")
    historia: int
    artes_artesanias: int
    arquitectura: int
    gastronomia: int
    naturaleza: int
    aventura: int
