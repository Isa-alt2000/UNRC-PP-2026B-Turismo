"""Excepciones del dominio y su traducción a respuestas HTTP."""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


class ErrorApp(Exception):
    """Base de las excepciones del dominio."""

    codigo = status.HTTP_500_INTERNAL_SERVER_ERROR


class RecursoNoEncontrado(ErrorApp):
    """El recurso solicitado no existe."""

    codigo = status.HTTP_404_NOT_FOUND


async def manejar_error_app(_: Request, error: Exception) -> JSONResponse:
    assert isinstance(error, ErrorApp)
    return JSONResponse(status_code=error.codigo, content={"detail": str(error)})


async def manejar_error_inesperado(_: Request, __: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Error interno del servidor"},
    )


def registrar_manejadores(app: FastAPI) -> None:
    app.add_exception_handler(ErrorApp, manejar_error_app)
    app.add_exception_handler(Exception, manejar_error_inesperado)
