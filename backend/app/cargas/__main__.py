import argparse
import sys
from pathlib import Path

from sqlmodel import Session

from app.cargas import CARPETA, TABLAS, ErrorCarga, cargar
from app.core.db import engine


def main() -> int:
    parser = argparse.ArgumentParser(prog="python -m app.cargas", description="Carga los CSV de datos_iniciales/ a la base.")
    parser.add_argument("tablas", nargs="*", help=f"Tablas a cargar (por defecto todas): {', '.join(TABLAS)}")
    parser.add_argument("--carpeta", type=Path, default=CARPETA, help=f"Por defecto {CARPETA}")
    argumentos = parser.parse_args()

    try:
        with Session(engine) as session:
            resultados = cargar(session, argumentos.carpeta, argumentos.tablas)
    except ErrorCarga as error:
        print(f"No se cargó nada. Corrige lo siguiente ({len(error.errores)}):", file=sys.stderr)
        for mensaje in error.errores:
            print(f"  {mensaje}", file=sys.stderr)
        return 1

    for nombre, resultado in resultados.items():
        print(f"{nombre}: {resultado.nuevos} nuevos, {resultado.actualizados} actualizados")
    return 0


if __name__ == "__main__":
    sys.exit(main())
