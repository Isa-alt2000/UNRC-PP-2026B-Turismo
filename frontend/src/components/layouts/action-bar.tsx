import { type ReactNode } from 'react'

/** Barra fija al pie de una pantalla del flujo, con la acción para avanzar. */
export function ActionBar({ children }: { children: ReactNode }) {
  return (
    <footer className="actionbar">
      <div className="actionbar-in">{children}</div>
    </footer>
  )
}
