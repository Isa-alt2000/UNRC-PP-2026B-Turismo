from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app

cliente = TestClient(app)


def preflight(origen: str):
    return cliente.options(
        "/health",
        headers={"Origin": origen, "Access-Control-Request-Method": "GET"},
    )


def test_cors_permite_origen_configurado() -> None:
    origen = settings.cors_origins[0]
    respuesta = preflight(origen)
    assert respuesta.status_code == 200
    assert respuesta.headers["access-control-allow-origin"] == origen


def test_cors_rechaza_otro_origen() -> None:
    respuesta = preflight("http://sitio-desconocido.com")
    assert "access-control-allow-origin" not in respuesta.headers


def test_health_queda_fuera_del_prefijo() -> None:
    assert cliente.get("/health").status_code == 200
    assert cliente.get(f"{settings.api_prefix}/health").status_code == 404
