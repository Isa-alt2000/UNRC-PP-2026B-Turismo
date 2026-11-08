import { lazy, Suspense } from 'react'
// Directo de cada archivo y no del index de su carpeta: así el resto queda en la carga diferida.
import { GustosSkeleton } from '@/components/gustos/gustos-skeleton'
import { RecomendacionesSkeleton } from '@/components/recomendaciones/recomendaciones-skeleton'

// Las pantallas del viaje se descargan solo cuando la persona entra en ellas.
const GustosPage = lazy(() =>
  import('@/pages/gustos-page').then((modulo) => ({ default: modulo.GustosPage }))
)
const RecomendacionesPage = lazy(() =>
  import('@/pages/recomendaciones-page').then((modulo) => ({
    default: modulo.RecomendacionesPage,
  }))
)

/** Mientras se descarga cada pantalla se ve su skeleton, no una pantalla en blanco. */
export function GustosDiferida() {
  return (
    <Suspense fallback={<GustosSkeleton />}>
      <GustosPage />
    </Suspense>
  )
}

export function RecomendacionesDiferida() {
  return (
    <Suspense fallback={<RecomendacionesSkeleton />}>
      <RecomendacionesPage />
    </Suspense>
  )
}
