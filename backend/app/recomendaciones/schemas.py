from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, ConfigDict, Field

from app.models.recintos import CODIGOS_GUSTOS

NivelGusto = Annotated[int, Field(ge=1, le=5)]
Afluencia = Literal["baja", "media", "alta", "sin_datos"]
Etiqueta = Literal["familiar", "chico", "mediano", "grande"]


def revisar_gustos(gustos: dict[str, int]) -> dict[str, int]:
    """Exige exactamente los gustos del catálogo"""
    faltan = set(CODIGOS_GUSTOS) - gustos.keys()
    sobran = gustos.keys() - set(CODIGOS_GUSTOS)
    if faltan or sobran:
        detalle = [f"faltan: {', '.join(sorted(faltan))}"] if faltan else []
        detalle += [f"no existen: {', '.join(sorted(sobran))}"] if sobran else []
        raise ValueError("; ".join(detalle))
    return gustos


Gustos = Annotated[
    dict[str, NivelGusto],
    AfterValidator(revisar_gustos),
    Field(description="Nivel de 1 a 5 de cada gusto del catálogo, por su codigo"),
]


class SolicitudRecomendaciones(BaseModel):
    """Respuestas del turista en la pantalla de gustos."""

    model_config = ConfigDict(extra="forbid")

    gustos: Gustos
    mes: int = Field(ge=1, le=12, description="Mes del viaje, se usará para la afluencia")
    con_dependientes: bool = False


class RecintoRecomendado(BaseModel):
    id: str = Field(examples=["R0001"])
    nombre: str
    descripcion: str | None
    probabilidad: float = Field(ge=0, le=1)
    afluencia: Afluencia
    etiquetas: list[Etiqueta]


class RespuestaRecomendaciones(BaseModel):
    recintos: list[RecintoRecomendado] = Field(
        description="Hasta 10 recintos afines, de mayor a menor probabilidad"
    )
    recintos_por_afluencia: list[RecintoRecomendado] = Field(
        description="3 sugerencias de menor afluencia si hay 3 afines o menos; si no, vacío"
    )
