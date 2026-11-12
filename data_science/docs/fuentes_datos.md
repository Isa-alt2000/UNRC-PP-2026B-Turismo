# Fuentes de datos

Una sección por fuente. Donde falta el dato se deja `TODO`.

## INAH: zonas arqueológicas

- **Archivo:** `datos/crudos/inah/INAH_visitantes_zonas_general.csv`
- **URL:** `https://www.datos.inah.gob.mx/datos-abiertos/visitantes-zonas-arqueologicas`
- **Fecha de descarga:** Septiembre del 2026
- **Licencia:** uso académico.
- **Notas:** nacional, visitantes nacionales y extranjeros por mes y recinto.

## INAH: museos

- **Archivo:** `datos/crudos/inah/INAH_visitantes_museos_general.csv`
- **URL:** `https://datos.inah.gob.mx/datos-abiertos/visitantes-museos`
- **Fecha de descarga:** Septiembre del 2026
- **Licencia:** uso académico.
- **Notas:** mismo formato que el archivo de zonas.

## Encuesta

- **Archivos:** `datos/crudos/encuesta/encuesta_parte_a.csv` (Parte A) y `encuesta_parte_b.csv` (Parte B) como exportaciones de Google Forms.
- **URL de los formularios:** `https://forms.gle/p6jRM8i5kMFmjXtf8` (v1)
- **Fecha de exportación:** TODO
- **Periodo de respuestas:** TODO
- **Licencia:** uso académico, con consentimiento de quienes respondieron.
- **Notas:** no pide nombre ni correo. La descripción de la encuesta está en `encuesta.md`.

## DENUE (INEGI): hospedaje

- **Archivo:** `datos/crudos/inegi/denue_inegi_16_.csv`, Michoacán (entidad 16), todos los sectores. No se sube a git por su tamaño (150 MB); el diccionario (`denue_diccionario_de_datos.csv`) y los metadatos (`metadatos_denue.txt`) sí.
- **URL:** `https://www.inegi.org.mx/contenidos/masiva/denue/denue_16_csv.zip` (página de descargas: `https://www.inegi.org.mx/app/descarga/?ti=6`)
- **Edición:** DENUE 05/2026, publicada el 20 de mayo de 2026.
- **Licencia:** Términos de Libre Uso de la Información del INEGI (`https://www.inegi.org.mx/inegi/terminos.html`): se puede usar y publicar citando la fuente.
- **Notas:** codificación ISO-8859-1 (latin-1). 287,049 establecimientos; de ellos, 1,033 de hospedaje (SCIAN 7211, 7212 y 7213), que filtra `pipeline/denue/hoteles.py`. Trae teléfono en el 30 % de los hoteles y sitio web en el 20 %; no trae precios, calificaciones ni fotos.
- **Tamaño:** el DENUE da el personal ocupado en rangos que define INEGI (0 a 5, 6 a 10, 11 a 30…). El pipeline lo convierte en `tamano` con la estratificación por personal para servicios de los Censos Económicos de INEGI: micro (0 a 10), pequena (11 a 50), mediana (51 a 100) y grande (101 o más). En Michoacán: 827 micro, 180 pequeñas, 20 medianas y 6 grandes.
