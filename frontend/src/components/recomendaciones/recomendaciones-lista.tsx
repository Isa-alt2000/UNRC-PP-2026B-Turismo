import { ActionBar, Screen } from '@/components/layouts'
import { Button } from '@/components/ui'
import { MAX_LUGARES, MIN_LUGARES } from '@/config/constants'
import { useFocusOnMount } from '@/hooks/use-focus-on-mount'
import { useViajeStore } from '@/stores'
import { LugarCard } from './lugar-card'
import { type RecintoRecomendado, type RespuestaRecomendaciones } from './use-recomendaciones'
import './recomendaciones.css'

interface RecomendacionesListaProps {
  respuesta: RespuestaRecomendaciones
  onCrearRuta: () => void
}

/** Los lugares afines y, si son pocos, las sugerencias por afluencia, para elegir de 2 a 4. */
export function RecomendacionesLista({ respuesta, onCrearRuta }: RecomendacionesListaProps) {
  const titulo = useFocusOnMount<HTMLHeadingElement>()
  const seleccionGuardada = useViajeStore((s) => s.seleccion)
  const alternarRecinto = useViajeStore((s) => s.alternarRecinto)
  const fijarSeleccion = useViajeStore((s) => s.fijarSeleccion)
  const { recintos, recintos_por_afluencia: extra } = respuesta

  // Una selección de una búsqueda anterior puede incluir lugares que ya no aparecen.
  const visibles = new Set([...recintos, ...extra].map((r) => r.id))
  const seleccion = seleccionGuardada.filter((id) => visibles.has(id))
  const lleno = seleccion.length >= MAX_LUGARES

  const tarjetas = (lista: RecintoRecomendado[], mostrarAfinidad: boolean) => (
    <ul className="lugares">
      {lista.map((recinto) => {
        const elegido = seleccion.includes(recinto.id)
        return (
          <LugarCard
            key={recinto.id}
            recinto={recinto}
            seleccionado={elegido}
            bloqueado={lleno && !elegido}
            mostrarAfinidad={mostrarAfinidad}
            onToggle={() => alternarRecinto(recinto.id)}
          />
        )
      })}
    </ul>
  )

  return (
    <>
      <Screen conCintillo>
        <div className="wrap">
          <div className="recs">
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="h1" tabIndex={-1} ref={titulo}>
                Lugares para ti
              </h1>
              <p className="lead-sm">
                Elige de {MIN_LUGARES} a {MAX_LUGARES} lugares para armar tu ruta.
              </p>
            </div>

            {recintos.length > 0 && (
              <section className="recs-grupo recs-afines" aria-labelledby="recs-afines">
                <h2 id="recs-afines" className="h2">
                  Afines a tus gustos
                </h2>
                {tarjetas(recintos, true)}
              </section>
            )}

            {extra.length > 0 && (
              <section className="recs-grupo recs-extra" aria-labelledby="recs-extra">
                <h2 id="recs-extra" className="h2">
                  {recintos.length === 0
                    ? 'Vaya, ninguno se ajustó a tus gustos, pero no te preocupes: tenemos otras sorpresas para ti.'
                    : 'También podrían interesarte estos lugares'}
                </h2>
                {tarjetas(extra, false)}
              </section>
            )}
          </div>
        </div>
      </Screen>

      <ActionBar>
        <p className="action-hint" aria-live="polite">
          {seleccion.length} de {MAX_LUGARES} lugares
          {seleccion.length < MIN_LUGARES && ` · elige al menos ${MIN_LUGARES}`}
        </p>
        <Button
          disabled={seleccion.length < MIN_LUGARES}
          onClick={() => {
            // La ruta usa solo los lugares que se ven, no los guardados de una búsqueda anterior.
            fijarSeleccion(seleccion)
            onCrearRuta()
          }}
        >
          Crear mi ruta
        </Button>
      </ActionBar>
    </>
  )
}
