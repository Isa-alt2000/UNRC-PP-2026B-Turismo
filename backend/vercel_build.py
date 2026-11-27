"""Build de Vercel: crea turismo.db con las migraciones y los CSV, y la deja dentro del deploy.

Vercel lo corre después de instalar dependencias (ver [tool.vercel.scripts] en pyproject.toml).
Los CSV se leen de data_science/datos/procesados/. Si Vercel no deja ver fuera de backend/,
se usan los de datos_iniciales/.

En Vercel el disco es de solo lectura: la API puede leer la base, pero el panel de admin no puede
modificarla. Para cambiar el catálogo se edita el CSV y se vuelve a desplegar.
"""

import subprocess
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent
PROCESADOS = BACKEND.parent / "data_science" / "datos" / "procesados"
DATOS_INICIALES = BACKEND / "datos_iniciales"
ARCHIVOS = ("puntos_partida.csv", "recintos.csv", "hoteles.csv")


def carpeta_de_csv() -> Path:
    for carpeta in (PROCESADOS, DATOS_INICIALES):
        if all((carpeta / archivo).is_file() for archivo in ARCHIVOS):
            return carpeta
    sys.exit(f"Faltan {', '.join(ARCHIVOS)} en {PROCESADOS} y en {DATOS_INICIALES}")


def correr(*argumentos: str) -> None:
    print("$", " ".join(argumentos), flush=True)
    subprocess.run([sys.executable, *argumentos], cwd=BACKEND, check=True)


def main() -> None:
    carpeta = carpeta_de_csv()
    print(f"CSV desde {carpeta}", flush=True)
    correr("-m", "alembic", "upgrade", "head")
    correr("-m", "app.cargas", "--carpeta", str(carpeta))


if __name__ == "__main__":
    main()
