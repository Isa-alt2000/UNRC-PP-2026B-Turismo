import { type TamanoHotel } from './use-itinerario'

/** Estratificación por personal ocupado de INEGI. */
export const TEXTO_TAMANO: Record<TamanoHotel, string> = {
  micro: 'Microempresa',
  pequena: 'Pequeña empresa',
  mediana: 'Mediana empresa',
  grande: 'Gran empresa',
}

/** 4433121955 → 443 312 1955 */
export const telefonoLegible = (telefono: string) =>
  `${telefono.slice(0, 3)} ${telefono.slice(3, 6)} ${telefono.slice(6)}`

/** El dominio sin https:// ni www., para mostrarlo corto. */
export const dominio = (sitio: string) =>
  sitio
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
