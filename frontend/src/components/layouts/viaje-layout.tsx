import { ChevronLeft } from 'lucide-react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { Greca } from '@/components/shared'
import { NAVEGACION_ATRAS } from '@/config/constants'
import { cn } from '@/lib/utils'

const PASOS = [
  { path: '/viaje/gustos', nombre: 'Tus gustos', anterior: '/#arma' },
  { path: '/viaje/lugares', nombre: 'Recomendaciones', anterior: '/viaje/gustos' },
  { path: '/viaje/ruta', nombre: 'Tu ruta', anterior: '/viaje/lugares' },
]

/** Marco del flujo: botón para volver y progreso de los pasos. */
export function ViajeLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const actual = Math.max(
    PASOS.findIndex((paso) => paso.path === pathname),
    0
  )
  const paso = PASOS[actual]!

  return (
    <>
      <Greca />
      <header className="topbar">
        <div className="topbar-in">
          <button
            type="button"
            className="icon-btn"
            aria-label="Volver al paso anterior"
            onClick={() => void navigate(paso.anterior, NAVEGACION_ATRAS)}
          >
            <ChevronLeft size={22} strokeWidth={1.8} aria-hidden="true" />
          </button>
          <nav className="progress" aria-label="Progreso">
            <p className="progress-label">
              <strong>
                Paso {actual + 1} de {PASOS.length}
              </strong>{' '}
              · {paso.nombre}
            </p>
            <ol className="progress-track">
              {PASOS.map((p, i) => (
                <li
                  key={p.path}
                  className={cn('seg', i <= actual && 'seg-on')}
                  aria-current={i === actual ? 'step' : undefined}
                >
                  <span className="sr-only">
                    {p.nombre}
                    {i < actual && ' (completado)'}
                    {i === actual && ' (actual)'}
                  </span>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </header>
      <Outlet />
    </>
  )
}
