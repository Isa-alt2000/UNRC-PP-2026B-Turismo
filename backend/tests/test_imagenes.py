import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.recintos import imagenes
from app.recintos.imagenes import Imagen, imagen_de, leer_creditos


@pytest.fixture
def carpeta(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """Carpeta de imágenes vacía en lugar de la real."""
    recintos = tmp_path / "recintos"
    recintos.mkdir()
    monkeypatch.setattr(imagenes, "CARPETA", recintos)
    return recintos


def url(nombre: str) -> str:
    return f"{settings.api_prefix}/static/recintos/{nombre}"


@pytest.mark.parametrize("extension", [".webp", ".png", ".jpg", ".jpeg"])
def test_encuentra_la_imagen_por_clave(carpeta: Path, extension: str) -> None:
    (carpeta / f"R0002{extension}").write_bytes(b"img")

    assert imagen_de("R0002", {}) == Imagen(url=url(f"R0002{extension}"), credito=None)


def test_prefiere_webp_luego_png_luego_jpg(carpeta: Path) -> None:
    for extension in (".jpg", ".png", ".webp"):
        (carpeta / f"R0002{extension}").write_bytes(b"img")
    assert imagen_de("R0002", {}).url.endswith(".webp")  # type: ignore[union-attr]

    (carpeta / "R0002.webp").unlink()
    assert imagen_de("R0002", {}).url.endswith(".png")  # type: ignore[union-attr]

    (carpeta / "R0002.png").unlink()
    assert imagen_de("R0002", {}).url.endswith(".jpg")  # type: ignore[union-attr]


def test_sin_archivo_es_sin_imagen(carpeta: Path) -> None:
    (carpeta / "R0001.webp").write_bytes(b"img")
    (carpeta / "R0002.gif").write_bytes(b"img")  # extensión no aceptada

    assert imagen_de("R0002", {}) == "sin_imagen"


def test_agrega_el_credito(carpeta: Path) -> None:
    (carpeta / "R0002.jpg").write_bytes(b"img")
    (carpeta / "creditos.json").write_text(
        json.dumps({"R0002": "Foto: Autora, CC BY-SA 4.0"}), encoding="utf-8"
    )

    imagen = imagen_de("R0002", leer_creditos())

    assert isinstance(imagen, Imagen)
    assert imagen.credito == "Foto: Autora, CC BY-SA 4.0"


def test_sin_creditos_json_no_hay_creditos(carpeta: Path) -> None:
    assert leer_creditos() == {}


@pytest.mark.parametrize("contenido", ["{no es json", '["lista"]'], ids=["mal-escrito", "lista"])
def test_creditos_invalidos_se_ignoran(
    carpeta: Path, contenido: str, caplog: pytest.LogCaptureFixture
) -> None:
    (carpeta / "creditos.json").write_text(contenido, encoding="utf-8")

    assert leer_creditos() == {}
    assert any("creditos_imagenes valido=false" in r.getMessage() for r in caplog.records)


def test_se_sirve_por_static(client: TestClient) -> None:
    # La carpeta real: se crea y se borra un archivo de prueba.
    archivo = imagenes.CARPETA / "R9999.png"
    archivo.parent.mkdir(parents=True, exist_ok=True)
    archivo.write_bytes(b"\x89PNG prueba")
    try:
        respuesta = client.get(url("R9999.png"))
    finally:
        archivo.unlink()

    assert respuesta.status_code == 200
    assert respuesta.content == b"\x89PNG prueba"
    assert respuesta.headers["content-type"] == "image/png"


def test_imagen_inexistente_es_404(client: TestClient) -> None:
    assert client.get(url("R9998.webp")).status_code == 404
