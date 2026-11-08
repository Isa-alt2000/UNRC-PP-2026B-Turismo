import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { GustosForm, GustosSkeleton, useGustos, usePuntosPartida } from '@/components/gustos'
import { Screen } from '@/components/layouts'
import { armarSolicitud, recomendacionesQuery } from '@/components/recomendaciones'
import { ErrorConReintento } from '@/components/shared'
import { NAVEGACION_ATRAS } from '@/config/constants'
import { useViajeStore } from '@/stores'

export function GustosPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  // Los dos catálogos se piden en paralelo; la pantalla espera a ambos.
  const gustos = useGustos()
  const puntosPartida = usePuntosPartida()

  if (gustos.isPending || puntosPartida.isPending) return <GustosSkeleton />

  // Que la carga falle y que un catálogo venga vacío son casos distintos, pero en ambos no se
  // puede avanzar.
  const fallo = gustos.isError || puntosPartida.isError
  if (fallo || gustos.data.length === 0 || puntosPartida.data.length === 0) {
    return (
      <Screen>
        <div className="wrap">
          <ErrorConReintento
            titulo={fallo ? 'No pudimos cargar tus opciones' : 'Aún no hay opciones disponibles'}
            reintentando={gustos.isFetching || puntosPartida.isFetching}
            onReintentar={() => {
              if (gustos.isError) void gustos.refetch()
              if (puntosPartida.isError) void puntosPartida.refetch()
            }}
            textoSecundario="Volver al inicio"
            onSecundario={() => void navigate('/', NAVEGACION_ATRAS)}
          >
            {fallo
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
      gustos.data.map((g) => g.codigo)
    )
    if (!solicitud) return
    void queryClient.prefetchQuery(recomendacionesQuery(solicitud))
    void navigate('/viaje/lugares')
  }

  return (
    <GustosForm gustos={gustos.data} puntosPartida={puntosPartida.data} onEnviar={verLugares} />
  )
}
