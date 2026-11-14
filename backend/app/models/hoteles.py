from sqlalchemy import CheckConstraint, Index
from sqlmodel import Field, SQLModel

# micro 0 a 10, pequena 11 a 50, mediana 51 a 100 y grande 101 o mas
TAMANOS_HOTEL = ("micro", "pequena", "mediana", "grande")


class Hotel(SQLModel, table=True):
    """Establecimiento de hospedaje del DENUE de INEGI (hoteles, moteles, cabañas, posadas, etc)"""

    __tablename__ = "hoteles"
    __table_args__ = (
        CheckConstraint("latitud BETWEEN -90 AND 90", name="hotel_latitud_valida"),
        CheckConstraint("longitud BETWEEN -180 AND 180", name="hotel_longitud_valida"),
        CheckConstraint(
            f"tamano IN ({', '.join(repr(t) for t in TAMANOS_HOTEL)})", name="hotel_tamano_valido"
        ),
        # Para buscar los hoteles cercanos a una parada con un recuadro de latitud y longitud
        Index("ix_hoteles_latitud_longitud", "latitud", "longitud"),
    )

    # El id del DENUE, no uno propio. Para actualizaciones consistentes
    id: int = Field(primary_key=True, sa_column_kwargs={"autoincrement": False})
    nombre: str
    tipo: str = Field(description="Hotel, Motel, Cabañas, Casa de huéspedes, etc.")
    codigo_scian: int = Field(description="Código de actividad del SCIAN, como 721112")
    tamano: str = Field(description="micro, pequena, mediana o grande, según el personal ocupado")
    telefono: str | None = Field(default=None, description="10 dígitos, como texto")
    sitio_web: str | None = None
    direccion: str | None = None
    localidad: str
    municipio: str
    latitud: float
    longitud: float
