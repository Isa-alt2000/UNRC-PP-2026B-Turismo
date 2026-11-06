import { type ReactNode } from 'react'
import { type LucideIcon } from 'lucide-react'

interface StatePanelProps {
  icon: LucideIcon
  title: string
  children: ReactNode
  actions: ReactNode
}

/** Aviso centrado con ícono, título, explicación y acciones. */
export function StatePanel({ icon: Icon, title, children, actions }: StatePanelProps) {
  return (
    <div className="state-panel" role="alert">
      <span className="state-ico" aria-hidden="true">
        <Icon size={22} strokeWidth={1.6} />
      </span>
      <h2 className="h2">{title}</h2>
      <p className="lead-sm">{children}</p>
      <div className="flex flex-wrap justify-center gap-2">{actions}</div>
    </div>
  )
}
