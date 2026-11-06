import { MapPinOff } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Screen } from '@/components/layouts'
import { Button, StatePanel } from '@/components/ui'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <Screen>
      <div className="wrap">
        <StatePanel
          icon={MapPinOff}
          title="Página no encontrada"
          actions={<Button onClick={() => void navigate('/')}>Volver al inicio</Button>}
        >
          Esta dirección no existe.
        </StatePanel>
      </div>
    </Screen>
  )
}
