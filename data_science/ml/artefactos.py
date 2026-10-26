"""Guarda un modelo entrenado para que lo cargue el backend.

Cada modelo son dos archivos con el mismo nombre en `ml/modelos/`:

- `<nombre>.joblib`: el estimador.
- `<nombre>.json`: la versión de scikit-learn y las columnas de X, en orden.

Para publicarlo, copia ambos archivos al backend.
"""

import json
from datetime import date

import joblib
import sklearn

from config import MODELOS


def guardar_modelo(modelo, nombre: str, variables: list[str], **metadatos) -> None:
    MODELOS.mkdir(parents=True, exist_ok=True)
    joblib.dump(modelo, MODELOS / f'{nombre}.joblib')
    contenido = {
        'version_sklearn': sklearn.__version__,
        'variables': list(variables),
        'fecha_entrenamiento': date.today().isoformat(),
        **metadatos,
    }
    (MODELOS / f'{nombre}.json').write_text(
        json.dumps(contenido, ensure_ascii=False, indent=2), encoding='utf-8'
    )
    print(f'Guardado: {MODELOS / nombre}.joblib y .json')
