import csv
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from pydantic import BaseModel, ValidationError
from sqlalchemy import text
from sqlmodel import Session, SQLModel, select

from app.cargas.schemas import HotelCarga, PuntoPartidaCarga, RecintoCarga
from app.core.config import BACKEND
from app.models import Hotel, PuntoPartida, Recinto, RecintoValores
from app.models.recintos import CODIGOS_GUSTOS

CARPETA = BACKEND / "datos_iniciales"


class ErrorCarga(Exception):
    """Algún CSV falta o tiene filas inválidas. Trae un mensaje por problema."""

    def __init__(self, errores: list[str]) -> None:
        super().__init__("\n".join(errores))
        self.errores = errores


# Conversión de fila a modelo

COLUMNAS_RECINTO = (
    "id",
    "nombre",
    "descripcion",
    "latitud",
    "longitud",
    "tamano",
    "es_apto_dependientes",
)


def recinto_desde_fila(fila: dict[str, Any]) -> dict[str, Any]:
    """El CSV trae los valores como columnas sueltas; el esquema los espera agrupados.

    Las columnas de trabajo de la hoja (notas, fuente_imagen, autor…) no van a la base y se
    ignoran; así el CSV puede ser el export directo de Google Sheets."""
    datos = {columna: fila[columna] for columna in COLUMNAS_RECINTO if columna in fila}
    valores = {codigo: fila.get(codigo) for codigo in CODIGOS_GUSTOS}
    return {**datos, "valores": valores}


def recinto_a_modelo(datos: RecintoCarga) -> Recinto:
    # recinto_id explícito para que merge encuentre los valores existentes y los actualice.
    return Recinto(
        **datos.model_dump(exclude={"valores"}),
        valores=RecintoValores(recinto_id=datos.id, **datos.valores.model_dump()),
    )


@dataclass(frozen=True)
class Tabla:
    archivo: str
    modelo: type[SQLModel]
    esquema: type[BaseModel]
    a_modelo: Callable[[Any], SQLModel]
    armar: Callable[[dict[str, Any]], dict[str, Any]] = lambda fila: fila


# En orden de carga.
TABLAS: dict[str, Tabla] = {
    "puntos_partida": Tabla(
        "puntos_partida.csv",
        PuntoPartida,
        PuntoPartidaCarga,
        lambda datos: PuntoPartida(**datos.model_dump()),
    ),
    "recintos": Tabla("recintos.csv", Recinto, RecintoCarga, recinto_a_modelo, recinto_desde_fila),
    "hoteles": Tabla("hoteles.csv", Hotel, HotelCarga, lambda datos: Hotel(**datos.model_dump())),
}


# Lectura y validación

def leer(tabla: Tabla, carpeta: Path) -> tuple[list[BaseModel], list[str]]:
    """Valida todas las filas del CSV. Devuelve las válidas y un mensaje por cada error."""
    ruta = carpeta / tabla.archivo
    if not ruta.is_file():
        return [], [f"{tabla.archivo}: no existe en {carpeta} (python3 copiar_al_backend.py datos)"]

    filas, errores, ids = [], [], set()
    with ruta.open(encoding="utf-8-sig", newline="") as archivo:
        # La línea 1 es el encabezado: la primera fila de datos es la línea 2.
        for linea, fila in enumerate(csv.DictReader(archivo), start=2):
            # Una celda vacía es un dato que falta.
            crudo = {clave: (valor if valor != "" else None) for clave, valor in fila.items()}
            # Las hojas de cálculo suelen exportar filas vacías al final.
            if all(valor is None for valor in crudo.values()):
                continue
            try:
                datos = tabla.esquema.model_validate(tabla.armar(crudo))
            except ValidationError as error:
                for detalle in error.errors():
                    campo = ".".join(str(parte) for parte in detalle["loc"]) or "fila"
                    errores.append(f"{tabla.archivo} línea {linea}: {campo}: {detalle['msg']}")
                continue
            if datos.id in ids:  # type: ignore[attr-defined]
                errores.append(f"{tabla.archivo} línea {linea}: id {datos.id} repetido")  # type: ignore[attr-defined]
                continue
            ids.add(datos.id)  # type: ignore[attr-defined]
            filas.append(datos)
    return filas, errores


@dataclass(frozen=True)
class Resultado:
    nuevos: int
    actualizados: int


def cargar(
    session: Session, carpeta: Path = CARPETA, nombres: list[str] | None = None
) -> dict[str, Resultado]:
    """Valida todas las tablas pedidas y, si no hay errores, las carga en una sola transacción."""
    nombres = nombres or list(TABLAS)
    desconocidas = [nombre for nombre in nombres if nombre not in TABLAS]
    if desconocidas:
        raise ErrorCarga([f"Tabla desconocida: {n}. Opciones: {', '.join(TABLAS)}" for n in desconocidas])

    # Se respeta el orden de TABLAS aunque se pidan en otro orden: los recintos van antes que nada
    # que dependa de ellos.
    pedidas = [nombre for nombre in TABLAS if nombre in nombres]
    leidas, errores = {}, []
    for nombre in pedidas:
        leidas[nombre], errores_tabla = leer(TABLAS[nombre], carpeta)
        errores += errores_tabla
    if errores:
        raise ErrorCarga(errores)

    resultados = {}
    for nombre in pedidas:
        tabla = TABLAS[nombre]
        existentes = set(session.exec(select(tabla.modelo.id)).all())  # type: ignore[attr-defined]
        for datos in leidas[nombre]:
            session.merge(tabla.a_modelo(datos))
        nuevos = sum(1 for datos in leidas[nombre] if datos.id not in existentes)  # type: ignore[attr-defined]
        resultados[nombre] = Resultado(nuevos=nuevos, actualizados=len(leidas[nombre]) - nuevos)
    session.flush()
    ajustar_secuencias(session, pedidas)
    session.commit()
    return resultados


def ajustar_secuencias(session: Session, nombres: list[str]) -> None:
    """En PostgreSQL, insertar ids a mano no avanza el contador: el siguiente POST /recintos
    chocaría con un id cargado. SQLite lo ajusta solo."""
    if "recintos" not in nombres or session.get_bind().dialect.name != "postgresql":
        return
    session.exec(
        text(
            "SELECT setval(pg_get_serial_sequence('recintos', 'id'), "
            "COALESCE((SELECT MAX(id) FROM recintos), 1))"
        )
    )
