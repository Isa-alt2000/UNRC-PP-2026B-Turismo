import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { GustosForm, GustosSkeleton, useGustos } from '@/components/gustos'
import { Screen } from '@/components/layouts'
import { armarSolicitud, recomendacionesQuery } from '@/components/recomendaciones'
import { ErrorConReintento } from '@/components/shared'
import { NAVEGACION_ATRAS } from '@/config/constants'
import { useViajeStore } from '@/stores'

export function GustosPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: gustos, isPending, isError, isFetching, refetch } = useGustos()

  if (isPending) return <GustosSkeleton />

  // Que la carga falle y que no haya gustos son casos distintos, pero en ambos no se puede avanzar.
  if (isError || gustos.length === 0) {
    return (
      <Screen>
        <div className="wrap">
          <ErrorConReintento
            titulo={isError ? 'No pudimos cargar los gustos' : 'Aún no hay gustos disponibles'}
            reintentando={isFetching}
            onReintentar={() => void refetch()}
            textoSecundario="Volver al inicio"
            onSecundario={() => void navigate('/', NAVEGACION_ATRAS)}
          >
            {isError
              ? 'Revisa tu conexión e inténtalo de nuevo.'
              : 'Inténtalo de nuevo en unos minutos.'}
          </ErrorConReintento>
        </div>
      </Screen>
    )
  }

  // Las recomendaciones se piden aquí y la siguiente pantalla las lee de la caché ya calculadas.
  const verLugares = () => {
    const { preferencias } = useViajeStore.getState()
    const solicitud = armarSolicitud(
      preferencias,
      gustos.map((g) => g.codigo)
    )
    if (!solicitud) return
    void queryClient.prefetchQuery(recomendacionesQuery(solicitud))
    void navigate('/viaje/lugares')
  }

  return <GustosForm gustos={gustos} onEnviar={verLugares} />
}
