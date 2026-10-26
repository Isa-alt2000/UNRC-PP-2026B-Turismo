import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import confusion_matrix, f1_score, precision_score, recall_score
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from config import ENCUESTA_PROCESADA
from ml.artefactos import guardar_modelo

# Lo genera pipeline.encuesta.limpiar_encuesta.
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


def evaluar_umbral(y_real, proba, umbral):
    pred = (proba >= umbral).astype(int)
    cm = confusion_matrix(y_real, pred, labels=[0, 1])
    prec = precision_score(y_real, pred, zero_division=0)
    rec = recall_score(y_real, pred, zero_division=0)
    f1 = f1_score(y_real, pred, zero_division=0)
    return cm, prec, rec, f1


datos = pd.read_csv(RUTA_DATOS, encoding='utf-8-sig')
X = datos[VARIABLES_ENTRADA]
y = datos['intencion']

# Separar por persona
split = GroupShuffleSplit(n_splits=1, test_size=0.30, random_state=42)
idx_tr, idx_te = next(split.split(X, y, groups=datos['persona_id']))
Xtr, Xte, ytr, yte = X.iloc[idx_tr], X.iloc[idx_te], y.iloc[idx_tr], y.iloc[idx_te]

# StandardScaler pone gustos (1-5) y afinidades (0-15) en la misma escala.
modelo = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))
modelo.fit(Xtr, ytr)
proba = modelo.predict_proba(Xte)[:, 1]

umbrales = [0.4]

for t in umbrales:
    cm, prec, rec, f1 = evaluar_umbral(yte, proba, t)
    tn, fp, fn, tp = cm.ravel()
    print(f"\nUmbral t={t}")
    print("Matriz de confusión [[TN FP], [FN TP]]:\n", cm)
    print(f"TN={tn}, FP={fp}, FN={fn}, TP={tp}")
    print(f"Precision={prec:.3f}\nRecall={rec:.3f}\nF1={f1:.3f}")

# Modelo final con todos los datos
modelo.fit(X, y)
guardar_modelo(modelo, 'interes', VARIABLES_ENTRADA, datos=RUTA_DATOS.name)
