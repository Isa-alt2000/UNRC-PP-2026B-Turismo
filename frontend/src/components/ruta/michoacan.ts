import { latLngBounds } from 'leaflet'
import michoacan from './michoacan.json'

/** Contorno del estado en [latitud, longitud]; de aquí salen la sombra y los límites del mapa. */
export const CONTORNO_MICHOACAN: [number, number][] = michoacan.geometry.coordinates[0].map(
  ([longitud, latitud]) => [latitud, longitud]
)

// El rectángulo que encierra el contorno más un 10 % por lado (unos 25 a 40 km): así los recintos
// cerca del borde (Paricutín, Tlalpujahua) no quedan pegados a la orilla del mapa.
export const LIMITES_MICHOACAN = latLngBounds(CONTORNO_MICHOACAN).pad(0.1)
