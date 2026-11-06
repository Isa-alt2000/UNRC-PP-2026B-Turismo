import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/client'

/** Un gusto tal como lo devuelve GET /gustos. */
export interface Gusto {
  codigo: string
  nombre: string
  pregunta: string
}

// Una sola fuente para las llaves evita que lectura e invalidación se desincronicen.
export const gustosKeys = { todos: ['gustos'] as const }

export function useGustos() {
  return useQuery({
    queryKey: gustosKeys.todos,
    queryFn: ({ signal }) => apiFetch<Gusto[]>('/gustos', { signal }),
    // El catálogo no cambia durante una visita: se pide una sola vez.
    staleTime: Infinity,
  })
}
