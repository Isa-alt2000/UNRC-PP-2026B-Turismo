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

- `app/core/`: configuración, base de datos, manejo de errores y logging.
- `app/models/`: tablas de la base de datos.
- `app/ml/`: carga de los modelos entrenados en `data_science` (en `artifacts/`).

Los nombres que son convención del framework o de las herramientas van en inglés (`core`, `models`, `router.py`, `tests`) y los del dominio, en español.
