"""
Constantes de configuración.
"""
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
CRUDOS = RAIZ / "datos" / "crudos"
PROCESADOS = RAIZ / "datos" / "procesados"
ARTIFACTS = RAIZ / "ml" / "artifacts"

# Tabla de entrenamiento que genera pipeline.encuesta.limpiar_encuesta y leen los modelos de ml
ENCUESTA_PROCESADA = PROCESADOS / "encuesta_procesada.csv"
