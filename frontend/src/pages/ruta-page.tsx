import { Navigate, useNavigate } from 'react-router'
import { useGustos } from '@/components/gustos'
import { Screen } from '@/components/layouts'
import { armarSolicitudItinerario, RutaSkeleton, RutaVista, useItinerario } from '@/components/ruta'
import { ErrorConReintento } from '@/components/shared'
import { MAX_LUGARES, MIN_LUGARES, NAVEGACION_ATRAS } from '@/config/constants'
import { preferenciasFaltantes } from '@/lib/preferencias'
import { useViajeStore } from '@/stores'

export function RutaPage() {
  const navigate = useNavigate()
  const preferencias = useViajeStore((s) => s.preferencias)
  const seleccion = useViajeStore((s) => s.seleccion)
  // Los gustos ya vienen en caché desde el paso 1; solo se piden si se recargó la página.
  const gustos = useGustos()
  const solicitud = gustos.data
    ? armarSolicitudItinerario(
        preferencias,
        seleccion,
        gustos.data.map((g) => g.codigo)
      )
    : null
  const itinerario = useItinerario(solicitud)
  const editar = () => void navigate('/viaje/lugares', NAVEGACION_ATRAS)

  // Al entrar por un enlace o sin terminar los pasos anteriores, se vuelve al que falta.
  if (preferenciasFaltantes(preferencias).length > 0) {
    return <Navigate to="/viaje/gustos" replace />
  }
  if (seleccion.length < MIN_LUGARES || seleccion.length > MAX_LUGARES) {
    return <Navigate to="/viaje/lugares" replace />
  }

  if (gustos.isError || itinerario.isError) {
    return (
      <Screen>
        <div className="wrap">
          <ErrorConReintento
            titulo="No pudimos calcular tu ruta"
            reintentando={gustos.isFetching || itinerario.isFetching}
            onReintentar={() => void (gustos.isError ? gustos.refetch() : itinerario.refetch())}
            textoSecundario="Editar lugares"
            onSecundario={editar}
          >
            Revisa tu conexión e inténtalo de nuevo. Tus lugares siguen guardados.
          </ErrorConReintento>
        </div>
      </Screen>
    )
  }

  if (!itinerario.data) return <RutaSkeleton />

  return <RutaVista itinerario={itinerario.data} onEditar={editar} />
}
