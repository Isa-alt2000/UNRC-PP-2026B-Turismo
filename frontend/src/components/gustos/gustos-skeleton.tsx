import { ActionBar, Screen } from '@/components/layouts'
import { Skeleton } from '@/components/ui'
import './gustos.css'

const TARJETAS = 6

/** Misma forma que el formulario de gustos, mientras se descarga la pantalla o llegan los datos. */
export function GustosSkeleton() {
  return (
    <>
      <Screen conCintillo>
        <div className="wrap" role="status" aria-label="Cargando tus opciones">
          <div className="prefs">
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="h-9 w-64 max-w-full" />
              <Skeleton className="h-4 w-80 max-w-full" />
            </div>
            <div className="section items-center">
              <Skeleton className="h-5 w-56" />
              <Skeleton className="mb-1.5 h-3.5 w-48" />
              <div className="gustos-list w-full">
                {Array.from({ length: TARJETAS }, (_, i) => (
                  <div key={i} className="gusto-s">
                    <div className="gusto-s-head">
                      <Skeleton className="size-[38px] rounded-[10px]" />
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-[26px] w-24 rounded-full" />
                    </div>
                    <div className="flex h-11 items-center px-3.5">
                      <Skeleton className="h-1.5 w-full rounded-full" />
                    </div>
                    <Skeleton className="mx-2 h-3" />
                  </div>
                ))}
              </div>
            </div>
            <div className="two-col">
              {[0, 1].map((i) => (
                <div key={i} className="section">
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="h-[52px] rounded-xl" />
                  <Skeleton className="h-3.5 w-3/4" />
                </div>
              ))}
            </div>
            <Skeleton className="h-[72px] rounded-2xl" />
          </div>
        </div>
      </Screen>
      <ActionBar>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-12 w-44 rounded-xl" />
      </ActionBar>
    </>
  )
}
