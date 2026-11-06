import { useRef } from 'react'
import { useNavigate } from 'react-router'
import { ArmaSeccion, Hero } from '@/components/inicio'
import { Screen } from '@/components/layouts'
import { Greca } from '@/components/shared'

export function InicioPage() {
  const navigate = useNavigate()
  const scroller = useRef<HTMLDivElement>(null)
  const seccion = useRef<HTMLElement>(null)
  const titulo = useRef<HTMLHeadingElement>(null)

  // La pantalla se desplaza dentro de su contenedor, no en la ventana.
  const irASeccion = () => {
    if (!scroller.current || !seccion.current) return
    const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const top =
      seccion.current.getBoundingClientRect().top -
      scroller.current.getBoundingClientRect().top +
      scroller.current.scrollTop
    scroller.current.scrollTo({ top, behavior: reducirMovimiento ? 'auto' : 'smooth' })
    titulo.current?.focus({ preventScroll: true })
  }

  return (
    <Screen ref={scroller}>
      <Hero onBajar={irASeccion} />
      <Greca />
      <ArmaSeccion
        ref={seccion}
        tituloRef={titulo}
        onEmpezar={() => void navigate('/viaje/gustos')}
      />
    </Screen>
  )
}
