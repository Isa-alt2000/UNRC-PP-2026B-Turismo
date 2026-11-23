import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HeroArt } from './hero-art'

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
          <span className="hero-nombre">Michoacán.</span>{' '}
          <span className="hero-lema">
            <span className="hero-lema-estado">Un estado,</span>{' '}
            <span className="hero-lema-historias">mil historias</span>
          </span>
        </h1>
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
