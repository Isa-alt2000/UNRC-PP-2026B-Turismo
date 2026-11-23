import { type ReactNode, type Ref, useEffect } from 'react'
import { X } from 'lucide-react'

interface PanelFichaProps {
  /** Nombre del panel para lectores de pantalla, como "Parada 2: Tzintzuntzan". */
  titulo: string
  onCerrar: () => void
  ref?: Ref<HTMLElement>
  children: ReactNode
}

/**
 * Ficha anclada al mapa: en escritorio, en la esquina inferior izquierda; en celular, abajo a todo
 * el ancho. A diferencia de un globo sobre el punto, nunca queda cortada por el borde del mapa.
 * Se cierra con la ✕, con Esc o tocando el mapa (eso lo maneja el mapa).
 */
export function PanelFicha({ titulo, onCerrar, ref, children }: PanelFichaProps) {
  useEffect(() => {
    const alTeclear = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [onCerrar])

  return (
    <section className="mapa-panel" aria-label={titulo} ref={ref} tabIndex={-1}>
      <button type="button" className="mapa-panel-cerrar" aria-label="Cerrar" onClick={onCerrar}>
        <X size={16} strokeWidth={2.2} aria-hidden="true" />
      </button>
      <div className="mapa-panel-contenido">{children}</div>
    </section>
  )
}
