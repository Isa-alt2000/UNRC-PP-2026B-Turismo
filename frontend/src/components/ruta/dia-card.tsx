import { type CSSProperties } from 'react'
import { Car, Clock, MapPin, TriangleAlert } from 'lucide-react'
import { distancia, duracion } from '@/lib/formato'
import { cn } from '@/lib/utils'
import { colorDia } from './colores'
import { HotelesDia } from './hoteles'
import { esParada, type Seleccion } from './seleccion'
import { type Dia } from './use-itinerario'

interface DiaCardProps {
  dia: Dia
  /** De dónde sale el día: el punto de partida o el último lugar del día anterior. */
  desde: string
  minutosPorDia: number
  seleccion: Seleccion | null
  onVerEnMapa: (seleccion: Seleccion) => void
}

/** Un día del itinerario: línea de tiempo de traslados y visitas, y dónde dormir al final. */
export function DiaCard({ dia, desde, minutosPorDia, seleccion, onVerEnMapa }: DiaCardProps) {
  const ultima = dia.paradas.at(-1)!
  const paradas = dia.paradas.length === 1 ? '1 parada' : `${dia.paradas.length} paradas`

  return (
    // El color del día (el de su trazo en el mapa) pinta la franja, el borde y el recorrido.
    <section
      className="dia"
      aria-labelledby={`dia-${dia.dia}`}
      style={{ '--dia': colorDia(dia.dia) } as CSSProperties}
    >
      <div className="dia-head">
        <h3 id={`dia-${dia.dia}`} className="dia-title">
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
                <button
                  type="button"
                  className={cn(
                    'tl-name ver-en-mapa',
                    esParada(seleccion, parada.id) && 'is-elegido'
                  )}
                  onClick={() => onVerEnMapa({ tipo: 'parada', parada, dia: dia.dia })}
                >
                  <span className="sr-only">Parada {parada.orden}: </span>
                  {parada.nombre}
                  <MapPin
                    className="ver-en-mapa-ico"
                    size={14}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span className="sr-only"> (ver en el mapa)</span>
                </button>
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

      <HotelesDia
        dia={dia}
        cerca={ultima.nombre}
        seleccion={seleccion}
        onVerEnMapa={(hotel) => onVerEnMapa({ tipo: 'hotel', hotel, dia: dia.dia })}
      />
    </section>
  )
}
