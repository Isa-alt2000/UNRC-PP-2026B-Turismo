import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CELDAS_ALA } from './ala-monarca'
import { HeroArt } from './hero-art'

const TINTA = '#1f1a17'
const ALA = '#faf4e8'

/** Altura donde empieza la banda negra del borde del ala, sobre la línea base (y = 0). */
const BORDE = -18
/** Lunares del borde: dos filas, la de abajo más chica y corrida media separación. */
const SEPARACION = 9
const LUNARES = Array.from({ length: Math.ceil(500 / SEPARACION) + 1 }, (_, i) => i * SEPARACION)

/**
 * "Michoacán." como ala monarca: celdas naranjas entre venas negras y, abajo, la banda negra del
 * borde con dos filas de lunares blancos. Es SVG porque el ala se recorta con la forma de las
 * letras. La unidad del viewBox es 1/100 de em (Fredoka 700 a 100, línea base en y = 0).
 */
function NombreMonarca() {
  const recorte = useId()
  return (
    <svg className="hero-nombre-svg" viewBox="0 -76 500 80" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={recorte}>
          <text x={0} y={0} fontFamily="Fredoka" fontWeight={700} fontSize={100} letterSpacing={-1}>
            Michoacán.
          </text>
        </clipPath>
      </defs>
      <g clipPath={`url(#${recorte})`}>
        <rect x={0} y={-80} width={500} height={90} fill={TINTA} />
        {CELDAS_ALA.map((celda) => (
          <path
            key={celda.d}
            d={celda.d}
            fill={celda.fill}
            stroke={TINTA}
            strokeWidth={4.2}
            strokeLinejoin="round"
          />
        ))}
        <rect x={0} y={BORDE} width={500} height={30} fill={TINTA} />
        {LUNARES.map((x) => (
          <g key={x} fill={ALA}>
            <circle cx={x} cy={BORDE + 6} r={2.4} />
            <circle cx={x + SEPARACION / 2} cy={BORDE + 13.5} r={1.8} />
          </g>
        ))}
      </g>
    </svg>
  )
}

export function Hero({ onBajar }: { onBajar: () => void }) {
  const portadaRef = useRef<HTMLElement>(null)
  const [enPantalla, setEnPantalla] = useState(true)

  // Las animaciones continuas no deben gastar procesador mientras la portada no se ve.
  useEffect(() => {
    if (!portadaRef.current || typeof IntersectionObserver === 'undefined') return
    const observador = new IntersectionObserver(([entrada]) => {
      if (entrada) setEnPantalla(entrada.isIntersecting)
    })
    observador.observe(portadaRef.current)
    return () => observador.disconnect()
  }, [])

  return (
    <section
      className={cn('hero', !enPantalla && 'hero-pausada')}
      ref={portadaRef}
      aria-labelledby="hero-title"
    >
      <HeroArt />
      <div className="hero-in">
        <h1 id="hero-title" className="hero-title">
          <span className="hero-nombre">
            <span className="sr-only forced-colors:not-sr-only">Michoacán.</span>
            <NombreMonarca />
          </span>{' '}
          <span className="hero-lema">
            <span className="hero-lema-estado">Un estado,</span>{' '}
            <span className="hero-lema-historias">mil historias</span>
          </span>
        </h1>
      </div>
      {/* Frases que aparecen cuando la mariposa se posa: una sobre el sol y otra junto a ella. */}
      <div className="hero-frases">
        <p className="hero-frase hero-frase-sol">
          <span>¿Unos días libres?</span> <span className="hero-frase-acento">Ya tienes plan.</span>
        </p>
        <p className="hero-frase hero-frase-mariposa">
          <span>Tú pon las ganas,</span>{' '}
          <span className="hero-frase-acento">nosotros la ruta.</span>
        </p>
      </div>
      <div className="hero-acciones">
        <button type="button" className="hero-cue" onClick={onBajar}>
          Arma tu ruta
          <ChevronDown size={18} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}
