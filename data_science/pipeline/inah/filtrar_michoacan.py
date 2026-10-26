"""Extrae los recintos de Michoacán de los CSV nacionales del INAH y los une en un solo archivo.

Lee datos/crudos/inah/ (zonas arqueológicas y museos) y escribe datos/procesados/inah_michoacan.csv.
Agrega la columna `tipo` (zona_arqueologica o museo) para saber de qué archivo viene cada fila.

Desde data_science/:
    uv run python -m pipeline.inah.filtrar_michoacan
"""

import pandas as pd

from config import CRUDOS, PROCESADOS

CARPETA_INAH = CRUDOS / "inah"
FUENTES = {
    "zona_arqueologica": CARPETA_INAH / "INAH_visitantes_zonas_general.csv",
    "museo": CARPETA_INAH / "INAH_visitantes_museos_general.csv",
}
ESTADO = "Michoacán"
SALIDA = PROCESADOS / "inah_michoacan.csv"


def leer_estado(ruta, tipo):
    # Se lee todo como texto para copiar los valores tal cual (los meses vacíos de 2026 quedan vacíos).
    datos = pd.read_csv(ruta, encoding="utf-8-sig", dtype=str, keep_default_na=False)
    filas = datos[datos["estado"].str.strip() == ESTADO].copy()
    filas.insert(filas.columns.get_loc("recinto") + 1, "tipo", tipo)
    return filas


def main():
    partes = [leer_estado(ruta, tipo) for tipo, ruta in FUENTES.items()]
    for tipo, parte in zip(FUENTES, partes):
        print(f"{tipo}: {len(parte)} filas, {parte['recinto'].nunique()} recintos")

    michoacan = pd.concat(partes, ignore_index=True)
    michoacan.to_csv(SALIDA, index=False, encoding="utf-8-sig")
    print(f"{SALIDA}: {len(michoacan)} filas")


if __name__ == "__main__":
    main()
