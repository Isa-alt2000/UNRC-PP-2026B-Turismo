import logging

from sqlmodel import Session

from app.ml.modelo_interes import ModeloInteres
from app.models import Recinto, RecintoValores
from app.models.recintos import CODIGOS_GUSTOS
from app.recintos.schemas import a_clave
from app.recintos.service import listar_recintos
from app.recomendaciones.schemas import (
    Etiqueta,
    RecintoRecomendado,
    RespuestaRecomendaciones,
    SolicitudRecomendaciones,
)

log = logging.getLogger(__name__)

MAXIMO_RECINTOS = 10
# Con esta cantidad de afines o menos, se agregan sugerencias extra por afluencia.
POCOS_AFINES = 3
RECINTOS_EXTRA = 3
ETIQUETA_TAMANO: dict[int, Etiqueta] = {1: "chico", 2: "mediano", 3: "grande"}


def variables(gustos: dict[str, int], valores: RecintoValores) -> dict[str, float]:
    """gustos y las afinidades gusto x valor del recinto."""
    return {
        **{f"gusto_{codigo}": gustos[codigo] for codigo in CODIGOS_GUSTOS},
        **{
            f"afinidad_{codigo}": gustos[codigo] * getattr(valores, codigo)
            for codigo in CODIGOS_GUSTOS
        },
    }


def etiquetas(recinto: Recinto) -> list[Etiqueta]:
    familiar: list[Etiqueta] = ["familiar"] if recinto.es_apto_dependientes else []
    return [*familiar, ETIQUETA_TAMANO[recinto.tamano]]


def a_recomendado(recinto: Recinto, probabilidad: float) -> RecintoRecomendado:
    assert recinto.id is not None
    return RecintoRecomendado(
        id=a_clave(recinto.id),
        nombre=recinto.nombre,
        descripcion=recinto.descripcion,
        probabilidad=round(probabilidad, 4),
        # pendiente, afluencia todavía no se calcula
        afluencia="sin_datos",
        etiquetas=etiquetas(recinto),
    )


def recomendar(
    session: Session, modelo: ModeloInteres, solicitud: SolicitudRecomendaciones
) -> RespuestaRecomendaciones:
    """Recintos que el modelo considera de interés, de mayor a menor probabilidad."""
    niveles = ", ".join(f"{codigo}={solicitud.gustos[codigo]}" for codigo in CODIGOS_GUSTOS)
    log.info(
        f"Gustos recibidos: {niveles} | mes={solicitud.mes} "
        f"| con_dependientes={solicitud.con_dependientes}"
    )

    candidatos = [
        recinto
        for recinto in listar_recintos(session)
        # sin valores no se pueden calcular las afinidades
        if recinto.valores is not None
        and (recinto.es_apto_dependientes or not solicitud.con_dependientes)
    ]
    if not candidatos:
        log.info("Sin recintos que evaluar: no hay recintos con valores")
        return RespuestaRecomendaciones(recintos=[], recintos_por_afluencia=[])

    probabilidades = modelo.probabilidades(
        [variables(solicitud.gustos, recinto.valores) for recinto in candidatos]
    )
    # listar_recintos los devuelve por clave, así que este orden también es por clave
    pares = list(zip(candidatos, probabilidades, strict=True))

    afines = sorted(
        (par for par in pares if par[1] >= modelo.umbral), key=lambda par: -par[1]
    )
    recomendados = [a_recomendado(r, p) for r, p in afines[:MAXIMO_RECINTOS]]
    resumen = ", ".join(f"{r.id} {r.probabilidad:.3f}" for r in recomendados) or "ninguno"
    log.info(
        f"Afinidades: {len(afines)} de {len(candidatos)} recintos superan el umbral "
        f"{modelo.umbral}: {resumen}"
    )

    extra: list[RecintoRecomendado] = []
    if len(recomendados) <= POCOS_AFINES:
        # Pocos o ningún afín: se suman sugerencias que no estén ya en la lista.
        # Cuando exista la afluencia, serán las de menor afluencia del mes:
        # restantes = sorted(restantes, key=lambda par: orden_afluencia(par[0], solicitud.mes))
        ya_incluidos = {r.id for r in recomendados}
        restantes = [(r, p) for r, p in pares if a_clave(r.id) not in ya_incluidos]
        extra = [a_recomendado(r, p) for r, p in restantes[:RECINTOS_EXTRA]]
        log.info(f"Sugerencias por afluencia: {', '.join(r.id for r in extra) or 'ninguna'}")

    return RespuestaRecomendaciones(recintos=recomendados, recintos_por_afluencia=extra)
