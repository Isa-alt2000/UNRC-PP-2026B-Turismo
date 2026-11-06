/** Tiempo durante el cual los datos del servidor se consideran frescos y no se vuelven a pedir. */
export const QUERY_STALE_TIME_MS = 60_000

/** Opciones de navigate para que la pantalla entre con la animación de regreso. */
export const NAVEGACION_ATRAS = { state: { direccion: 'atras' } }

/** Desde este nivel (1 a 5), un gusto cuenta para las recomendaciones. */
export const NIVEL_MINIMO = 3
export const NIVEL_INICIAL = 1
export const PALABRAS_NIVEL = ['', 'No me interesa', 'Poco', 'Me interesa', 'Mucho', 'Me encanta']

export const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

// Fijas por ahora; cuando el backend exponga los puntos de partida vendrán de la API.
export const SALIDAS = [
  { id: 'morelia', nombre: 'Morelia' },
  { id: 'patzcuaro', nombre: 'Pátzcuaro' },
  { id: 'uruapan', nombre: 'Uruapan' },
]
