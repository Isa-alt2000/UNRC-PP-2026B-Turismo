import { queryOptions, useQuery } from '@tanstack/react-query'
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

/** Respuesta tentativa de POST /recomendaciones; se ajusta cuando exista el endpoint. */
export interface RecintoRecomendado {
  id: string
  nombre: string
  probabilidad: number
  afluencia: NivelAfluencia
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
export const recomendacionesQuery = (solicitud: SolicitudRecomendaciones) =>
  queryOptions({
    queryKey: ['recomendaciones', solicitud] as const,
    // Es POST porque envía las respuestas, pero solo consulta: por eso se maneja como lectura.
    queryFn: ({ signal }) =>
      apiFetch<RecintoRecomendado[]>('/recomendaciones', {
        method: 'POST',
        json: solicitud,
        signal,
      }),
  })

export function useRecomendaciones(solicitud: SolicitudRecomendaciones) {
  return useQuery(recomendacionesQuery(solicitud))
}
