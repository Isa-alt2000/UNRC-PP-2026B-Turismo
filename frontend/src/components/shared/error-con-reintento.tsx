import { type ReactNode } from 'react'
import { RotateCw, WifiOff } from 'lucide-react'
import { Button, StatePanel } from '@/components/ui'

interface ErrorConReintentoProps {
  titulo: string
  reintentando: boolean
  onReintentar: () => void
  textoSecundario: string
  onSecundario: () => void
  children: ReactNode
}

/** Error de carga de una pantalla completa: reintentar o volver a un paso anterior. */
export function ErrorConReintento({
  titulo,
  reintentando,
  onReintentar,
  textoSecundario,
  onSecundario,
  children,
}: ErrorConReintentoProps) {
  return (
    <StatePanel
      icon={WifiOff}
      title={titulo}
      actions={
        <>
          <Button disabled={reintentando} onClick={onReintentar}>
            <RotateCw size={18} strokeWidth={2} aria-hidden="true" />
            Reintentar
          </Button>
          <Button variant="secondary" onClick={onSecundario}>
            {textoSecundario}
          </Button>
        </>
      }
    >
      {children}
    </StatePanel>
  )
}
