"""no necesita uv, usa estandar"""
import argparse
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path

RAIZ = Path(__file__).resolve().parent


@dataclass(frozen=True)
class Grupo:
    origen: Path
    destino: Path
    archivos: dict[str, str]


GRUPOS = {
    "datos": Grupo(
        origen=RAIZ / "data_science" / "datos" / "procesados",
        destino=RAIZ / "backend" / "datos_iniciales",
        archivos={
            "puntos_partida.csv": "catálogo fijo, versionado en data_science/datos/procesados/",
            "recintos.csv": "export CSV de la hoja \"Catalogo de recintos\" de Google Sheets, guardado en data_science/datos/procesados/recintos.csv",
            "hoteles.csv": "cd data_science && uv run python -m pipeline.denue.hoteles",
        },
    ),
    "modelos": Grupo(
        origen=RAIZ / "data_science" / "ml" / "artifacts",
        destino=RAIZ / "backend" / "artifacts",
        archivos={
            "interes.joblib": "cd data_science && uv run python -m ml.regresion_logistica",
            "interes.json": "cd data_science && uv run python -m ml.regresion_logistica",
            "minutos.joblib": "cd data_science && uv run python -m ml.arbol_regresion",
            "minutos.json": "cd data_science && uv run python -m ml.arbol_regresion",
        },
    ),
}


def faltantes(grupo: Grupo) -> list[str]:
    return [nombre for nombre in grupo.archivos if not (grupo.origen / nombre).is_file()]


def copiar(nombre: str, grupo: Grupo) -> None:
    grupo.destino.mkdir(parents=True, exist_ok=True)
    for archivo in grupo.archivos:
        shutil.copy2(grupo.origen / archivo, grupo.destino / archivo)
        if archivo.endswith(".csv"):
            filas = sum(1 for _ in (grupo.destino / archivo).open(encoding="utf-8")) - 1
            print(f"  {archivo}: {filas} filas")
        else:
            print(f"  {archivo}")
    print(f"{nombre}: copiados a {grupo.destino}")


def main() -> int:
    parser = argparse.ArgumentParser(
        prog="python3 copiar_al_backend.py", description="Copia al backend los CSV de datos iniciales y los modelos entrenados."
    )
    parser.add_argument("grupos", nargs="*", choices=list(GRUPOS), help="Qué copiar; sin nada, ambos")
    pedidos = parser.parse_args().grupos or list(GRUPOS)

    # Se revisan todos antes de copiar: o se copia todo lo pedido, o nada.
    problemas = {nombre: faltantes(GRUPOS[nombre]) for nombre in pedidos}
    if any(problemas.values()):
        for nombre, faltan in problemas.items():
            for archivo in faltan:
                print(f"Falta {archivo} en {GRUPOS[nombre].origen}: {GRUPOS[nombre].archivos[archivo]}")
        return 1

    for nombre in pedidos:
        copiar(nombre, GRUPOS[nombre])
    return 0


if __name__ == "__main__":
    sys.exit(main())
