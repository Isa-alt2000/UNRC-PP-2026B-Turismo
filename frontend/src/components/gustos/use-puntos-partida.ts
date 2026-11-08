import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/client'

/** Un punto de partida tal como lo devuelve GET /puntos-partida. */
export interface PuntoPartida {
  id: string
  nombre: string
  latitud: number
  longitud: number
}

export const puntosPartidaKeys = { todos: ['puntos-partida'] as const }

export function usePuntosPartida() {
  return useQuery({
    queryKey: puntosPartidaKeys.todos,
    queryFn: ({ signal }) => apiFetch<PuntoPartida[]>('/puntos-partida', { signal }),
    // El catálogo no cambia durante una visita: se pide una sola vez.
    staleTime: Infinity,
  })
}
