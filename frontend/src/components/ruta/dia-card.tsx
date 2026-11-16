import { Car, Clock, TriangleAlert } from 'lucide-react'
import { distancia, duracion } from '@/lib/formato'
import { colorDia } from './colores'
import { HotelesDia } from './hoteles'
import { type Dia } from './use-itinerario'

interface DiaCardProps {
  dia: Dia
  /** De dónde sale el día: el punto de partida o el último lugar del día anterior. */
  desde: string
  minutosPorDia: number
}

/** Un día del itinerario: línea de tiempo de traslados y visitas, y dónde dormir al final. */
export function DiaCard({ dia, desde, minutosPorDia }: DiaCardProps) {
  const ultima = dia.paradas.at(-1)!
  const paradas = dia.paradas.length === 1 ? '1 parada' : `${dia.paradas.length} paradas`

  return (
    <section className="dia" aria-labelledby={`dia-${dia.dia}`}>
      <div className="dia-head">
        <h3 id={`dia-${dia.dia}`} className="dia-title">
          <span
            className="dia-color"
            style={{ background: colorDia(dia.dia) }}
            aria-hidden="true"
          />
          Día {dia.dia}
        </h3>
        <p className="dia-meta">
          {paradas} · {duracion(dia.totales.minutos_jornada)}
        </p>
      </div>

      <ol className="tl">
        <li className="tl-row">
          <span className="tl-rail">
            <span className="tl-dot salida" aria-hidden="true" />
            <span className="tl-line" />
          </span>
          <span className="tl-body">
            <span className="tl-name">Salida desde {desde}</span>
          </span>
        </li>
        {dia.paradas.map((parada, i) => (
          <li key={parada.id}>
            <div className="tl-row">
              <span className="tl-rail">
                <span className="tl-line" />
              </span>
              <span className="tl-body travel">
                <Car size={15} strokeWidth={1.8} aria-hidden="true" />
                Traslado aprox. {duracion(parada.minutos_traslado)} ·{' '}
                {distancia(parada.km_desde_anterior)}
              </span>
            </div>
            <div className="tl-row">
              <span className="tl-rail">
                <span className="tl-dot" aria-hidden="true">
                  {parada.orden}
                </span>
                {i < dia.paradas.length - 1 && <span className="tl-line" />}
              </span>
              <span className="tl-body">
                <span className="tl-name">
                  <span className="sr-only">Parada {parada.orden}: </span>
                  {parada.nombre}
                </span>
                <span className="tl-visit">
                  <Clock size={15} strokeWidth={1.8} aria-hidden="true" />
                  Visita: {duracion(parada.minutos_visita)}
                </span>
              </span>
            </div>
          </li>
        ))}
      </ol>

      {dia.excede_jornada && (
        <div className="notice dia-aviso">
          <TriangleAlert className="notice-ico" size={18} strokeWidth={1.8} aria-hidden="true" />
          <p>
            Este día pasa de {duracion(minutosPorDia)}: el lugar queda lejos y su visita es larga.
            Considera salir temprano.
          </p>
        </div>
      )}

      <HotelesDia dia={dia} cerca={ultima.nombre} />
    </section>
  )
}
