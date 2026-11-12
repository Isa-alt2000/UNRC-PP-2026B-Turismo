# Ciencia de datos
Datos, limpieza y modelos del recomendador turístico de Michoacán. Es independiente del backend y del frontend, lo único que sale de aquí hacia la app son los modelos entrenados como artefactos (`ml/artifacts/`).

## Instalación
Desde la raíz del repositorio:

```bash
uv sync --all-packages
```

## Estructura

| Ruta | Contenido |
|---|---|
| `config.py` | Sirve como directorio de rutas compartidas (`CRUDOS`, `PROCESADOS`, `ARTIFACTS`) y la ruta de la encuesta procesada (`ENCUESTA_PROCESADA`) |
| `datos/crudos/` | Datos tal como se descargaron o capturaron. Ningún script escribe aquí |
| `datos/procesados/` | Datos limpios o derivados |
| `pipeline/` | Limpieza por fuente: `inah/` y `encuesta/` |
| `ml/` | Entrenamiento de modelos, con sus salidas en `artifacts/` |
| `docs/` | Encuesta (`encuesta.md`), modelo de interés (`modelo_interes.md`) y fuentes de datos (`fuentes_datos.md`) |

## Ejecución
Todos los scripts se ejecutan como módulos desde `data_science/`:

```bash
cd data_science
```

1. **INAH**:

   ```bash
   uv run python -m pipeline.inah.filtrar_michoacan   # crudos/inah/ -> procesados/inah_michoacan.csv
   uv run python -m pipeline.inah.visitas_mensuales   # -> procesados/visitas_mensuales.csv
   ```

2. **Encuesta:**:
Junta los dos formularios (`crudos/encuesta/encuesta_parte_a.csv` y `_parte_b.csv`), quita las respuestas sin consentimiento, las que fallaron el control de atención y las que dieron la misma calificación a los 6 recintos, y calcula las afinidades con los valores de los recintos (los de `docs/encuesta.md`, copiados en el script).

   ```bash
   uv run python -m pipeline.encuesta.limpiar_encuesta   # -> procesados/encuesta_procesada.csv
   ```

3. **Modelos**:
Leen `procesados/encuesta_procesada.csv`, separan entrenamiento y prueba por persona y guardan en `ml/artifacts/` ver `docs/modelo_interes.md`

   ```bash
   uv run python -m ml.regresion_logistica   # interés, con escalado       -> interes
   uv run python -m ml.arbol_decision        # interés, árbol              -> interes_arbol
   uv run python -m ml.arbol_regresion       # minutos (solo intencion=1)  -> minutos
   ```

4. **Hoteles (DENUE):**
Requiere descargar el DENUE de Michoacán a `datos/crudos/inegi/` (no está en git; ver `docs/fuentes_datos.md`). Filtra el hospedaje y deja el CSV con las mismas columnas que la tabla `hoteles` del backend.

   ```bash
   uv run python -m pipeline.denue.hoteles   # crudos/inegi/ -> procesados/hoteles.csv
   ```

## Entrega al backend
`ml/artefactos.py` guarda cada modelo como `<nombre>.joblib` + `<nombre>.json` (versión de
scikit-learn y columnas de entrada, en orden). Para publicarlo, copia ambos archivos al backend (ruta pendiente).

