"""Modelo que estima cuántos minutos pasa una persona en un recinto."""

import logging
from dataclasses import dataclass
from functools import cache
from pathlib import Path
from typing import Annotated, Any

import pandas as pd
from fastapi import Depends

from app.core.exceptions import ServicioNoDisponible
from app.ml.artefactos import CARPETA, ArtefactoInvalido, leer_artefacto
from app.models.recintos import CODIGOS_GUSTOS

log = logging.getLogger(__name__)

NOMBRE = "minutos"
# gustos de la persona, valores del recinto y su tamaño, como en entrenamiento
VARIABLES = [
    *(f"gusto_{codigo}" for codigo in CODIGOS_GUSTOS),
    *(f"recinto_{codigo}" for codigo in CODIGOS_GUSTOS),
    "recinto_tamano",
]


@dataclass(frozen=True)
class ModeloMinutos:
    estimador: Any

    def minutos(self, filas: list[dict[str, float]]) -> list[float]:
        """Minutos estimados de visita de cada fila, en una sola llamada al modelo."""
        datos = pd.DataFrame(filas, columns=VARIABLES)
        return self.estimador.predict(datos).tolist()


def leer_modelo(carpeta: Path | None = None) -> ModeloMinutos:
    estimador, _ = leer_artefacto(carpeta or CARPETA, NOMBRE, VARIABLES)
    return ModeloMinutos(estimador=estimador)


@cache
def modelo_minutos() -> ModeloMinutos:
    """Se lee una sola vez, la primera vez que se necesita, y queda en memoria."""
    try:
        modelo = leer_modelo()
    except ArtefactoInvalido as error:
        log.error(f"modelo_minutos cargado=false error={error}")
        raise ServicioNoDisponible("El modelo de tiempos de visita no está disponible") from error
    log.info("modelo_minutos cargado=true")
    return modelo


ModeloMinutosDep = Annotated[ModeloMinutos, Depends(modelo_minutos)]
