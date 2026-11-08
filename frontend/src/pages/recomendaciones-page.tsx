import { Navigate, useNavigate } from 'react-router'
import { useGustos } from '@/components/gustos'
import { Screen } from '@/components/layouts'
import {
  armarSolicitud,
  RecomendacionesLista,
  RecomendacionesSkeleton,
  useRecomendaciones,
} from '@/components/recomendaciones'
import { ErrorConReintento } from '@/components/shared'
import { NAVEGACION_ATRAS } from '@/config/constants'
import { preferenciasFaltantes } from '@/lib/preferencias'
import { useViajeStore } from '@/stores'

export function RecomendacionesPage() {
  const navigate = useNavigate()
  const preferencias = useViajeStore((s) => s.preferencias)
  // Los gustos ya vienen en caché desde el paso anterior; solo se piden si se recargó la página.
  const gustos = useGustos()
  const solicitud = gustos.data
    ? armarSolicitud(
        preferencias,
        gustos.data.map((g) => g.codigo)
      )
    : null
  const recomendaciones = useRecomendaciones(solicitud)

  // Sin respuestas completas (por ejemplo, al entrar por un enlace) se vuelve al paso 1.
  if (preferenciasFaltantes(preferencias).length > 0) {
    return <Navigate to="/viaje/gustos" replace />
  }

  if (gustos.isError || recomendaciones.isError) {
    return (
      <Screen>
        <div className="wrap">
          <ErrorConReintento
            titulo="No pudimos cargar las recomendaciones"
            reintentando={gustos.isFetching || recomendaciones.isFetching}
            onReintentar={() =>
              void (gustos.isError ? gustos.refetch() : recomendaciones.refetch())
            }
            textoSecundario="Revisar mis gustos"
            onSecundario={() => void navigate('/viaje/gustos', NAVEGACION_ATRAS)}
          >
            Revisa tu conexión e inténtalo de nuevo. Tus respuestas siguen guardadas.
          </ErrorConReintento>
        </div>
      </Screen>
    )
  }

  if (!recomendaciones.data) return <RecomendacionesSkeleton />

  return (
    <RecomendacionesLista
      respuesta={recomendaciones.data}
      onCrearRuta={() => void navigate('/viaje/ruta')}
    />
  )
}
