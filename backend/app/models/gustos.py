from sqlmodel import Field, SQLModel


class Gusto(SQLModel, table=True):
    """Catálogo de las dimensiones de interés que comparten el turista y los recintos. Solo consulta."""

    __tablename__ = "gustos"

    codigo: str = Field(primary_key=True, description="Como historia o artes_artesanias")
    nombre: str = Field(description="Nombre para mostrar, como Artes y artesanías")
    pregunta: str = Field(description="Pregunta con la que el turista califica este gusto del 1 al 5")
    orden: int = Field(unique=True, description="Posición en la que se muestra")
