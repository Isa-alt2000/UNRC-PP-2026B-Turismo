# Base de datos
En progreso.

Guarda el catálogo de gustos, los recintos y cuánto ofrece cada recinto de cada gusto. Con esos valores el backend calcula las afinidades que usa el modelo de interés.

## Diagrama

```mermaid
erDiagram
    gustos {
        str codigo PK
        str nombre
        str pregunta
        int orden UK
    }
    recintos {
        int id PK
        str nombre
        str descripcion
        float latitud
        float longitud
        int tamano
        bool es_apto_dependientes
    }
    recinto_valores {
        int recinto_id PK, FK
        int historia
        int artes_artesanias
        int arquitectura
        int gastronomia
        int naturaleza
        int aventura
    }
    recintos ||--o| recinto_valores : "tiene"
```

## Diccionario de datos

### gustos
Catálogo de preguntas para enviarselo al front y que lo muestre.

| Columna | Tipo | Para qué sirve | Cómo se puebla |
|---|---|---|---|
| `codigo` | texto, PK | Identifica el gusto, como `historia` | Llenado manual. |
| `nombre` | texto | Nombre que se muestra al turista | Llenado manual. |
| `pregunta` | texto | Pregunta con la que el turista califica el gusto del 1 al 5 | Llenado manual. |
| `orden` | entero, único | Posición en la que se muestra | Llenado manual. |

### recintos
Datos especificos del recitno. Se cargan por la API: POST /recintos para darlos de alta y PATCH /recintos/{id} para corregirlos.

| Columna | Tipo | Para qué sirve | Cómo se puebla |
|---|---|---|---|
| `id` | entero, PK autoincremental | Identifica el recinto. La API lo muestra como clave: 1 es `R0001` | Lo asigna la base al crear el recinto y nunca reutiliza el número de uno borrado. |
| `nombre` | texto | Nombre que se muestra | Manual |
| `descripcion` | texto, opcional | Ficha corta del recinto | Manual. |
| `latitud` | decimal, -90 a 90 | Ubicación del recinto | Manual |
| `longitud` | decimal, -180 a 180 | Ubicación del recinto | Manual |
| `tamano` | entero, 1 a 3 | 1 chico, 2 mediano, 3 grande. Lo usa el modelo de minutos | Manual, se determina a ojo. |
| `es_apto_dependientes` | booleano, por defecto 1 | Si el recinto es adecuado para niñas, niños o personas mayores. Los que no lo son se ocultan a quien viaja con ellos | Manual. Si no se envía, vale 1. |

### recinto_valores
Valores para comparar con los gustos que ingrese la persona. Se envían junto con el recinto en POST /recintos y se reemplazan con PUT /recintos/{id}/valores.

| Columna | Tipo | Para qué sirve | Cómo se puebla |
|---|---|---|---|
| `recinto_id` | entero, PK y FK | Recinto al que pertenecen los valores. Si se borra el recinto, se borran sus valores | El `id` del recinto |
| `historia` … `aventura` | entero, 0 a 3 | Cuánto ofrece el recinto de cada gusto: 0 nada, 1 secundario, 2 importante, 3 razón principal | Manual, determinado a ojo e investigación. |
