import logging
from collections.abc import Sequence

from sqlmodel import Session

from app.core.exceptions import RecursoNoEncontrado, SolicitudInvalida
from app.hoteles.service import hoteles_cercanos
from app.itinerarios.optimizador import planear
from app.itinerarios.rutas import (
    Coordenada,
    ErrorRutas,
    LineaRecta,
    Matriz,
    ProveedorRutas,
    Tramo,
)
from app.itinerarios.schemas import (
    Dia,
    Itinerario,
    Parada,
    SolicitudItinerario,
    Totales,
    TotalesDia,
    Trazo,
)
from app.ml.modelo_minutos import ModeloMinutos
from app.models import PuntoPartida, Recinto
from app.models.recintos import CODIGOS_GUSTOS
from app.puntos_partida.schemas import PuntoPartidaPublico
from app.recintos.imagenes import imagen_de, leer_creditos
from app.recintos.schemas import a_clave
from app.recintos.service import obtener_recinto

log = logging.getLogger(__name__)

MINUTOS_POR_DIA = 8 * 60


def variables_minutos(gustos: dict[str, int], recinto: Recinto) -> dict[str, float]:
    """Gustos de la persona, valores del recinto y su tamaño, como los espera el modelo."""
    assert recinto.valores is not None
    return {
        **{f"gusto_{codigo}": gustos[codigo] for codigo in CODIGOS_GUSTOS},
        **{f"recinto_{codigo}": getattr(recinto.valores, codigo) for codigo in CODIGOS_GUSTOS},
        "recinto_tamano": recinto.tamano,
    }


def matriz_con_respaldo(
    rutas: ProveedorRutas, puntos: Sequence[Coordenada]
) -> tuple[Matriz, ProveedorRutas]:
    """Pide la matriz y si el proveedor falla la calcula en línea recta.

    Devuelve también el proveedor que funcionó, para pedirle los tramos al mismo.
    """
    try:
        return rutas.matriz(puntos), rutas
    except ErrorRutas as error:
        log.warning(f"respaldo_linea_recta paso=matriz motivo={error}")
        respaldo = LineaRecta()
        return respaldo.matriz(puntos), respaldo


def tramos_con_respaldo(
    rutas: ProveedorRutas, puntos: Sequence[Coordenada]
) -> tuple[list[Tramo], bool]:
    """Pide la forma del camino y si falla, une los puntos en línea recta.

    Devuelve también si los tramos son aproximados.
    """
    try:
        return rutas.tramos(puntos), rutas.aproximado
    except ErrorRutas as error:
        log.warning(f"respaldo_linea_recta paso=trazo motivo={error}")
        return LineaRecta().tramos(puntos), True


def unir(tramos: list[Tramo]) -> list[Coordenada]:
    """Une tramos seguidos sin repetir el punto donde termina uno y empieza el otro."""
    linea = list(tramos[0])
    for tramo in tramos[1:]:
        linea.extend(tramo[1:] if tramo and linea and tramo[0] == linea[-1] else tramo)
    return linea


def armar_itinerario(
    session: Session,
    modelo: ModeloMinutos,
    rutas: ProveedorRutas,
    solicitud: SolicitudItinerario,
) -> Itinerario:
    """Ordena los recintos elegidos, los reparte en días y arma el trazo de cada día."""
    salida = session.get(PuntoPartida, solicitud.salida)
    if salida is None:
        raise RecursoNoEncontrado(f"No existe el punto de partida {solicitud.salida}")
    recintos = [obtener_recinto(session, clave) for clave in solicitud.recintos]
    sin_valores = [a_clave(r.id) for r in recintos if r.valores is None and r.id is not None]
    if sin_valores:
        raise SolicitudInvalida(
            f"Sin valores no se puede estimar el tiempo de visita de: {', '.join(sin_valores)}"
        )
    log.info(f"itinerario_solicitado salida={salida.id} recintos={','.join(solicitud.recintos)}")

    visita = modelo.minutos([variables_minutos(solicitud.gustos, r) for r in recintos])
    # índice 0: punto de partida índice i, recintos[i - 1]
    puntos = [(salida.longitud, salida.latitud), *((r.longitud, r.latitud) for r in recintos)]
    matriz, proveedor = matriz_con_respaldo(rutas, puntos)

    plan = planear(matriz.minutos, [0, *visita], MINUTOS_POR_DIA)
    camino = [0, *(lugar for dia in plan.dias for lugar in dia)]
    tramos, aproximada = tramos_con_respaldo(proveedor, [puntos[i] for i in camino])
    log.info(
        f"itinerario_plan dias={len(plan.dias)} minutos_traslado={plan.minutos_traslado:.0f} "
        f"planes_evaluados={plan.evaluados} planes_factibles={plan.factibles} "
        f"jornadas={','.join(f'{j:.0f}' for j in plan.jornadas)} aproximada={aproximada}"
    )

    creditos = leer_creditos()
    dias: list[Dia] = []
    excedidos = plan.excede(MINUTOS_POR_DIA)
    paso = 0  # tramo del camino completo: tramos[paso] va de camino[paso] a camino[paso + 1]
    for numero, lugares in enumerate(plan.dias, start=1):
        paradas = []
        tramos_dia = []
        for lugar in lugares:
            anterior = camino[paso]
            recinto = recintos[lugar - 1]
            assert recinto.id is not None
            paradas.append(
                Parada(
                    orden=paso + 1,
                    id=a_clave(recinto.id),
                    nombre=recinto.nombre,
                    descripcion=recinto.descripcion,
                    imagen=imagen_de(a_clave(recinto.id), creditos),
                    latitud=recinto.latitud,
                    longitud=recinto.longitud,
                    km_desde_anterior=round(matriz.km[anterior][lugar], 1),
                    minutos_traslado=round(matriz.minutos[anterior][lugar]),
                    minutos_visita=round(visita[lugar - 1]),
                )
            )
            tramos_dia.append(tramos[paso])
            paso += 1

        # Se duerme cerca de la última parada del día
        ultima = paradas[-1]
        hoteles, radio_hoteles = hoteles_cercanos(session, ultima.latitud, ultima.longitud)
        traslado = sum(p.minutos_traslado for p in paradas)
        en_visitas = sum(p.minutos_visita for p in paradas)
        dias.append(
            Dia(
                dia=numero,
                paradas=paradas,
                trazo=Trazo(coordinates=unir(tramos_dia)),
                totales=TotalesDia(
                    km=round(sum(p.km_desde_anterior for p in paradas), 1),
                    minutos_traslado=traslado,
                    minutos_visita=en_visitas,
                    minutos_jornada=traslado + en_visitas,
                ),
                excede_jornada=excedidos[numero - 1],
                hoteles=hoteles,
                radio_hoteles_km=radio_hoteles,
            )
        )

    return Itinerario(
        aproximada=aproximada,
        salida=PuntoPartidaPublico.model_validate(salida),
        minutos_por_dia=MINUTOS_POR_DIA,
        dias=dias,
        totales=Totales(
            km=round(sum(d.totales.km for d in dias), 1),
            minutos_traslado=sum(d.totales.minutos_traslado for d in dias),
            minutos_visita=sum(d.totales.minutos_visita for d in dias),
            dias=len(dias),
        ),
    )
