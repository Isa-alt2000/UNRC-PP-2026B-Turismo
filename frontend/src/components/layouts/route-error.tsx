import { TriangleAlert } from 'lucide-react'
import { Button, StatePanel } from '@/components/ui'
import { Screen } from './screen'

/** Red de seguridad: se muestra si una pantalla falla al renderizar o al descargarse. */
export function RouteError() {
  return (
    <Screen>
      <div className="wrap">
        <StatePanel
          icon={TriangleAlert}
          title="Algo salió mal"
          actions={<Button onClick={() => window.location.assign('/')}>Volver al inicio</Button>}
        >
          No pudimos mostrar esta pantalla. Vuelve al inicio para intentarlo de nuevo.
        </StatePanel>
      </div>
    </Screen>
  )
}
