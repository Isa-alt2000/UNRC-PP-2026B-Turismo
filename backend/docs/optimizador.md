# Optimizador de itinerarios
Sujeto a cambios a medida que avance el proyecto.

`POST /itinerarios` recibe un punto de partida y de 1 a 4 recintos, y decide en qué orden visitarlos y cómo repartirlos en días. La decisión la toma `planear()` en `app/itinerarios/optimizador.py`, una función pura (sin base de datos ni red) que se prueba en `tests/test_optimizador.py`.

## El problema
Es un problema de rutas de Investigación de Operaciones tratandose de una combinación del agente viajero (elegir el orden) con un problema de rutas con límite de duración, donde cada día funciona como un vehículo con un máximo de horas.

Supuestos del modelo:

- Se viaja en coche y cada recinto se visita una sola vez.
- La jornada es de 8 horas (480 min) y suma traslados y visitas.
- Se duerme cerca del último lugar del día, así que cada día sale de ahí y no se regresa al punto de partida.

## Datos de entrada

| Símbolo | Significado | De dónde sale |
|---|---|---|
| N = {1, …, n} | Recintos elegidos, n ≤ 4 | La solicitud |
| 0 | Punto de partida | Tabla `puntos_partida` |
| t(i, j) | Minutos de traslado de i a j | Matriz de OpenRouteService, o línea recta si falla |
| v(i) | Minutos de visita en el recinto i | Modelo de minutos (`minutos.joblib`) |
| H | Límite de la jornada, 480 min | `MINUTOS_POR_DIA` en `service.py` |

## Modelo

Variables de decisión:

- Un orden de visita π = (π₁, …, πₙ), una permutación de N.
- Un corte c(k) ∈ {0, 1} para k = 1, …, n − 1: vale 1 si el día termina después de π(k). Los cortes dividen el orden en D días.

Jornada de un día que visita π(a), …, π(b), saliendo de π(a − 1), o de 0 si es el primer día:

```
J = Σ t(π(k−1), π(k)) + Σ v(π(k))     para k = a, …, b
```

Restricciones:

1. Cada recinto aparece una sola vez (lo garantiza que π sea una permutación).
2. J ≤ H en cada día con más de un recinto.
3. Un recinto que por sí solo no cabe (t + v > H) va en un día propio, que se marca con `excede_jornada`. Sin esta excepción habría selecciones sin solución.

Función objetivo, lexicográfica (se compara el primer criterio y, solo si empatan, el siguiente):

1. Minimizar D, el número de días.
2. Minimizar el traslado total T = Σ t(π(k−1), π(k)), con π(0) = 0.
3. Minimizar la jornada más larga, para que los días queden parejos.

Como se duerme en el último lugar, T depende solo del orden y no de los cortes.

## Método de solución: enumeración exacta
Se revisan todas las combinaciones de orden y cortes: n! órdenes por 2ⁿ⁻¹ formas de cortar. Con 4 recintos son 24 × 8 = 192 planes, que se evalúan en menos de un milisegundo. Al revisarlas todas, la solución es la óptima del modelo, no una aproximación.

El método solo es viable porque n es pequeño: con 8 recintos serían 40,320 × 128 ≈ 5 millones de planes. Por eso `planear()` acepta hasta 7 (`MAXIMO_LUGARES`), y la API, hasta 4, el mismo máximo que la pantalla de recomendaciones.

Para problemas más grandes se usaría programación lineal entera con un solver. Está pendiente un notebook en `data_science` que formula este mismo modelo con PuLP y comprueba que da el mismo resultado que la enumeración. Ese notebook sirve como validación y no lo usa el backend.

## Del plan a la respuesta
`service.py` usa el plan para armar la respuesta:

1. Pide a OpenRouteService la matriz t(i, j) entre el punto de partida y los recintos (1 llamada).
2. Estima v(i) con el modelo de minutos.
3. Llama a `planear()`.
4. Pide la forma del camino completo en el orden elegido (1 llamada) y la corta por día.

Si OpenRouteService falla o no hay `ORS_API_KEY`, t(i, j) se estima en línea recta: distancia de haversine × 1.3 a 50 km/h. La respuesta lleva `aproximada: true`. Las respuestas de OpenRouteService se guardan en memoria (hasta 256), así que repetir una combinación no gasta cuota.

El log registra cada plan, por ejemplo:

```
itinerario_plan dias=2 minutos_traslado=227 planes_evaluados=192 planes_factibles=60 jornadas=460,401 aproximada=False
```

## Limitaciones

- v(i) viene de un árbol de regresión de profundidad 2 que solo da 4 valores (58, 97, 173 y 267 min) y no usa los gustos. Mejorarlo cambia los planes sin tocar el optimizador.
- No considera horarios de apertura, días de cierre ni tráfico: t(i, j) es un tiempo típico sin congestión.
- No incluye el regreso a casa al final del viaje.
- Aún no penaliza recintos con alta afluencia. Cuando exista ese dato, puede entrar como un cuarto criterio del objetivo o como una restricción.
