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

__all__ = ["VARIABLES", "ArtefactoInvalido", "ModeloInteres", "leer_modelo", "modelo_interes"]

log = logging.getLogger(__name__)

NOMBRE = "interes"
# primero gustos y luego afinidades como en entrenamiento
VARIABLES = [
    *(f"gusto_{codigo}" for codigo in CODIGOS_GUSTOS),
    *(f"afinidad_{codigo}" for codigo in CODIGOS_GUSTOS),
]


@dataclass(frozen=True)
class ModeloInteres:
    estimador: Any
    umbral: float

    def probabilidades(self, filas: list[dict[str, float]]) -> list[float]:
        """Probabilidad de interés de cada fila, en una sola llamada al modelo."""
        # Las columnas se fijan en el orden de entrenamiento, sin importar el de cada fila.
        datos = pd.DataFrame(filas, columns=VARIABLES)
        return self.estimador.predict_proba(datos)[:, 1].tolist()


def leer_modelo(carpeta: Path | None = None) -> ModeloInteres:
    """Lee y valida el modelo; falla con un mensaje claro si no se puede usar."""
    estimador, metadatos = leer_artefacto(carpeta or CARPETA, NOMBRE, VARIABLES)
    umbral = metadatos.get("umbral")
    if not isinstance(umbral, int | float) or not 0 < umbral < 1:
        raise ArtefactoInvalido("El modelo no trae un umbral válido entre 0 y 1")
    return ModeloInteres(estimador=estimador, umbral=float(umbral))


@cache
def modelo_interes() -> ModeloInteres:
    """Se lee una sola vez, la primera vez que se necesita, y queda en memoria."""
    try:
        modelo = leer_modelo()
    except ArtefactoInvalido as error:
        log.error(f"No se pudo cargar el modelo de interés: {error}")
        raise ServicioNoDisponible("El modelo de recomendaciones no está disponible") from error
    log.info(f"Modelo de interés cargado, umbral {modelo.umbral}")
    return modelo


ModeloInteresDep = Annotated[ModeloInteres, Depends(modelo_interes)]
