"""Pasa las visitas del INAH de Michoacán a formato largo: una fila por recinto, año y mes.

Lee datos/procesados/inah_michoacan.csv (de filtrar_michoacan) y escribe
datos/procesados/visitas_mensuales.csv. Los meses sin dato (por ejemplo, los que faltan del año en
curso) no generan fila.

Desde data_science/:
    uv run python -m pipeline.inah.visitas_mensuales
"""

import pandas as pd

from config import PROCESADOS

ENTRADA = PROCESADOS / "inah_michoacan.csv"
SALIDA = PROCESADOS / "visitas_mensuales.csv"
MESES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]
LLAVES = ["clave_siinah", "recinto", "tipo", "anio"]


def a_formato_largo(michoacan: pd.DataFrame) -> pd.DataFrame:
    partes = []
    for numero, mes in enumerate(MESES, start=1):
        parte = michoacan[LLAVES].copy()
        parte["mes"] = numero
        parte["nacionales"] = pd.to_numeric(michoacan[f"{mes}_nac"], errors="coerce")
        parte["extranjeros"] = pd.to_numeric(michoacan[f"{mes}_ext"], errors="coerce")
        partes.append(parte)
    visitas = pd.concat(partes, ignore_index=True)

    # Un mes cuenta si tiene al menos uno de los dos datos el que falte se toma como 0
    visitas = visitas.dropna(subset=["nacionales", "extranjeros"], how="all")
    visitas[["nacionales", "extranjeros"]] = visitas[["nacionales", "extranjeros"]].fillna(0).astype(int)

    if visitas.duplicated(["clave_siinah", "anio", "mes"]).any():
        raise ValueError("Hay recintos con más de un dato para el mismo año y mes.")
    return visitas.sort_values(["clave_siinah", "anio", "mes"]).reset_index(drop=True)


def main():
    michoacan = pd.read_csv(ENTRADA, encoding="utf-8-sig")
    visitas = a_formato_largo(michoacan)
    visitas.to_csv(SALIDA, index=False, encoding="utf-8-sig")
    print(
        f"{SALIDA}: {len(visitas)} filas, {visitas['clave_siinah'].nunique()} recintos, "
        f"{visitas['anio'].min()}-{visitas['anio'].max()}"
    )


if __name__ == "__main__":
    main()
