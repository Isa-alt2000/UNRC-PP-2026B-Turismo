"""Junta los dos formularios de la encuesta y genera la tabla de entrenamiento.

Cada respuesta válida genera 6 filas, una por recinto evaluado. La afinidad de cada gusto es
el gusto de la persona (1-5) por el valor del recinto en ese gusto (0-3). Ver `docs/encuesta.md`.

Desde `data_science/`:

    uv run python -m pipeline.encuesta.limpiar_encuesta
"""

import pandas as pd

from config import CRUDOS, ENCUESTA_PROCESADA

FORMULARIOS = {
    'A': CRUDOS / 'encuesta' / 'encuesta_parte_a.csv',
    'B': CRUDOS / 'encuesta' / 'encuesta_parte_b.csv',
}
SALIDA = ENCUESTA_PROCESADA

GUSTOS = ['historia', 'artes_artesanias', 'arquitectura', 'gastronomia', 'naturaleza', 'aventura']
RESPUESTA_CONTROL = 2
UMBRAL_INTENCION = 4

# Valores de los recintos (0-3 por gusto, tamaño 1-3), copiados de "Reparto de recintos" en docs/encuesta.md. El orden es el del formulario.
COLUMNAS_RECINTOS = ['parte_encuesta', 'orden', 'recinto_id', *GUSTOS, 'tamano']

# tentativos
RECINTOS = pd.DataFrame(
    [
        ('A', 1, 'tzintzuntzan', 3, 0, 2, 0, 2, 0, 3),
        ('A', 2, 'santa_clara_del_cobre', 1, 3, 1, 1, 0, 0, 2),
        ('A', 3, 'paricutin', 2, 0, 1, 0, 3, 3, 3),
        ('A', 4, 'museo_regional_michoacano', 3, 1, 2, 0, 0, 0, 2),
        ('A', 5, 'centro_historico_morelia', 2, 1, 3, 2, 0, 0, 3),
        ('A', 6, 'lago_zirahuen', 0, 0, 0, 2, 3, 2, 2),
        ('B', 1, 'tingambato', 3, 0, 1, 0, 2, 0, 1),
        ('B', 2, 'quiroga', 1, 2, 1, 3, 0, 0, 2),
        ('B', 3, 'santuario_monarca_el_rosario', 0, 0, 0, 0, 3, 2, 3),
        ('B', 4, 'museo_artes_oficios_patzcuaro', 1, 3, 1, 0, 0, 0, 1),
        ('B', 5, 'ex_convento_cuitzeo', 3, 1, 3, 0, 1, 0, 2),
        ('B', 6, 'tlalpujahua', 2, 2, 2, 1, 1, 1, 2),
    ],
    columns=COLUMNAS_RECINTOS,
)

# Columnas del formulario, en orden. Las de los recintos vienen después, en pares (interés, tiempo), en el orden de RECINTOS.
COLUMNAS_INICIALES = [
    'marca_temporal',
    'consentimiento',        # 1.1
    'gusto_historia',        # 2.1
    'gusto_artes_artesanias',
    'gusto_arquitectura',
    'gusto_gastronomia',
    'control_atencion',      # 2.7, va después de la 2.4
    'gusto_naturaleza',
    'gusto_aventura',
]
INICIO_PREGUNTA_INTERES = '¿Qué tanto te gustaría incluir'
INICIO_PREGUNTA_TIEMPO = 'Si visitaras'

# Rango como aparece en el formulario → (código, punto medio en minutos).
RANGOS_MINUTOS = {
    'Menos de 30 min': ('menos_30', 20),
    '30 min a 1 h': ('30_60', 45),
    '1 a 2 h': ('60_120', 90),
    '2 a 3 h': ('120_180', 150),
    '3 a 5 h': ('180_300', 240),
    'Más de 5 h': ('mas_300', 330),
}

COLUMNAS_SALIDA = [
    'persona_id', 'parte_encuesta', 'recinto_id',
    *[f'gusto_{g}' for g in GUSTOS],
    *[f'recinto_{g}' for g in GUSTOS],
    'recinto_tamano',
    *[f'afinidad_{g}' for g in GUSTOS],
    'calificacion_interes', 'intencion', 'rango_minutos', 'minutos',
]


class EncuestaInvalida(Exception):
    """El formulario no tiene el formato o los valores esperados."""


def renombrar(formulario: pd.DataFrame, recinto_ids: list[str], parte: str) -> pd.DataFrame:
    """Pone nombres cortos a las columnas y comprueba que el formulario tenga el orden esperado."""
    columnas_recintos = [c for r in recinto_ids for c in (f'interes__{r}', f'rango__{r}')]
    nombres = [*COLUMNAS_INICIALES, *columnas_recintos, 'comentarios']
    if len(formulario.columns) != len(nombres):
        raise EncuestaInvalida(
            f'Parte {parte}: tiene {len(formulario.columns)} columnas y se esperaban {len(nombres)}.'
        )
    inicio = len(COLUMNAS_INICIALES)
    for i, recinto_id in enumerate(recinto_ids):
        interes, tiempo = formulario.columns[inicio + 2 * i : inicio + 2 * i + 2]
        if not (interes.startswith(INICIO_PREGUNTA_INTERES) and tiempo.startswith(INICIO_PREGUNTA_TIEMPO)):
            raise EncuestaInvalida(f'Parte {parte}: las columnas de {recinto_id} no están en su lugar.')
    return formulario.set_axis(nombres, axis='columns')


def enteros_entre(serie: pd.Series, minimo: int, maximo: int, nombre: str) -> pd.Series:
    valores = pd.to_numeric(serie, errors='coerce')
    if not (valores.between(minimo, maximo) & valores.mod(1).eq(0)).all():
        raise EncuestaInvalida(f'{nombre} debe contener enteros de {minimo} a {maximo}.')
    return valores.astype(int)


def leer_formularios(recintos: pd.DataFrame) -> pd.DataFrame:
    partes = []
    for parte, ruta in FORMULARIOS.items():
        recinto_ids = recintos.loc[recintos['parte_encuesta'] == parte, 'recinto_id'].tolist()
        formulario = pd.read_csv(ruta, encoding='utf-8-sig', dtype=str)
        partes.append(renombrar(formulario, recinto_ids, parte).assign(parte_encuesta=parte))
    return pd.concat(partes, ignore_index=True)


def limpiar(respuestas: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, int]]:
    """Quita las respuestas sin consentimiento o que fallaron el control de atención."""
    reporte = {'respuestas': len(respuestas)}

    con_consentimiento = respuestas['consentimiento'].str.strip().str.lower().isin(['sí', 'si'])
    reporte['sin consentimiento'] = int((~con_consentimiento).sum())
    respuestas = respuestas[con_consentimiento]

    pasa_control = pd.to_numeric(respuestas['control_atencion'], errors='coerce').eq(RESPUESTA_CONTROL)
    reporte['fallaron el control de atención'] = int((~pasa_control).sum())
    respuestas = respuestas[pasa_control].copy()
    return respuestas, reporte


def a_formato_largo(respuestas: pd.DataFrame, recintos: pd.DataFrame) -> pd.DataFrame:
    """Una fila por persona × recinto que vio."""
    columnas_persona = ['persona_id', 'parte_encuesta', *[f'gusto_{g}' for g in GUSTOS]]
    filas = []
    for recinto in recintos.itertuples(index=False):
        personas = respuestas[respuestas['parte_encuesta'] == recinto.parte_encuesta]
        fila = personas[columnas_persona].copy()
        fila['recinto_id'] = recinto.recinto_id
        fila['orden'] = recinto.orden
        for gusto in GUSTOS:
            fila[f'recinto_{gusto}'] = getattr(recinto, gusto)
        fila['recinto_tamano'] = recinto.tamano
        fila['calificacion_interes'] = enteros_entre(
            personas[f'interes__{recinto.recinto_id}'], 1, 5, f'Interés en {recinto.recinto_id}'
        )
        rango = personas[f'rango__{recinto.recinto_id}'].str.strip()
        if not rango.isin(list(RANGOS_MINUTOS)).all():
            raise EncuestaInvalida(f'Rango de tiempo no reconocido en {recinto.recinto_id}.')
        fila['rango_minutos'] = rango.map(lambda r: RANGOS_MINUTOS[r][0])
        fila['minutos'] = rango.map(lambda r: RANGOS_MINUTOS[r][1])
        filas.append(fila)

    datos = pd.concat(filas, ignore_index=True)
    for gusto in GUSTOS:
        datos[f'afinidad_{gusto}'] = datos[f'gusto_{gusto}'] * datos[f'recinto_{gusto}']
    datos['intencion'] = (datos['calificacion_interes'] >= UMBRAL_INTENCION).astype(int)
    return datos.sort_values(['persona_id', 'orden'])


def procesar(respuestas: pd.DataFrame, recintos: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, int]]:
    respuestas, reporte = limpiar(respuestas)
    respuestas['persona_id'] = range(1, len(respuestas) + 1)
    for gusto in GUSTOS:
        respuestas[f'gusto_{gusto}'] = enteros_entre(
            respuestas[f'gusto_{gusto}'], 1, 5, f'gusto_{gusto}'
        )
    datos = a_formato_largo(respuestas, recintos)

    # Todo sí o todo no: la misma calificación en los 6 recintos.
    misma_calificacion = datos.groupby('persona_id')['calificacion_interes'].transform('nunique').eq(1)
    reporte['misma calificación en los 6 recintos'] = datos.loc[misma_calificacion, 'persona_id'].nunique()
    datos = datos[~misma_calificacion].copy()

    # Se vuelve a numerar para que los persona_id queden consecutivos.
    datos['persona_id'] = pd.factorize(datos['persona_id'])[0] + 1
    personas = datos.drop_duplicates('persona_id')
    reporte['válidas'] = len(personas)
    for parte, cantidad in personas['parte_encuesta'].value_counts().sort_index().items():
        reporte[f'parte {parte}'] = int(cantidad)
    return datos[COLUMNAS_SALIDA].reset_index(drop=True), reporte


def main() -> None:
    datos, reporte = procesar(leer_formularios(RECINTOS), RECINTOS)
    datos.to_csv(SALIDA, index=False, encoding='utf-8-sig')
    for criterio, cantidad in reporte.items():
        print(f'{criterio}: {cantidad}')
    print(f'{SALIDA}: {len(datos)} filas')


if __name__ == '__main__':
    main()
