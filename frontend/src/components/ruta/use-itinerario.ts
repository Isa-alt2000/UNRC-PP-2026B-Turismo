import { queryOptions, skipToken, useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/client'
import { nivelDe, type Preferencias } from '@/lib/preferencias'

/** Cuerpo de POST /itinerarios. Las claves siguen el formato de la API. */
export interface SolicitudItinerario {
  salida: string
  /** Claves de los recintos elegidos; el backend decide el orden. */
  recintos: string[]
  gustos: Record<string, number>
}

/** micro y pequena son negocios locales; mediana y grande, no. */
export type TamanoHotel = 'micro' | 'pequena' | 'mediana' | 'grande'

/** Alojamiento del DENUE (INEGI) cerca de la última parada de un día. */
export interface HotelCercano {
  id: number
  nombre: string
  tipo: string
  tamano: TamanoHotel
  es_local: boolean
  /** En línea recta desde la última parada del día. */
  distancia_km: number
  telefono: string | null
  sitio_web: string | null
  direccion: string | null
  latitud: number
  longitud: number
}

export interface ImagenRecinto {
  /** Ruta servida por el backend, como /api/v1/static/recintos/R0002.webp. */
  url: string
  /** Autor y licencia, cuando la foto es de terceros. */
  credito: string | null
}

/** [longitud, latitud], el orden de GeoJSON. */
export type Coordenada = [number, number]

export interface Parada {
  /** Posición en todo el viaje, empezando en 1. */
  orden: number
  id: string
  nombre: string
  descripcion: string | null
  /** Foto de referencia con su crédito, o sin_imagen si el recinto no tiene. */
  imagen: ImagenRecinto | 'sin_imagen'
  latitud: number
  longitud: number
  km_desde_anterior: number
  minutos_traslado: number
  minutos_visita: number
}

export interface Dia {
  dia: number
  paradas: Parada[]
  trazo: { type: 'LineString'; coordinates: Coordenada[] }
  totales: {
    km: number
    minutos_traslado: number
    minutos_visita: number
    minutos_jornada: number
  }
  /** El día pasa del límite: un lugar que por sí solo no cabe en una jornada. */
  excede_jornada: boolean
  /** Hasta 5 alojamientos cerca de la última parada, por distancia; al menos 3 locales si los hay. */
  hoteles: HotelCercano[]
  /** 10, o 25 si a 10 km había menos de 3 alojamientos. */
  radio_hoteles_km: number
}

export interface Itinerario {
  /** true si las distancias y el trazo son en línea recta porque falló la API de rutas. */
  aproximada: boolean
  salida: { id: string; nombre: string; latitud: number; longitud: number }
  minutos_por_dia: number
  dias: Dia[]
  totales: { km: number; minutos_traslado: number; minutos_visita: number; dias: number }
}

/** Sin punto de partida o sin lugares no hay itinerario que pedir. */
export function armarSolicitudItinerario(
  { niveles, salida }: Preferencias,
  seleccion: string[],
  codigos: string[]
): SolicitudItinerario | null {
  if (!salida || seleccion.length === 0) return null
  return {
    salida,
    // Ordenados: la misma selección en otro orden es la misma ruta y comparte caché.
    recintos: [...seleccion].sort(),
    gustos: Object.fromEntries(codigos.map((codigo) => [codigo, nivelDe(niveles, codigo)])),
  }
}

export const itinerarioQuery = (solicitud: SolicitudItinerario | null) =>
  queryOptions({
    queryKey: ['itinerario', solicitud] as const,
    // Es POST porque envía la selección, pero solo consulta: por eso se maneja como lectura.
    queryFn: solicitud
      ? ({ signal }) =>
          apiFetch<Itinerario>('/itinerarios', { method: 'POST', json: solicitud, signal })
      : skipToken,
    // La ruta de una misma selección no cambia durante la visita; así volver a ella no gasta cuota.
    staleTime: Infinity,
  })

export function useItinerario(solicitud: SolicitudItinerario | null) {
  return useQuery(itinerarioQuery(solicitud))
}
