# Encuesta v2
 
La v1 (4 recintos, 3 gustos, respuesta sí/no) funcionó como piloto.
 
## Estructura general
 
Son dos formularios de Google Forms independientes, Parte A y Parte B. Cada uno tiene 6 de los 12 recintos y se distribuye por separado. Así la encuesta es más corta y evita que las personas contesten al azar por hostigamiento y entre los dos se cubren los 12. Cada formulario genera su propio CSV.
 
Los dos formularios son idénticos excepto por los recintos:
 

- Sección 1  Consentimiento
- Sección 2  Tus gustos (6 escalas + control de atención)
- Sección 3  Recintos (los 6 de esa parte)
- Sección 4  Feedback
 
La encuesta solo pregunta lo que necesitan los modelos, sin datos personales ni de perfil.

---
 
## Sección 1. Consentimiento
 
| # | Pregunta | Tipo | Opciones |
|---|---|---|---|
| 1.1 | ¿Aceptas voluntariamente que usemos tus respuestas en este proyecto académico? No se te pedirá nombre, correo ni ningún dato que te identifique. | Opción múltiple (obligatoria) | Sí · No |
 
"No" lleva directo al final del formulario.
 
## Sección 2. Tus gustos
 
Escala lineal del **1 (nada)** al **5 (muchísimo)** en todas. Los códigos coinciden con la tabla `gustos` de la base de datos.
 
| # | Código | Pregunta |
|---|---|---|
| 2.1 | `historia` | ¿Cuánto te interesa conocer la historia detrás de los lugares que visitas? |
| 2.2 | `artes_artesanias` | ¿Cuánto te interesan el arte, las artesanías y los oficios tradicionales durante un viaje? |
| 2.3 | `arquitectura` | ¿Cuánto disfrutas observar edificios, templos o construcciones con valor arquitectónico? |
| 2.4 | `gastronomia` | ¿Cuánto te interesa probar la comida típica de los lugares que visitas? |
| 2.5 | `naturaleza` | ¿Cuánto disfrutas estar en contacto con la naturaleza durante un viaje? |
| 2.6 | `aventura` | ¿Cuánto disfrutas actividades que impliquen esfuerzo físico o algo de riesgo, como caminatas largas, cabalgatas o tirolesas? |
| 2.7 | — | **Control de atención:** Para confirmar que lees con atención, selecciona el número 2 en esta pregunta. |
 
La pregunta 2.7 va mezclada entre las demás. Ayuda a determinar mejor quien respondió sin ver, o colocó si o no a todas.
 
## Sección 3. Recintos
 
Cada recinto es una ficha con el mismo formato:
 
1. Imagen: (elemento de imagen de Forms), con el crédito en el pie: autor y licencia.
2. Descripción: de 2 a 3 líneas, de largo parecido y en tono neutral (sin "imperdible", "el mejor"…). Debe mencionar los atributos con valor 2 o 3 en su calificación, porque la persona debe conocer justo lo que el modelo usa.
3. Pregunta de interés:, escala lineal:
   - ¿Qué tanto te gustaría incluir **RECINTO** en un viaje a Michoacán?
   - 1 (nada) — 5 (muchísimo)
4. Pregunta de tiempo, opción múltiple:
   - Si lo visitaras, ¿cuánto tiempo le dedicarías? (sin contar el traslado)
   - Menos de 30 min · 30 min a 1 h · 1 a 2 h · 2 a 3 h · 3 a 5 h · Más de 5 h
### Reparto de recintos
 
Cada formulario mezcla historia, arte, arquitectura, gastronomía, naturaleza y aventura, para que nadie vea solo museos ni solo naturaleza.
 
**Formulario Parte A**
 
| Orden | `recinto_id` | Recinto | H | A | Ar | G | N | Av | T |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `tzintzuntzan` | Zona Arqueológica de Tzintzuntzan | 3 | 0 | 2 | 0 | 2 | 0 | 3 |
| 2 | `santa_clara_del_cobre` | Santa Clara del Cobre | 1 | 3 | 1 | 1 | 0 | 0 | 2 |
| 3 | `paricutin` | Volcán Paricutín y templo sepultado de San Juan Parangaricutiro | 2 | 0 | 1 | 0 | 3 | 3 | 3 |
| 4 | `museo_regional_michoacano` | Museo Regional Michoacano | 3 | 1 | 2 | 0 | 0 | 0 | 2 |
| 5 | `centro_historico_morelia` | Centro Histórico de Morelia | 2 | 1 | 3 | 2 | 0 | 0 | 3 |
| 6 | `lago_zirahuen` | Lago de Zirahuén | 0 | 0 | 0 | 2 | 3 | 2 | 2 |
 
**Formulario Parte B**
 
| Orden | `recinto_id` | Recinto | H | A | Ar | G | N | Av | T |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `tingambato` | Zona Arqueológica de Tingambato | 3 | 0 | 1 | 0 | 2 | 0 | 1 |
| 2 | `quiroga` | Quiroga | 1 | 2 | 1 | 3 | 0 | 0 | 2 |
| 3 | `santuario_monarca_el_rosario` | Santuario de la Mariposa Monarca El Rosario | 0 | 0 | 0 | 0 | 3 | 2 | 3 |
| 4 | `museo_artes_oficios_patzcuaro` | Museo de Artes y Oficios de Pátzcuaro | 1 | 3 | 1 | 0 | 0 | 0 | 1 |
| 5 | `ex_convento_cuitzeo` | Ex Convento de Santa María Magdalena (Museo de la Estampa), Cuitzeo | 3 | 1 | 3 | 0 | 1 | 0 | 2 |
| 6 | `tlalpujahua` | Tlalpujahua | 2 | 2 | 2 | 1 | 1 | 1 | 2 |
 
> H historia · A artes y artesanías · Ar arquitectura · G gastronomía · N naturaleza · Av aventura · T tamaño (1–3).
 
Los `recinto_id` serán los mismos que en la tabla `recintos` de la base de datos. Tzintzuntzan, Tingambato, Museo Regional, Museo de Artes y Oficios y el Ex Convento de Cuitzeo están además en el catálogo del INAH con datos de afluencia.

### Borradores de descripción
 
**Parte A**
- **Tzintzuntzan:** Antigua capital del pueblo purépecha, a orillas del lago de Pátzcuaro. Sus yácatas, basamentos de piedra de forma semicircular, se recorren a pie y tienen vista al lago. Cuenta con museo de sitio.
- **Santa Clara del Cobre:** Pueblo mágico conocido por el cobre martillado a mano. Se pueden visitar talleres artesanales y el museo del cobre, y comprar piezas directamente a los artesanos.
- **Paricutín:** Volcán que nació en 1943 en medio de un campo de cultivo. Se llega a caballo o caminando desde Angahuan, por campos de lava, hasta la torre del templo que quedó sepultada.
- **Museo Regional Michoacano:** Museo en el centro de Morelia, dentro de un edificio virreinal. Reúne piezas arqueológicas, objetos y pinturas que cuentan la historia de Michoacán.
- **Centro Histórico de Morelia:** Centro de la ciudad declarado Patrimonio de la Humanidad, con catedral, plazas y edificios de cantera rosa. Se recorre a pie, con cafés y comida típica en los portales.
- **Lago de Zirahuén:** Lago rodeado de bosque, con actividades como kayak, paseos en lancha y tirolesa. En la orilla hay restaurantes que sirven trucha y comida local.

**Parte B**
- **Tingambato:** Zona arqueológica pequeña entre Pátzcuaro y Uruapan, rodeada de vegetación. Tiene un juego de pelota y basamentos que se recorren en poco tiempo.
- **Quiroga:** Pueblo a orillas del lago de Pátzcuaro, famoso por sus carnitas y por su mercado de artesanías de madera, barro y textiles.
- **Santuario de la Mariposa Monarca El Rosario:** Bosque de oyamel donde millones de mariposas monarca pasan el invierno, más o menos de noviembre a marzo. Se sube caminando o a caballo por un sendero de montaña.
- **Museo de Artes y Oficios de Pátzcuaro:** Museo en un antiguo colegio del siglo XVI. Exhibe artesanías tradicionales de Michoacán: lacas, textiles, cerámica y trabajos en madera.
- **Ex Convento de Cuitzeo:** Convento agustino del siglo XVI con una fachada labrada en piedra, junto al lago de Cuitzeo. En su interior está el Museo de la Estampa, dedicado al grabado.
- **Tlalpujahua:** Pueblo mágico minero con calles empedradas. Se puede recorrer la antigua Mina Dos Estrellas y visitar los talleres donde se fabrican esferas navideñas.

## Sección 4. Comentarios

| # | Pregunta | Tipo |
|---|---|---|
| 4.1 | ¿Hubo alguna pregunta o descripción difícil de entender? Si deseas, cuéntanos qué información te faltó para poder decidir. (opcional) | Párrafo |

---

## De la encuesta a los datos de entrenamiento

Cada respuesta genera **6 filas**, una por cada recinto que vio la persona. Lo hace el pipeline (`pipeline/encuesta/`): lee los dos CSV, los junta y les agrega los valores de los recintos de las tablas de arriba.

| Columna | Origen | Descripción |
|---|---|---|
| `persona_id` | Generado | Número consecutivo por respuesta, único entre los dos formularios. Se usa para separar por persona, no entra al modelo |
| `parte_encuesta` | Archivo de origen | `A` o `B`, según de qué formulario viene la respuesta |
| `recinto_id` | Ficha | Recinto evaluado |
| `gusto_historia` … `gusto_aventura` | 2.1–2.6 | Gustos de la persona (1–5) |
| `calificacion_interes` | Pregunta de interés | Respuesta original, de 1 a 5 |
| `intencion` | Derivada | **1 si `calificacion_interes` ≥ 4**, 0 en otro caso. Es la **y** del modelo de interés |
| `rango_minutos` | Pregunta de tiempo | Rango elegido tal cual |
| `minutos` | Derivada | Punto medio del rango. Es la **y** del modelo de minutos |

Correspondencia de rangos a minutos:

| Rango | `minutos` |
|---|---|
| Menos de 30 min | 20 |
| 30 min a 1 h | 45 |
| 1 a 2 h | 90 |
| 2 a 3 h | 150 |
| 3 a 5 h | 240 |
| Más de 5 h | 330 |

Las afinidades (`afinidad_historia = gusto_historia × recinto_historia`, etc.) se calculan al construir el conjunto de entrenamiento, no en la encuesta.

## Limpieza

- Se eliminan las respuestas que fallaron el control de atención que no sean 2, las que tienen todo en sí o todo en no (la misma calificación en los 6 recintos), y las que no dieron consentimiento.
- Se reporta el número de respuestas eliminadas por cada criterio.

## Tamaño de muestra
Regla práctica para la regresión logística: de 10 a 20 casos de la clase menos frecuente por cada coeficiente. Con 12 variables (6 gustos + 6 afinidades), eso equivale a entre 120 y 240 filas de la clase minoritaria.
 
Con 6 filas por persona y una clase minoritaria de alrededor del 40 %, la meta es:
 
- Mínimo: 50 respuestas válidas en total (unas 25 por formulario).
- Optimo: 100 o más (unas 50 por formulario), para que cada recinto tenga suficientes evaluaciones.
## Imágenes
 
El repositorio es público, así que se usan fotos propias o con licencia libre. No se usan imágenes de sitios comerciales.