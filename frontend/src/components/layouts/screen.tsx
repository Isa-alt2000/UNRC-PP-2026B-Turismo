import { type ReactNode, type Ref } from 'react'

interface ScreenProps {
  children: ReactNode
  ref?: Ref<HTMLDivElement>
}

/** Zona desplazable de una pantalla, con animación de entrada. */
export function Screen({ children, ref }: ScreenProps) {
  return (
    <div className="flex-1 overflow-y-auto overscroll-contain" ref={ref}>
      <main className="enter-fwd">{children}</main>
    </div>
  )
}
