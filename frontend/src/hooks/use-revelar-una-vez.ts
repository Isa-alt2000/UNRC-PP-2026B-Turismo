import { useEffect, useRef, useState } from 'react'

type Fase = 'pendiente' | 'animando' | 'listo'

// En memoria a propósito: sobrevive a la navegación interna y se reinicia al recargar la página.
const revelados = new Set<string>()

/** Anima la entrada de un elemento la primera vez que llega a la pantalla. */
export function useRevelarUnaVez<T extends HTMLElement>(
  clave: string,
  efecto: 'izquierda' | 'derecha' | 'pasos'
) {
  const ref = useRef<T>(null)
  const [fase, setFase] = useState<Fase>(() =>
    revelados.has(clave) || typeof IntersectionObserver === 'undefined' ? 'listo' : 'pendiente'
  )

  useEffect(() => {
    if (fase !== 'pendiente' || !ref.current) return
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada?.isIntersecting) return
        observador.disconnect()
        revelados.add(clave)
        setFase('animando')
      },
      { threshold: 0.2 }
    )
    observador.observe(ref.current)
    return () => observador.disconnect()
  }, [clave, fase])

  const clase =
    fase === 'pendiente' ? 'revelar-oculto' : fase === 'animando' ? `revelar-${efecto}` : undefined

  return [ref, clase] as const
}
