"""Lectura de los modelos que publica data_science en backend/artifacts."""

import json
from pathlib import Path
from typing import Any

import joblib
import sklearn

from app.core.config import BACKEND

CARPETA = BACKEND / "artifacts"


class ArtefactoInvalido(Exception):
    """El modelo publicado falta o no corresponde con este backend."""


def leer_artefacto(carpeta: Path, nombre: str, variables: list[str]) -> tuple[Any, dict[str, Any]]:
    """Lee <nombre>.joblib y <nombre>.json y comprueba que se puedan usar aquí.

    Devuelve el estimador y los metadatos, para que cada modelo valide los suyos.
    """
    ruta_json = carpeta / f"{nombre}.json"
    ruta_joblib = carpeta / f"{nombre}.joblib"
    if not ruta_json.exists() or not ruta_joblib.exists():
        raise ArtefactoInvalido(
            f"Faltan {ruta_json.name} o {ruta_joblib.name} en {carpeta}: "
            "cópialos desde data_science/ml/artifacts"
        )

    metadatos = json.loads(ruta_json.read_text(encoding="utf-8"))
    if metadatos.get("version_sklearn") != sklearn.__version__:
        raise ArtefactoInvalido(
            f"El modelo se entrenó con scikit-learn {metadatos.get('version_sklearn')} "
            f"y el backend usa {sklearn.__version__}"
        )
    if metadatos.get("variables") != variables:
        raise ArtefactoInvalido("Las variables del modelo no coinciden con las del backend")

    return joblib.load(ruta_joblib), metadatos
