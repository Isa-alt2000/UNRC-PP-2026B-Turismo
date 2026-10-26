import pandas as pd
from sklearn.tree import DecisionTreeRegressor, export_text
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import mean_absolute_error

from config import ENCUESTA_PROCESADA
from ml.artefactos import guardar_modelo

RUTA_DATOS = ENCUESTA_PROCESADA
VARIABLES_ENTRADA = [
    'gusto_historia',
    'gusto_artes_artesanias',
    'gusto_arquitectura',
    'gusto_gastronomia',
    'gusto_naturaleza',
    'gusto_aventura',

    'recinto_historia',
    'recinto_artes_artesanias',
    'recinto_arquitectura',
    'recinto_gastronomia',
    'recinto_naturaleza',
    'recinto_aventura',
    'recinto_tamano',
]

datos = pd.read_csv(RUTA_DATOS, encoding='utf-8-sig')

# Solo recintos que la persona sí incluiría.
datos = datos[datos['intencion'] == 1].reset_index(drop=True)
X = datos[VARIABLES_ENTRADA]
y = datos['minutos']

# Separar por persona
split = GroupShuffleSplit(n_splits=1, test_size=0.30, random_state=42)

idx_tr, idx_te = next(split.split(X, y, groups=datos['persona_id']))
Xtr, Xte, ytr, yte = X.iloc[idx_tr], X.iloc[idx_te], y.iloc[idx_tr], y.iloc[idx_te]

modelo = DecisionTreeRegressor(max_depth=2, min_samples_leaf=8, random_state=42)
modelo.fit(Xtr, ytr)
p = modelo.predict(Xte)

print(f"MAE: {mean_absolute_error(yte, p):.2f} minutos")

modelo.fit(X, y)
print("\nReglas del modelo final (value indica minutos):")
print(export_text(modelo, feature_names=VARIABLES_ENTRADA))

guardar_modelo(modelo, 'minutos', VARIABLES_ENTRADA, datos=RUTA_DATOS.name)
