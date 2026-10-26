import pandas as pd
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

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

    'afinidad_historia',
    'afinidad_artes_artesanias',
    'afinidad_arquitectura',
    'afinidad_gastronomia',
    'afinidad_naturaleza',
    'afinidad_aventura',
]
CRITERIO = 'gini'  # gini o entropy

datos = pd.read_csv(RUTA_DATOS, encoding='utf-8-sig')
X = datos[VARIABLES_ENTRADA]
y = datos['intencion']

# Separar por persona: las filas de una misma persona no pueden quedar en entrenamiento y en prueba a la vez.
split = GroupShuffleSplit(n_splits=1, test_size=0.30, random_state=42)
idx_tr, idx_te = next(split.split(X, y, groups=datos['persona_id']))
Xtr, Xte, ytr, yte = X.iloc[idx_tr], X.iloc[idx_te], y.iloc[idx_tr], y.iloc[idx_te]

modelo = DecisionTreeClassifier(max_depth=4, min_samples_leaf=4, criterion=CRITERIO, random_state=42)
modelo.fit(Xtr, ytr)
p = modelo.predict(Xte)

print("Exactitud:", accuracy_score(yte, p))
print("Precisión:", precision_score(yte, p, zero_division=0))
print("Recall:", recall_score(yte, p, zero_division=0))
print("F1:", f1_score(yte, p, zero_division=0))
print("Matriz de confusión [[TN FP], [FN TP]]:")
print(confusion_matrix(yte, p, labels=[0, 1]))

modelo.fit(X, y)
print("\nReglas del modelo final (0=No, 1=Sí):")
print(export_text(modelo, feature_names=VARIABLES_ENTRADA))

guardar_modelo(modelo, 'interes_arbol', VARIABLES_ENTRADA, datos=RUTA_DATOS.name)
