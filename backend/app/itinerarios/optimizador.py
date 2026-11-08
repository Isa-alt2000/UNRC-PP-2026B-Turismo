from dataclasses import dataclass
from itertools import pairwise, permutations

# Más de esto ya no se resuelve en milisegundos: 8 lugares serían 40,320 x 128 planes.
MAXIMO_LUGARES = 7


@dataclass(frozen=True)
class Plan:
    dias: list[list[int]]
    """Índices de los lugares de cada día, en orden de visita. El 0 es el punto de partida."""
    jornadas: list[float]
    """Minutos de cada día: traslados más visitas."""
    minutos_traslado: float
    evaluados: int
    factibles: int

    def excede(self, limite: float) -> list[bool]:
        return [jornada > limite for jornada in self.jornadas]


def partir(orden: tuple[int, ...], cortes: int) -> list[list[int]]:
    """Corta el orden en días por lo que el bit i de cortes indica si el día termina tras el lugar i."""
    dias: list[list[int]] = [[]]
    for i, lugar in enumerate(orden):
        dias[-1].append(lugar)
        if i < len(orden) - 1 and cortes >> i & 1:
            dias.append([])
    return dias


def jornadas(dias: list[list[int]], minutos: list[list[float]], visita: list[float]) -> list[float]:
    resultado = []
    anterior = 0
    for dia in dias:
        traslado = sum(minutos[a][b] for a, b in pairwise([anterior, *dia]))
        resultado.append(traslado + sum(visita[lugar] for lugar in dia))
        anterior = dia[-1]
    return resultado


def planear(minutos: list[list[float]], visita: list[float], limite: float) -> Plan:
    """Mejor plan para visitar los lugares 1..n saliendo del punto 0.

    minutos[i][j] es el traslado del punto i al j, visita[i], los minutos en el lugar i
    (visita[0] se ignora).
    """
    n = len(minutos) - 1
    if not 1 <= n <= MAXIMO_LUGARES:
        raise ValueError(f"Se pueden planear de 1 a {MAXIMO_LUGARES} lugares, no {n}")

    mejor: tuple[tuple[int, float, float], Plan] | None = None
    evaluados = factibles = 0
    for orden in permutations(range(1, n + 1)):
        traslado = sum(minutos[a][b] for a, b in pairwise((0, *orden)))
        for cortes in range(2 ** (n - 1)):
            evaluados += 1
            dias = partir(orden, cortes)
            por_dia = jornadas(dias, minutos, visita)
            if any(j > limite and len(d) > 1 for d, j in zip(dias, por_dia, strict=True)):
                continue
            factibles += 1
            costo = (len(dias), traslado, max(por_dia))
            if mejor is None or costo < mejor[0]:
                mejor = (costo, Plan(dias, por_dia, traslado, 0, 0))

    # un lugar por día cumple las restricciones.
    assert mejor is not None
    plan = mejor[1]
    return Plan(plan.dias, plan.jornadas, plan.minutos_traslado, evaluados, factibles)
