import logging
from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core.config import BACKEND, Settings
from app.core.exceptions import ErrorApp, RecursoNoEncontrado, registrar_manejadores
from app.core.logging import LOGGERS_CON_ARCHIVO, configurar_logging


# Configuración

def test_log_level_acepta_minusculas() -> None:
    assert Settings(_env_file=None, log_level="debug").log_level == "DEBUG"


def test_log_level_invalido_falla() -> None:
    with pytest.raises(ValidationError):
        Settings(_env_file=None, log_level="INFOO")


# Logging

@pytest.fixture
def archivo_log(tmp_path: Path) -> Iterator[Path]:
    """Archivo temporal de logs; al terminar deja los loggers como estaban."""
    loggers = [logging.getLogger(nombre) for nombre in LOGGERS_CON_ARCHIVO]
    handlers_originales = [list(logger.handlers) for logger in loggers]
    nivel_original = logging.getLogger().level
    yield tmp_path / "prueba.log"
    for logger, originales in zip(loggers, handlers_originales):
        for handler in set(logger.handlers) - set(originales):
            logger.removeHandler(handler)
            handler.close()
    logging.getLogger().setLevel(nivel_original)


def test_configurar_logging_fija_el_nivel(archivo_log: Path) -> None:
    configurar_logging("DEBUG", archivo_log)
    assert logging.getLogger().level == logging.DEBUG


def test_logs_de_la_app_y_de_uvicorn_llegan_al_archivo(archivo_log: Path) -> None:
    configurar_logging("INFO", archivo_log)
    logging.getLogger("app.prueba").info("mensaje de la app")
    logging.getLogger("uvicorn.error").error("mensaje de uvicorn")

    contenido = archivo_log.read_text(encoding="utf-8")
    assert "INFO app.prueba: mensaje de la app" in contenido
    assert "ERROR uvicorn.error: mensaje de uvicorn" in contenido


def test_configurar_dos_veces_no_duplica_mensajes(archivo_log: Path) -> None:
    configurar_logging("INFO", archivo_log)
    configurar_logging("INFO", archivo_log)
    logging.getLogger("app.prueba").info("una sola vez")

    assert archivo_log.read_text(encoding="utf-8").count("una sola vez") == 1


# Manejo de errores

class ErrorDePrueba(ErrorApp):
    codigo = 409


@pytest.fixture
def cliente() -> TestClient:
    app = FastAPI()
    registrar_manejadores(app)

    @app.get("/no-encontrado")
    def no_encontrado() -> None:
        raise RecursoNoEncontrado("Recinto no encontrado")

    @app.get("/subclase")
    def subclase() -> None:
        raise ErrorDePrueba("Conflicto")

    @app.get("/inesperado")
    def inesperado() -> None:
        raise ValueError("detalle interno que no debe verse")

    # Sin esto, TestClient vuelve a lanzar los errores inesperados en lugar de devolver la respuesta.
    return TestClient(app, raise_server_exceptions=False)


def test_recurso_no_encontrado_responde_404(cliente: TestClient) -> None:
    respuesta = cliente.get("/no-encontrado")
    assert respuesta.status_code == 404
    assert respuesta.json() == {"detail": "Recinto no encontrado"}


def test_subclase_usa_su_propio_codigo(cliente: TestClient) -> None:
    respuesta = cliente.get("/subclase")
    assert respuesta.status_code == 409
    assert respuesta.json() == {"detail": "Conflicto"}


def test_error_inesperado_no_expone_detalles(cliente: TestClient) -> None:
    respuesta = cliente.get("/inesperado")
    assert respuesta.status_code == 500
    assert respuesta.json() == {"detail": "Error interno del servidor"}


# Configuración: variables vacías y obligatorias

def test_obligatoria_vacia_falla(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("DATABASE_URL")
    env = tmp_path / ".env"
    env.write_text("DATABASE_URL=\n", encoding="utf-8")
    with pytest.raises(ValidationError, match="database_url"):
        Settings(_env_file=env)


def test_opcional_vacia_usa_el_valor_por_defecto(tmp_path: Path) -> None:
    env = tmp_path / ".env"
    env.write_text("LOG_LEVEL=\n", encoding="utf-8")
    assert Settings(_env_file=env).log_level == "INFO"


# Configuración: prefijo de la API

@pytest.mark.parametrize("prefijo", ["api/v1", "/api/v1/", "/"])
def test_prefijo_mal_formado_falla(prefijo: str) -> None:
    with pytest.raises(ValidationError, match="debe empezar con '/'"):
        Settings(_env_file=None, api_prefix=prefijo)


# Configuración: archivo de logs

def test_log_relativo_se_resuelve_desde_backend() -> None:
    assert Settings(_env_file=None, log_file="registro.log").log_file == BACKEND / "registro.log"


def test_log_absoluto_no_cambia(tmp_path: Path) -> None:
    archivo = tmp_path / "api.log"
    assert Settings(_env_file=None, log_file=archivo).log_file == archivo


# Configuración: rutas de SQLite

def test_sqlite_relativa_se_resuelve_desde_backend() -> None:
    config = Settings(_env_file=None, database_url="sqlite:///./datos.db")
    assert config.database_url == f"sqlite:///{BACKEND / 'datos.db'}"


@pytest.mark.parametrize("url", ["sqlite://", "sqlite:///:memory:", "sqlite:////ruta/absoluta/datos.db"])
def test_sqlite_en_memoria_o_absoluta_no_cambia(url: str) -> None:
    assert Settings(_env_file=None, database_url=url).database_url == url
