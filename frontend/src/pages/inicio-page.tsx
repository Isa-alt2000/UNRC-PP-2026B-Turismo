import { type RefObject, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { ArmaSeccion, Hero } from '@/components/inicio'
import { Screen } from '@/components/layouts'
import { Greca } from '@/components/shared'

interface Destino {
  scroller: RefObject<HTMLDivElement | null>
  seccion: RefObject<HTMLElement | null>
  titulo: RefObject<HTMLHeadingElement | null>
}

// La pantalla se desplaza dentro de su contenedor, no en la ventana.
function irASeccion({ scroller, seccion, titulo }: Destino, suave: boolean) {
  if (!scroller.current || !seccion.current) return
  const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const top =
    seccion.current.getBoundingClientRect().top -
    scroller.current.getBoundingClientRect().top +
    scroller.current.scrollTop
  scroller.current.scrollTo({ top, behavior: suave && !reducirMovimiento ? 'smooth' : 'auto' })
  titulo.current?.focus({ preventScroll: true })
}

export function InicioPage() {
  const navigate = useNavigate()
  const { hash } = useLocation()
  const scroller = useRef<HTMLDivElement>(null)
  const seccion = useRef<HTMLElement>(null)
  const titulo = useRef<HTMLHeadingElement>(null)

  // Al volver desde el paso 1 se regresa directo a esta sección y no a la portada.
  useEffect(() => {
    if (hash === '#arma') irASeccion({ scroller, seccion, titulo }, false)
  }, [hash])

  return (
    <Screen ref={scroller}>
      <Hero onBajar={() => irASeccion({ scroller, seccion, titulo }, true)} />
      <Greca />
      <ArmaSeccion
        ref={seccion}
        tituloRef={titulo}
        onEmpezar={() => void navigate('/viaje/gustos')}
      />
    </Screen>
  )
}
