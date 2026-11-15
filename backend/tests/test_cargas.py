from pathlib import Path

import pytest
from sqlmodel import Session, func, select

from app.cargas import ErrorCarga, cargar
from app.models import Hotel, PuntoPartida, Recinto

ENCABEZADO_RECINTOS = (
    "id,nombre,descripcion,latitud,longitud,tamano,es_apto_dependientes,"
    "historia,artes_artesanias,arquitectura,gastronomia,naturaleza,aventura"
)
ENCABEZADO_HOTELES = (
    "id,nombre,tipo,codigo_scian,tamano,telefono,sitio_web,direccion,localidad,municipio,"
    "latitud,longitud"
)


def escribir(carpeta: Path, puntos: str = "", recintos: str = "", hoteles: str = "") -> Path:
    (carpeta / "puntos_partida.csv").write_text(
        "id,nombre,latitud,longitud,orden\n" + (puntos or "morelia,Morelia,19.71,-101.21,1\n"),
        encoding="utf-8",
    )
    (carpeta / "recintos.csv").write_text(
        ENCABEZADO_RECINTOS
        + "\n"
        + (
            recintos
            or "1,Paricutín,Volcán de 1943,19.493,-102.251,3,false,2,0,1,0,3,3\n"
            "2,Quiroga,,19.66,-101.52,2,true,1,2,1,3,0,0\n"
        ),
        encoding="utf-8",
    )
    (carpeta / "hoteles.csv").write_text(
        ENCABEZADO_HOTELES
        + "\n"
        + (
            hoteles
            or '2576300,Hotel Refugio,Casa de huéspedes,721311,micro,4433121955,https://refugio.com,'
            '"Calle Andres del Rio 357, Ventura Puente",Morelia,Morelia,19.695,-101.189\n'
            "2588493,Posada San Felipe,Casa de huéspedes,721311,micro,,,,Tanhuato,Tanhuato,20.28,-102.33\n"
        ),
        encoding="utf-8",
    )
    return carpeta


def contar(db: Session, modelo: type) -> int:
    return db.exec(select(func.count()).select_from(modelo)).one()


def test_carga_las_tres_tablas(db: Session, tmp_path: Path) -> None:
    resultados = cargar(db, escribir(tmp_path))

    assert {nombre: r.nuevos for nombre, r in resultados.items()} == {
        "puntos_partida": 1,
        "recintos": 2,
        "hoteles": 2,
    }
    paricutin = db.get(Recinto, 1)
    assert paricutin.nombre == "Paricutín"
    assert paricutin.es_apto_dependientes is False
    assert paricutin.valores.naturaleza == 3
    assert db.get(Recinto, 2).descripcion is None
    hotel = db.get(Hotel, 2576300)
    assert hotel.telefono == "4433121955"
    assert hotel.direccion == "Calle Andres del Rio 357, Ventura Puente"
    assert db.get(Hotel, 2588493).sitio_web is None


def test_cargar_dos_veces_no_duplica(db: Session, tmp_path: Path) -> None:
    carpeta = escribir(tmp_path)
    cargar(db, carpeta)

    resultados = cargar(db, carpeta)

    assert resultados["hoteles"].nuevos == 0
    assert resultados["hoteles"].actualizados == 2
    assert contar(db, Hotel) == 2
    assert contar(db, Recinto) == 2


def test_recargar_actualiza_los_valores(db: Session, tmp_path: Path) -> None:
    cargar(db, escribir(tmp_path))

    escribir(tmp_path, recintos="1,Volcán Paricutín,,19.493,-102.251,3,false,2,1,1,0,3,3\n")
    cargar(db, tmp_path, ["recintos"])

    db.expire_all()
    paricutin = db.get(Recinto, 1)
    assert paricutin.nombre == "Volcán Paricutín"
    assert paricutin.valores.artes_artesanias == 1


def test_puede_cargar_solo_algunas_tablas(db: Session, tmp_path: Path) -> None:
    resultados = cargar(db, escribir(tmp_path), ["hoteles"])

    assert list(resultados) == ["hoteles"]
    assert contar(db, Recinto) == 0


@pytest.mark.parametrize(
    ("archivo", "fila", "esperado"),
    [
        ("recintos", "3,Malo,,19.5,-101.5,4,true,1,1,1,1,1,1\n", "recintos.csv línea 2: tamano"),
        ("recintos", "3,Malo,,19.5,-101.5,2,true,1,9,1,1,1,1\n", "valores.artes_artesanias"),
        (
            "hoteles",
            "1,Hotel,Hotel,721112,enorme,,,,Morelia,Morelia,19.7,-101.2\n",
            "hoteles.csv línea 2: tamano",
        ),
        (
            "hoteles",
            "1,Hotel,Hotel,721112,micro,123,,,Morelia,Morelia,19.7,-101.2\n",
            "telefono",
        ),
        ("hoteles", "1,,Hotel,721112,micro,,,,Morelia,Morelia,19.7,-101.2\n", "nombre"),
    ],
    ids=["tamano-recinto", "valor-fuera-de-rango", "tamano-hotel", "telefono", "sin-nombre"],
)
def test_una_fila_invalida_no_carga_nada(
    db: Session, tmp_path: Path, archivo: str, fila: str, esperado: str
) -> None:
    escribir(tmp_path, **{archivo: fila})

    with pytest.raises(ErrorCarga) as error:
        cargar(db, tmp_path)

    assert any(esperado in mensaje for mensaje in error.value.errores)
    assert contar(db, PuntoPartida) == 0
    assert contar(db, Recinto) == 0
    assert contar(db, Hotel) == 0


def test_rechaza_ids_repetidos(db: Session, tmp_path: Path) -> None:
    fila = "1,Hotel,Hotel,721112,micro,,,,Morelia,Morelia,19.7,-101.2\n"
    escribir(tmp_path, hoteles=fila + fila)

    with pytest.raises(ErrorCarga, match="línea 3: id 1 repetido"):
        cargar(db, tmp_path)


def test_avisa_si_falta_un_csv(db: Session, tmp_path: Path) -> None:
    escribir(tmp_path)
    (tmp_path / "hoteles.csv").unlink()

    with pytest.raises(ErrorCarga, match="hoteles.csv: no existe"):
        cargar(db, tmp_path)


def test_rechaza_tablas_desconocidas(db: Session, tmp_path: Path) -> None:
    with pytest.raises(ErrorCarga, match="Tabla desconocida: restaurantes"):
        cargar(db, escribir(tmp_path), ["restaurantes"])


def test_los_csv_publicados_son_validos() -> None:
    """Los CSV de datos_iniciales/, si ya se copiaron, pasan la validación (sin escribir)."""
    from app.cargas import CARPETA, TABLAS, leer

    if not all((CARPETA / tabla.archivo).is_file() for tabla in TABLAS.values()):
        pytest.skip("Sin CSV en datos_iniciales/: python3 copiar_al_backend.py datos")
    for tabla in TABLAS.values():
        _, errores = leer(tabla, CARPETA)
        assert errores == []
