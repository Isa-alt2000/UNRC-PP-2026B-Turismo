# Modelo de interés: cómo funciona

## Qué pregunta responde

**Qué tan probable es que a *esta persona* le interese incluir *este recinto* en su viaje?**

El modelo siempre recibe una persona y un recinto juntos, y devuelve un número entre 0 y 1. No elige recintos por sí mismo: la aplicación le pregunta por cada recinto del catálogo y luego ordena los resultados.

## Los dos lados: la persona y el recinto

Ambos se describen con los **mismos 6 gustos**:

| Gusto | Código |
|---|---|
| Historia | `historia` |
| Artes y artesanías | `artes_artesanias` |
| Arquitectura | `arquitectura` |
| Gastronomía | `gastronomia` |
| Naturaleza | `naturaleza` |
| Aventura | `aventura` |

**La persona** califica cuánto le gusta cada cosa, del 1 (nada) al 5 (muchísimo). Lo responde en la encuesta y, después, en la aplicación.

**El recinto** tiene asignado cuánto ofrece de cada cosa, del **0 al 3**. Lo califica el equipo con una regla escrita:

| Valor | Significado |
|---|---|
| 0 | No tiene nada de esto |
| 1 | Está presente, pero es secundario |
| 2 | Es un atractivo importante |
| 3 | Es la razón principal para ir |

## La afinidad
La afinidad mide qué tanto coincide lo que le gusta a la persona con lo que ofrece el recinto. Se calcula gusto por gusto, multiplicando:

**afinidad = gusto de la persona × valor del recinto**

### Ejemplo: Paricutín

| | Historia | Artes | Arquitectura | Gastronomía | Naturaleza | Aventura |
|---|---|---|---|---|---|---|
| Gustos de la Persona | 4 | 1 | 1 | 5 | 5 | 4 |
| Valores de Paricutín | 2 | 0 | 1 | 0 | 3 | 3 |
| **Afinidad** | **8** | **0** | **1** | **0** | **15** | **12** |

- **Naturaleza (15):** a la persona le encanta y el recinto la ofrece de sobra, así que la afinidad es alta.
- **Gastronomía (0):** a la persona le encanta, pero Paricutín no ofrece gastronomía, así que no suma nada. Ese gusto sí le sumaría en un recinto como Cotija o Quiroga.
- **Artes (0):** el recinto no ofrece artes y a la persona casi no le interesan. Tampoco suma.
### ¿Por qué multiplicar?

Porque así el resultado depende de las dos partes a la vez. El mismo recinto tiene afinidades distintas para personas distintas:

| | Gusto por la naturaleza | Naturaleza de Paricutín | Afinidad |
|---|---|---|---|
| Persona A | 1 | 3 | 3 |
| Persona B | 5 | 3 | 15 |

Si se usara solo el valor del recinto (el 3), Paricutín recibiría el mismo empujón para las dos personas, y todos los usuarios recibirían la misma lista de recomendaciones.

## Qué entra al modelo y qué sale
Entran 12 números:
 
| Columnas | Qué representan |
|---|---|
| 6 gustos de la persona (`gusto_*`) | Qué tan "viajera" es la persona en general: alguien que califica todo alto tiende a decir que sí a todo |
| 6 afinidades (`afinidad_*`) | Qué tanto encaja este recinto con esta persona |

Los valores del recinto (0–3) no entran directamente al modelo. Solo se usan para calcular las afinidades.

Sale una probabilidad, por ejemplo 0.81. Si supera el umbral definido, el recinto se considera de interés para la persona.

## De dónde aprende el modelo?
De la encuesta. Cada persona evalúa 6 recintos, y cada evaluación es una fila de entrenamiento:

- Entradas: sus 6 gustos + las 6 afinidades con ese recinto.
- Respuesta de intención: 1 si calificó su interés en el recinto con 4 o 5 o 0 si lo calificó con 1, 2 o 3.
Al entrenar, el modelo aprende cuánto pesa cada afinidad. Por ejemplo, podría descubrir que la afinidad de naturaleza pesa más que la de arquitectura para decidir si alguien incluye un recinto.

## Cómo lo usa la aplicación
1. El usuario califica sus 6 gustos.
2. Para cada recinto del catálogo, el backend calculará las 6 afinidades y le pide al modelo la probabilidad. Lo hace con todos los recintos a la vez, en una sola llamada para no cargar de peticiones.
3. Se quedan los recintos que superan el umbral.
4. Se ordenan de menor a mayor afluencia o sin datos, para dar prioridad a los lugares menos visitados.

## Recintos nuevos
El modelo aprende cuánto pesa cada tipo de afinidad. Por eso un recinto que no estuvo en la encuesta se puede recomendar con solo asignarle sus 6 valores (0–3), sin volver a entrenar.
 
La predicción es más confiable cuando el recinto nuevo se parece a alguno de los encuestados. Si tiene una combinación que la encuesta no cubrió (por ejemplo, mucha aventura sin naturaleza), la predicción tiene menos respaldo.

## Relación con el modelo de minutos
El modelo de interés decide qué recintos recomendar. El tiempo que una persona pasaría en cada uno lo estima otro modelo, un árbol de regresión, que usa los valores del recinto, su tamaño y los gustos de la persona. Se entrena solo con las filas donde `intencion = 1`.
 