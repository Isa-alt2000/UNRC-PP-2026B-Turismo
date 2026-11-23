import { useLayoutEffect, type CSSProperties } from 'react'
import { useRevelarUnaVez } from '@/hooks/use-revelar-una-vez'
import { cn } from '@/lib/utils'

const COLOR_HUELLA = '#1F1A17'
const PASO = 30
const TOTAL_HUELLAS = 90
const AMPLITUD = 16
const LONGITUD_ONDA = 150
const SEPARACION_PIES = 8
const GRADOS = 180 / Math.PI

// Rastro vertical que baja serpenteando. El final está en (0, 0) y las huellas se extienden hacia arriba.
const HUELLAS = Array.from({ length: TOTAL_HUELLAS }, (_, i) => {
  const fase = (2 * Math.PI * i * PASO) / LONGITUD_ONDA
  const angulo = Math.atan(-AMPLITUD * ((2 * Math.PI) / LONGITUD_ONDA) * Math.cos(fase))
  const lado = i % 2 ? 1 : -1
  const x = -(AMPLITUD * Math.sin(fase) + lado * SEPARACION_PIES * Math.cos(angulo))
  const y = -i * PASO - lado * SEPARACION_PIES * Math.sin(angulo)
  const giro = 90 + angulo * GRADOS + lado * 6
  return { i, transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${giro.toFixed(1)})` }
})

interface RastroHuellasProps {
  clave: string
  contorno?: boolean
  className?: string
}

/** Rastro que entra por el borde superior de la sección y se detiene en su ancla. */
export function RastroHuellas({ clave, contorno = false, className }: RastroHuellasProps) {
  const [rastroRef, rastroClase] = useRevelarUnaVez<HTMLDivElement>(clave, 'pasos')

  // Solo cuentan las huellas que caben entre el borde y el ancla; las demás no deben retrasar la entrada.
  useLayoutEffect(() => {
    if (!rastroClase || !rastroRef.current) return
    const distancia = rastroRef.current.offsetTop
    rastroRef.current.style.setProperty('--visibles', String(Math.ceil(distancia / PASO) + 1))
  }, [rastroClase, rastroRef])

  const trazo = contorno
    ? { fill: 'none', stroke: COLOR_HUELLA, strokeWidth: 1.25 }
    : { fill: COLOR_HUELLA }

  return (
    <div className={cn('huellas', className, rastroClase)} ref={rastroRef} aria-hidden="true">
      <svg width="1" height="1" {...trazo}>
        {HUELLAS.map(({ i, transform }) => (
          <g key={i} className="huella" transform={transform} style={{ '--i': i } as CSSProperties}>
            <ellipse cx="4" rx="6.5" ry="4" />
            <ellipse cx="-7.5" rx="3.2" ry="3.2" />
          </g>
        ))}
      </svg>
    </div>
  )
}
