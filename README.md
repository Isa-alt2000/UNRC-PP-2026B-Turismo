# Turismo inteligente y sustentable en Michoacán

Proyecto universitario: una app que recomienda lugares de Michoacán según los gustos de cada persona, prioriza los menos concurridos y arma una ruta por días con hoteles cercanos.

## Cómo funciona

1. **Gustos**: la persona elige qué le interesa y desde dónde sale.
2. **Lugares**: un modelo de aprendizaje automático recomienda recintos afines y elige hasta 4.
3. **Ruta**: el optimizador decide el orden de visita y lo reparte en jornadas de 8 horas, con el camino por carretera, hoteles cercanos y descarga en PDF.

## Tecnologías

| Parte | Herramientas |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind, Leaflet |
| Backend | FastAPI, SQLModel, SQLite, Alembic |
| Ciencia de datos | pandas, scikit-learn |
| Rutas | OpenRouteService |

## Estructura

```
frontend/       app web
backend/        API, base de datos y optimizador de rutas
data_science/   limpieza de datos y entrenamiento de modelos
```

## Instalación

Los pasos para correrlo en local están en [INSTALL.md](INSTALL.md).

## Documentación

- [Arquitectura del backend](backend/docs/arquitectura.md)
- [Base de datos](backend/docs/base_datos.md)
- [Optimizador de rutas](backend/docs/optimizador.md)
- [Modelo de interés](data_science/docs/modelo_interes.md)
- [Fuentes de datos](data_science/docs/fuentes_datos.md)
- [Encuesta](data_science/docs/encuesta.md)
