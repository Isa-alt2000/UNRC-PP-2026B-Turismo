import { ActionBar, Screen } from '@/components/layouts'
import { Skeleton } from '@/components/ui'
import './recomendaciones.css'

const TARJETAS = 4

/** Misma forma que la lista de lugares, mientras se descarga la pantalla o llegan los datos. */
export function RecomendacionesSkeleton() {
  return (
    <>
      <Screen conCintillo>
        <div className="wrap" role="status" aria-label="Buscando lugares para ti">
          <div className="recs">
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="h-9 w-56 max-w-full" />
              <Skeleton className="h-4 w-80 max-w-full" />
            </div>
            <div className="lugares">
              {Array.from({ length: TARJETAS }, (_, i) => (
                <div key={i} className="lugar">
                  <div className="lugar-head">
                    <Skeleton className="h-5 flex-1" />
                    <Skeleton className="size-[26px] rounded-lg" />
                  </div>
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-3/4" />
                  <div className="lugar-foot">
                    <Skeleton className="h-7 w-24 rounded-etiqueta" />
                    <Skeleton className="h-7 w-32 rounded-etiqueta" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Screen>
      <ActionBar>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-12 w-40 rounded-xl" />
      </ActionBar>
    </>
  )
}
