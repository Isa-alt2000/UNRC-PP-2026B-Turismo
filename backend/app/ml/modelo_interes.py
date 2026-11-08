import json
import logging
from dataclasses import dataclass
from functools import cache
from pathlib import Path
from typing import Annotated, Any

import joblib
import pandas as pd
import sklearn
from fastapi import Depends

from app.core.config import BACKEND
from app.core.exceptions import ServicioNoDisponible
from app.models.recintos import CODIGOS_GUSTOS

log = logging.getLogger(__name__)

CARPETA = BACKEND / "artifacts"
NOMBRE = "interes"
# primero gustos y luego afinidades como en entrenamiento
VARIABLES = [
    *(f"gusto_{codigo}" for codigo in CODIGOS_GUSTOS),
    *(f"afinidad_{codigo}" for codigo in CODIGOS_GUSTOS),
]


class ArtefactoInvalido(Exception):
    """El modelo publicado falta o no corresponde con este backend."""


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
    carpeta = carpeta or CARPETA
    ruta_json = carpeta / f"{NOMBRE}.json"
    ruta_joblib = carpeta / f"{NOMBRE}.joblib"
    if not ruta_json.exists() or not ruta_joblib.exists():
        raise ArtefactoInvalido(
            f"Faltan {ruta_json.name} o {ruta_joblib.name} en {carpeta}: "
            "cópialos desde data_science/ml/artifacts"
        )

    metadatos = json.loads(ruta_json.read_text(encoding="utf-8"))
    # revisar version de libreria sklearn
    if metadatos.get("version_sklearn") != sklearn.__version__:
        raise ArtefactoInvalido(
            f"El modelo se entrenó con scikit-learn {metadatos.get('version_sklearn')} "
            f"y el backend usa {sklearn.__version__}"
        )
    if metadatos.get("variables") != VARIABLES:
        raise ArtefactoInvalido("Las variables del modelo no coinciden con las del backend")
    umbral = metadatos.get("umbral")
    if not isinstance(umbral, int | float) or not 0 < umbral < 1:
        raise ArtefactoInvalido("El modelo no trae un umbral válido entre 0 y 1")

    return ModeloInteres(estimador=joblib.load(ruta_joblib), umbral=float(umbral))


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
