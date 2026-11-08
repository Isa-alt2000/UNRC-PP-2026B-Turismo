import { Check } from 'lucide-react'
import { AfluenciaBadge } from '@/components/shared'
import { cn } from '@/lib/utils'
import { type EtiquetaRecinto, type RecintoRecomendado } from './use-recomendaciones'

/** Semáforo de afinidad: más de 60 % verde, más de 50 % naranja y lo demás rojo. */
function colorAfinidad(porcentaje: number) {
  if (porcentaje > 60) return 'afinidad-verde'
  if (porcentaje > 50) return 'afinidad-naranja'
  return 'afinidad-roja'
}

const TEXTO_ETIQUETA: Record<EtiquetaRecinto, string> = {
  familiar: 'Apto para familias',
  chico: 'Lugar pequeño',
  mediano: 'Lugar mediano',
  grande: 'Lugar grande',
}

interface LugarCardProps {
  recinto: RecintoRecomendado
  seleccionado: boolean
  /** Se desactiva cuando ya se eligió el máximo de lugares y este no es uno de ellos. */
  bloqueado: boolean
  /** En las sugerencias por afluencia no se muestra: su afinidad es baja por definición. */
  mostrarAfinidad: boolean
  onToggle: () => void
}

/** Tarjeta de un recinto recomendado; toda la tarjeta funciona como casilla para elegirlo. */
export function LugarCard({
  recinto,
  seleccionado,
  bloqueado,
  mostrarAfinidad,
  onToggle,
}: LugarCardProps) {
  const porcentaje = Math.round(recinto.probabilidad * 100)

  return (
    <li className="flex">
      <label className={cn('lugar flex-1', seleccionado && 'is-on', bloqueado && 'is-off')}>
        <input
          type="checkbox"
          className="lugar-input"
          checked={seleccionado}
          disabled={bloqueado}
          onChange={onToggle}
        />
        <span className="lugar-head">
          <span className="lugar-nombre">{recinto.nombre}</span>
          <span className="checkmark" aria-hidden="true">
            <Check size={16} strokeWidth={3} />
          </span>
        </span>
        {recinto.descripcion && <span className="lugar-desc">{recinto.descripcion}</span>}
        <span className="lugar-foot">
          <AfluenciaBadge nivel={recinto.afluencia} />
          {recinto.etiquetas.map((etiqueta) => (
            <span key={etiqueta} className="chip">
              {TEXTO_ETIQUETA[etiqueta]}
            </span>
          ))}
        </span>
        {mostrarAfinidad && (
          <span className={cn('afinidad', colorAfinidad(porcentaje))}>
            <span className="afinidad-punto" aria-hidden="true" />
            {porcentaje} % de afinidad
          </span>
        )}
      </label>
    </li>
  )
}
