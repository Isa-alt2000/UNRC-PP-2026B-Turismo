import { type FormEvent } from 'react'
import { ActionBar, Screen } from '@/components/layouts'
import { Button, RadioCards, Select, Switch } from '@/components/ui'
import { MESES } from '@/config/constants'
import { useFocusOnMount } from '@/hooks/use-focus-on-mount'
import { nivelDe, preferenciasFaltantes, textoFaltantes } from '@/lib/preferencias'
import { useViajeStore } from '@/stores'
import { GustoSlider } from './gusto-slider'
import { type Gusto } from './use-gustos'
import { type PuntoPartida } from './use-puntos-partida'
import './gustos.css'

const OPCIONES_MES = MESES.map((label, i) => ({ value: i + 1, label }))

interface GustosFormProps {
  gustos: Gusto[]
  puntosPartida: PuntoPartida[]
  /** Se llama solo cuando las respuestas están completas. */
  onEnviar: () => void
}

/** Preguntas del primer paso. Cada respuesta se guarda al momento para conservarla al volver. */
export function GustosForm({ gustos, puntosPartida, onEnviar }: GustosFormProps) {
  const titulo = useFocusOnMount<HTMLHeadingElement>()
  const preferencias = useViajeStore((s) => s.preferencias)
  const { setNivel, setMes, setSalida, setConDependientes } = useViajeStore.getState()
  const faltan = preferenciasFaltantes(preferencias)

  const enviar = (event: FormEvent) => {
    event.preventDefault()
    if (faltan.length === 0) onEnviar()
  }

  return (
    <form className="contents" noValidate onSubmit={enviar}>
      <Screen conCintillo>
        <div className="wrap">
          <div className="prefs">
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="h1" tabIndex={-1} ref={titulo}>
                ¿Qué te gustaría vivir?
              </h1>
              <p className="lead-sm">
                Con esto ordenamos los lugares para ti. Puedes cambiarlo cuando quieras.
              </p>
            </div>

            <fieldset className="section">
              <legend className="field-label mb-1.5 w-full justify-center">
                ¿Cuánto te interesa cada uno?
              </legend>
              <p className="help mb-3.5 text-center">Del 1 (no me interesa) al 5 (me encanta).</p>
              <div className="gustos-list">
                {gustos.map((gusto) => (
                  <GustoSlider
                    key={gusto.codigo}
                    gusto={gusto}
                    valor={nivelDe(preferencias.niveles, gusto.codigo)}
                    onChange={(nivel) => setNivel(gusto.codigo, nivel)}
                  />
                ))}
              </div>
            </fieldset>

            <div className="two-col">
              <Select
                label="¿En qué mes viajas?"
                placeholder="Elige un mes"
                help="Pedimos el mes porque los datos de visitas son mensuales."
                options={OPCIONES_MES}
                value={preferencias.mes}
                onChange={setMes}
              />
              <RadioCards
                legend="¿Desde dónde sales?"
                help="Lo usamos para calcular el orden de tu ruta."
                options={puntosPartida}
                value={preferencias.salida}
                onChange={setSalida}
              />
            </div>

            <Switch
              label="Viajo con niñas, niños o personas mayores"
              help="Ocultamos lugares con caminatas largas o terreno difícil, como el Paricutín."
              checked={preferencias.conDependientes}
              onChange={setConDependientes}
            />
          </div>
        </div>
      </Screen>

      <ActionBar>
        <p className="action-hint" aria-live="polite">
          {textoFaltantes(faltan)}
        </p>
        <Button type="submit" disabled={faltan.length > 0}>
          Ver lugares para mí
        </Button>
      </ActionBar>
    </form>
  )
}
