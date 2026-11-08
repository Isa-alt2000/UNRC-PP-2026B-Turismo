# Arquitectura del backend
Sujeta a cambios a medida que avance el proyecto.

API con FastAPI y SQLModel. 
El código se organiza por módulos de dominio (`gustos`, `recintos`, `recomendaciones`, `itinerarios`, `hoteles`) y cada uno separará sus responsabilidades en tres archivos:

| Archivo | Responsabilidad |
|---|---|
| `router.py` | Endpoints HTTP, sin lógica de negocio |
| `service.py` | Lógica de negocio y consultas |
| `schemas.py` | Formato de entrada y salida de la API |

Lo compartido vive aparte:

- `app/core/`: configuración, base de datos, manejo de errores, logging y seguridad. Las rutas que modifican datos piden la llave `ADMIN_API_KEY` en el encabezado `X-API-Key`; las de lectura son públicas.
- `app/models/`: tablas de la base de datos.
- `app/ml/`: carga de los modelos entrenados en `data_science`. Después de entrenar, se copian el `.joblib` y el `.json` de cada modelo (`interes`, `minutos`) de `data_science/ml/artifacts/` a `backend/artifacts/` (no van a git). Cada modelo se lee la primera vez que se usa y si falta, solo responde 503 el endpoint que lo necesita (`/recomendaciones` o `/itinerarios`).

`/itinerarios` además usa OpenRouteService con la llave `ORS_API_KEY`; sin ella, calcula en línea recta. Cómo se decide el orden y el reparto en días está en [optimizador.md](optimizador.md).

Las imágenes de los recintos van en `static/recintos/` con la clave como nombre (`R0002.webp`, `.png` o `.jpg`; si hay varias, se toma la primera en ese orden) y no se guardan en la base. Se sirven en `{API_PREFIX}/static/recintos/` y sus créditos, si los hay, van en `static/recintos/creditos.json` (`{"R0002": "Foto: autor, licencia"}`). Cada parada de `/itinerarios` trae `imagen` con su `url` y `credito`, o `"sin_imagen"`.

Los nombres que son convención del framework o de las herramientas van en inglés (`core`, `models`, `router.py`, `tests`) y los del dominio, en español.
