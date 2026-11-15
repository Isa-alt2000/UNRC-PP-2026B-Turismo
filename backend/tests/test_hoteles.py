import pytest
from sqlmodel import Session

from app.hoteles.service import hoteles_cercanos
from app.models import Hotel

# Punto de referencia: centro de Pátzcuaro. 0.009° de latitud son 1 km.
LAT, LON = 19.5135, -101.6091
KM = 0.009


def agregar(db: Session, km_norte: float, tamano: str = "micro", **cambios: object) -> Hotel:
    hotel = Hotel(
        id=len(db.new) + 1000 + int(km_norte * 100),
        nombre=f"Hotel a {km_norte} km",
        tipo="Hotel",
        codigo_scian=721112,
        tamano=tamano,
        localidad="Pátzcuaro",
        municipio="Pátzcuaro",
        latitud=LAT + km_norte * KM,
        longitud=LON,
    )
    hotel.sqlmodel_update(cambios)
    db.add(hotel)
    return hotel


def distancias(hoteles: list) -> list[float]:
    return [h.distancia_km for h in hoteles]


def test_devuelve_los_cercanos_ordenados_por_distancia(db: Session) -> None:
    for km in (3, 1, 2, 0.5):
        agregar(db, km)
    db.commit()

    hoteles, radio = hoteles_cercanos(db, LAT, LON)

    assert radio == 10
    assert distancias(hoteles) == pytest.approx([0.5, 1, 2, 3], abs=0.05)
    assert hoteles[0].nombre == "Hotel a 0.5 km"


def test_muestra_como_maximo_5(db: Session) -> None:
    for km in range(1, 9):
        agregar(db, km)
    db.commit()

    hoteles, _ = hoteles_cercanos(db, LAT, LON)

    assert distancias(hoteles) == pytest.approx([1, 2, 3, 4, 5], abs=0.05)


def test_descarta_los_que_estan_fuera_del_radio(db: Session) -> None:
    for km in (1, 2, 3):
        agregar(db, km)
    agregar(db, 12)
    db.commit()

    hoteles, radio = hoteles_cercanos(db, LAT, LON)

    assert radio == 10
    assert len(hoteles) == 3


def test_descarta_las_esquinas_del_recuadro(db: Session) -> None:
    for km in (1, 2, 3):
        agregar(db, km)
    # 9 km al norte y 9 al este: dentro del recuadro de 10 km, pero a unos 12.7 km.
    agregar(db, 9, longitud=LON + 9 / (111.32 * 0.9426))
    db.commit()

    hoteles, _ = hoteles_cercanos(db, LAT, LON)

    assert len(hoteles) == 3


def test_con_menos_de_3_amplia_a_25_km(db: Session) -> None:
    agregar(db, 4)
    agregar(db, 15)
    agregar(db, 20)
    agregar(db, 30)
    db.commit()

    hoteles, radio = hoteles_cercanos(db, LAT, LON)

    assert radio == 25
    assert distancias(hoteles) == pytest.approx([4, 15, 20], abs=0.05)


def test_sin_alojamientos_ni_a_25_km_devuelve_lista_vacia(db: Session) -> None:
    agregar(db, 40)
    db.commit()

    assert hoteles_cercanos(db, LAT, LON) == ([], 25)


def test_al_menos_3_locales_aunque_haya_grandes_mas_cerca(db: Session) -> None:
    for km in (0.5, 1, 1.5, 2):
        agregar(db, km, tamano="grande")
    for km in (3, 4, 5, 6):
        agregar(db, km, tamano="micro")
    db.commit()

    hoteles, _ = hoteles_cercanos(db, LAT, LON)

    # Los 3 locales más cercanos y los 2 grandes más cercanos, todo por distancia real.
    assert [(h.tamano, round(h.distancia_km)) for h in hoteles] == [
        ("grande", 0),
        ("grande", 1),
        ("micro", 3),
        ("micro", 4),
        ("micro", 5),
    ]


def test_si_no_hay_3_locales_completa_con_los_demas(db: Session) -> None:
    agregar(db, 1, tamano="pequena")
    for km in (2, 3, 4, 5, 6):
        agregar(db, km, tamano="mediana")
    db.commit()

    hoteles, _ = hoteles_cercanos(db, LAT, LON)

    assert [h.tamano for h in hoteles] == ["pequena", "mediana", "mediana", "mediana", "mediana"]


def test_marca_los_negocios_locales(db: Session) -> None:
    for tamano, km in [("micro", 1), ("pequena", 2), ("mediana", 3), ("grande", 4)]:
        agregar(db, km, tamano=tamano)
    db.commit()

    hoteles, _ = hoteles_cercanos(db, LAT, LON)

    assert [h.es_local for h in hoteles] == [True, True, False, False]


def test_trae_los_datos_para_la_tarjeta_y_el_mapa(db: Session) -> None:
    agregar(db, 1, telefono="4343421234", sitio_web="https://hotel.mx", direccion="Calle 1, Centro")
    db.commit()

    hotel = hoteles_cercanos(db, LAT, LON)[0][0]

    assert hotel.telefono == "4343421234"
    assert hotel.sitio_web == "https://hotel.mx"
    assert hotel.direccion == "Calle 1, Centro"
    assert hotel.latitud == pytest.approx(LAT + KM)
