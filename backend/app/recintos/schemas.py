from typing import Annotated, Self

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    field_validator,
    model_validator,
)

# id como RXXXX lo genera el back
PATRON_CLAVE = r"^R\d{4,}$"


def a_clave(numero: int) -> str:
    return f"R{numero:04d}"


def a_numero(clave: str) -> int:
    return int(clave.removeprefix("R"))


Texto = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
Valor = Annotated[int, Field(ge=0, le=3)]
Latitud = Annotated[float, Field(ge=-90, le=90)]
Longitud = Annotated[float, Field(ge=-180, le=180)]
Tamano = Annotated[int, Field(ge=1, le=3, description="1 chico, 2 mediano, 3 grande")]


class ValoresRecinto(BaseModel):
    """schema de recinto para valores de gustos"""

    model_config = ConfigDict(extra="forbid", from_attributes=True)

    historia: Valor
    artes_artesanias: Valor
    arquitectura: Valor
    gastronomia: Valor
    naturaleza: Valor
    aventura: Valor


class RecintoCrear(BaseModel):
    """schema post recinto"""

    model_config = ConfigDict(extra="forbid")

    nombre: Texto
    descripcion: str | None = None
    latitud: Latitud
    longitud: Longitud
    tamano: Tamano
    es_apto_dependientes: bool = True
    valores: ValoresRecinto


class RecintoActualizar(BaseModel):
    """schema patch recinto"""

    model_config = ConfigDict(extra="forbid")

    nombre: Texto | None = None
    descripcion: str | None = None
    latitud: Latitud | None = None
    longitud: Longitud | None = None
    tamano: Tamano | None = None
    es_apto_dependientes: bool | None = None

    @model_validator(mode="after")
    def sin_nulos_obligatorios(self) -> Self:
        nulos = [
            campo
            for campo in self.model_fields_set - {"descripcion"}
            if getattr(self, campo) is None
        ]
        if nulos:
            raise ValueError(f"no pueden ser nulos: {', '.join(sorted(nulos))}")
        return self


class RecintoPublico(BaseModel):
    """schema get recinto"""

    model_config = ConfigDict(from_attributes=True)

    id: str = Field(examples=["R0001"])
    nombre: str
    descripcion: str | None
    latitud: float
    longitud: float
    tamano: int
    es_apto_dependientes: bool
    valores: ValoresRecinto | None

    @field_validator("id", mode="before")
    @classmethod
    def numero_a_clave(cls, valor: object) -> object:
        return a_clave(valor) if isinstance(valor, int) else valor
