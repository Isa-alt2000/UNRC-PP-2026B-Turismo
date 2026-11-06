import { lazy, Suspense } from 'react'
// Directo del archivo y no del index de gustos: así el resto de esa carpeta queda en la carga diferida.
import { GustosSkeleton } from '@/components/gustos/gustos-skeleton'

// Las pantallas del viaje se descargan solo cuando la persona entra en ellas.
const GustosPage = lazy(() =>
  import('@/pages/gustos-page').then((modulo) => ({ default: modulo.GustosPage }))
)

/** Mientras se descarga la pantalla se ve su skeleton, no una pantalla en blanco. */
export function GustosDiferida() {
  return (
    <Suspense fallback={<GustosSkeleton />}>
      <GustosPage />
    </Suspense>
  )
}
