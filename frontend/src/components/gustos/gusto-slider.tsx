import { useId } from 'react'
import { Check } from 'lucide-react'
import { NIVEL_MINIMO, PALABRAS_NIVEL } from '@/config/constants'
import { cn } from '@/lib/utils'
import { iconoDe } from './iconos'
import { type Gusto } from './use-gustos'

const NIVELES = [1, 2, 3, 4, 5]

interface GustoSliderProps {
  gusto: Gusto
  valor: number
  onChange: (valor: number) => void
}

/** Tarjeta de un gusto con su deslizador del 1 al 5. Se resalta cuando el gusto cuenta. */
export function GustoSlider({ gusto, valor, onChange }: GustoSliderProps) {
  const id = useId()
  const activo = valor >= NIVEL_MINIMO

  return (
    <div className={cn('gusto-s', activo && 'is-on')}>
      <div className="gusto-s-head">
        <span className="gusto-ico" aria-hidden="true">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={iconoDe(gusto.codigo)} />
          </svg>
        </span>
        <label className="gusto-label" htmlFor={id}>
          {gusto.nombre}
        </label>
        <span className="nivel" aria-hidden="true">
          {activo && <Check size={12} strokeWidth={3.2} />}
          {PALABRAS_NIVEL[valor]}
        </span>
      </div>
      <div className="rango-wrap">
        <div className="rango-track" aria-hidden="true">
          <div className="rango-fill" style={{ width: `${(valor - 1) * 25}%` }} />
        </div>
        <input
          id={id}
          className="rango"
          type="range"
          min="1"
          max="5"
          step="1"
          value={valor}
          aria-describedby={`${id}-pregunta`}
          aria-valuetext={`${valor} de 5, ${PALABRAS_NIVEL[valor]}`}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <span id={`${id}-pregunta`} className="sr-only">
          {gusto.pregunta}
        </span>
      </div>
      {/* Tocar un número elige ese nivel: es el atajo táctil, ya que la barra solo se mueve
          arrastrando el círculo. Teclado y lectores de pantalla usan el deslizador. */}
      <div className="rango-scale" aria-hidden="true">
        {NIVELES.map((n) => (
          <span
            key={n}
            className={cn('rango-num', n === valor && 'cur')}
            onClick={() => onChange(n)}
          >
            {n}
          </span>
        ))}
      </div>
    </div>
  )
}
