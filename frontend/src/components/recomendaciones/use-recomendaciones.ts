import { queryOptions, skipToken, useQuery } from '@tanstack/react-query'
import { type NivelAfluencia } from '@/components/shared'
import { apiFetch } from '@/lib/api/client'
import { nivelDe, type Preferencias } from '@/lib/preferencias'

/** Cuerpo de POST /recomendaciones. Las claves siguen el formato de la API. */
export interface SolicitudRecomendaciones {
  /** Nivel de 1 a 5 de cada gusto del catálogo, por su código. */
  gustos: Record<string, number>
  mes: number
  con_dependientes: boolean
}

/** familiar sale de es_apto_dependientes; chico, mediano o grande, del tamaño del recinto. */
export type EtiquetaRecinto = 'familiar' | 'chico' | 'mediano' | 'grande'

export interface RecintoRecomendado {
  id: string
  nombre: string
  descripcion: string | null
  probabilidad: number
  afluencia: NivelAfluencia
  etiquetas: EtiquetaRecinto[]
}

export interface RespuestaRecomendaciones {
  /** Hasta 10 recintos afines, de mayor a menor probabilidad. */
  recintos: RecintoRecomendado[]
  /** 3 sugerencias de menor afluencia cuando hay 3 afines o menos; si no, vacío. */
  recintos_por_afluencia: RecintoRecomendado[]
}

/**
 * Arma la solicitud con todos los gustos del catálogo: los que no se tocaron van en su nivel inicial.
 * Sin mes no hay solicitud posible, porque la afluencia depende de él.
 */
export function armarSolicitud(
  { niveles, mes, conDependientes }: Preferencias,
  codigos: string[]
): SolicitudRecomendaciones | null {
  if (mes === null) return null
  return {
    gustos: Object.fromEntries(codigos.map((codigo) => [codigo, nivelDe(niveles, codigo)])),
    mes,
    con_dependientes: conDependientes,
  }
}

// La solicitud completa forma parte de la llave: cada combinación de respuestas tiene su propio resultado.
export const recomendacionesQuery = (solicitud: SolicitudRecomendaciones | null) =>
  queryOptions({
    queryKey: ['recomendaciones', solicitud] as const,
    // Es POST porque envía las respuestas, pero solo consulta: por eso se maneja como lectura.
    // Sin solicitud completa, skipToken evita lanzar la petición.
    queryFn: solicitud
      ? ({ signal }) =>
          apiFetch<RespuestaRecomendaciones>('/recomendaciones', {
            method: 'POST',
            json: solicitud,
            signal,
          })
      : skipToken,
  })

export function useRecomendaciones(solicitud: SolicitudRecomendaciones | null) {
  return useQuery(recomendacionesQuery(solicitud))
}
