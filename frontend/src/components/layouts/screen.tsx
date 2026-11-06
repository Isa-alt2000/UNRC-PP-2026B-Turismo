import { type ReactNode, type Ref } from 'react'
import { useLocation } from 'react-router'
import { Greca } from '@/components/shared'
import { NAVEGACION_ATRAS } from '@/config/constants'
import { cn } from '@/lib/utils'

interface ScreenProps {
  children: ReactNode
  ref?: Ref<HTMLDivElement>
  /** Cierra el contenido con un cintillo, al fondo aunque la pantalla tenga poco contenido. */
  conCintillo?: boolean
}

/** Zona desplazable de una pantalla. La entrada indica si se avanzó o se volvió atrás. */
export function Screen({ children, ref, conCintillo = false }: ScreenProps) {
  const { state } = useLocation()
  const volviendo =
    (state as { direccion?: string } | null)?.direccion === NAVEGACION_ATRAS.state.direccion

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain" ref={ref}>
      <main
        className={cn(
          volviendo ? 'enter-back' : 'enter-fwd',
          // En columna flex, el margen automático de .wrap la encogería a su contenido.
          conCintillo && 'flex min-h-full flex-col [&>.wrap]:w-full'
        )}
      >
        {children}
        {conCintillo && (
          <div className="mt-auto">
            <Greca />
          </div>
        )}
      </main>
    </div>
  )
}
