import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

FORMATO = "%(asctime)s %(levelname)s %(name)s: %(message)s"
TAMANO_MAXIMO = 1_000_000
RESPALDOS = 3


LOGGERS_CON_ARCHIVO = ("", "uvicorn", "uvicorn.access")


def configurar_logging(nivel: str, archivo: Path) -> None:
    """Configura el logger raíz. Cada módulo crea el suyo con logging.getLogger(__name__).
    Los mensajes salen en la terminal y se guardan en archivo.
    """
    logging.basicConfig(format=FORMATO)
    raiz = logging.getLogger()
    raiz.setLevel(nivel)

    # Evita duplicar el handler si se configura más de una vez en el mismo proceso.
    ruta = str(archivo.resolve())
    if any(getattr(h, "baseFilename", None) == ruta for h in raiz.handlers):
        return

    manejador = RotatingFileHandler(
        archivo, maxBytes=TAMANO_MAXIMO, backupCount=RESPALDOS, encoding="utf-8"
    )
    manejador.setFormatter(logging.Formatter(FORMATO))
    for nombre in LOGGERS_CON_ARCHIVO:
        logging.getLogger(nombre).addHandler(manejador)
