import pytest

from app.itinerarios.optimizador import partir, planear

# Punto 0 de partida y tres lugares. Traslados simétricos, en minutos.
#        0    1    2    3
MINUTOS = [
    [0, 30, 60, 90],
    [30, 0, 30, 60],
    [60, 30, 0, 30],
    [90, 60, 30, 0],
]


def test_partir_corta_donde_indican_los_bits() -> None:
    assert partir((1, 2, 3), 0b00) == [[1, 2, 3]]
    assert partir((1, 2, 3), 0b01) == [[1], [2, 3]]
    assert partir((1, 2, 3), 0b10) == [[1, 2], [3]]
    assert partir((1, 2, 3), 0b11) == [[1], [2], [3]]


def test_si_todo_cabe_en_un_dia_elige_el_orden_mas_corto() -> None:
    plan = planear(MINUTOS, [0, 60, 60, 60], limite=480)

    assert plan.dias == [[1, 2, 3]]
    assert plan.minutos_traslado == 90
    assert plan.jornadas == [270]


def test_revisa_todas_las_combinaciones() -> None:
    plan = planear(MINUTOS, [0, 60, 60, 60], limite=480)

    # 3! órdenes x 2^2 formas de cortar
    assert plan.evaluados == 24
    assert plan.factibles == 24


def test_reparte_en_dias_sin_pasar_del_limite() -> None:
    plan = planear(MINUTOS, [0, 200, 200, 200], limite=480)

    assert len(plan.dias) == 2
    assert all(jornada <= 480 for jornada in plan.jornadas)
    assert sorted(lugar for dia in plan.dias for lugar in dia) == [1, 2, 3]


def test_cada_dia_sale_del_ultimo_lugar_del_anterior() -> None:
    plan = planear(MINUTOS, [0, 200, 200, 200], limite=480)

    # Empatan 1 | 2,3 y 1,2 | 3. En ambos, el día corto es 30 + 200: sale del lugar anterior,
    # no del punto de partida (que sumaría 60 o 90 de traslado).
    assert plan.dias in ([[1], [2, 3]], [[1, 2], [3]])
    assert sorted(plan.jornadas) == [230, 460]


def test_prefiere_menos_dias_aunque_maneje_mas() -> None:
    # El orden más corto (1, 2, 3) obliga a 3 días; visitar 2 primero permite 2 días.
    minutos = [
        [0, 10, 100, 10],
        [10, 0, 10, 300],
        [100, 10, 0, 10],
        [10, 300, 10, 0],
    ]
    plan = planear(minutos, [0, 230, 230, 230], limite=480)

    assert len(plan.dias) == 2
    assert all(jornada <= 480 for jornada in plan.jornadas)


def test_con_el_mismo_numero_de_dias_empareja_las_jornadas() -> None:
    simetrica = [[0, 10, 10, 10], [10, 0, 10, 10], [10, 10, 0, 10], [10, 10, 10, 0]]
    plan = planear(simetrica, [0, 100, 100, 300], limite=480)

    # Todos los órdenes cuestan 30 de traslado; con 2 días, el 300 va solo.
    assert len(plan.dias) == 2
    assert max(plan.jornadas) == 310


def test_un_lugar_que_no_cabe_va_solo_y_se_marca() -> None:
    plan = planear(MINUTOS, [0, 60, 600, 60], limite=480)

    assert [2] in plan.dias
    excedidos = [dia for dia, excede in zip(plan.dias, plan.excede(480)) if excede]
    assert excedidos == [[2]]


@pytest.mark.parametrize("lugares", [0, 8])
def test_rechaza_cantidades_fuera_de_rango(lugares: int) -> None:
    minutos = [[0.0] * (lugares + 1) for _ in range(lugares + 1)]
    with pytest.raises(ValueError):
        planear(minutos, [0.0] * (lugares + 1), limite=480)
