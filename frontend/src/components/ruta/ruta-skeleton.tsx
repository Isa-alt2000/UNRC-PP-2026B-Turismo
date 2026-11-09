import { Screen } from '@/components/layouts'
import { Skeleton } from '@/components/ui'
import './ruta.css'

/** Misma forma que la ruta, mientras se descarga la pantalla o se calcula el itinerario. */
export function RutaSkeleton() {
  return (
    <Screen conCintillo>
      <div className="wrap">
        <div className="ruta-head">
          <h1 className="h1">Tu ruta</h1>
        </div>
        <p className="status-line" role="status">
          <span className="spinner" aria-hidden="true" />
          Calculando el mejor orden para tus paradas…
        </p>
        <div className="ruta-grid" aria-hidden="true">
          <div className="ruta-mapa">
            <Skeleton className="h-(--mapa-alto) w-full rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </div>
          <div className="itin">
            {[0, 1].map((i) => (
              <div key={i} className="sk-card">
                <Skeleton className="h-[18px] w-[30%]" />
                <Skeleton className="h-3.5 w-4/5" />
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3.5 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Screen>
  )
}
