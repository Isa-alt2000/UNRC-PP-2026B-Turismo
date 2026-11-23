import { useRef, useState } from 'react'
import { Info, Pencil } from 'lucide-react'
import { Screen } from '@/components/layouts'
import { Button } from '@/components/ui'
import { useFocusOnMount } from '@/hooks/use-focus-on-mount'
import { distancia, duracion } from '@/lib/formato'
import { DiaCard } from './dia-card'
import { BotonPdf } from './pdf/boton-pdf'
import { RutaMapa } from './ruta-mapa'
import { type Seleccion } from './seleccion'
import { type Itinerario } from './use-itinerario'
import './ruta.css'

interface RutaVistaProps {
  itinerario: Itinerario
  onEditar: () => void
}

/** La ruta calculada: mapa y resumen a un lado, itinerario por día al otro. */
export function RutaVista({ itinerario, onEditar }: RutaVistaProps) {
  const titulo = useFocusOnMount<HTMLHeadingElement>()
  const { dias, totales, salida, aproximada } = itinerario
  const [seleccion, setSeleccion] = useState<Seleccion | null>(null)
  const mapa = useRef<HTMLDivElement>(null)

  // Tocar un lugar en el itinerario lo abre en el mapa. En celular el mapa queda arriba de la
  // lista: si no se ve, la página sube hasta él (sin animar si se pidió reducir movimiento).
  const verEnMapa = (elegido: Seleccion) => {
    setSeleccion(elegido)
    const caja = mapa.current?.getBoundingClientRect()
    if (caja && (caja.top < 0 || caja.bottom > window.innerHeight)) {
      const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      mapa.current!.scrollIntoView({ block: 'start', behavior: reducir ? 'auto' : 'smooth' })
    }
  }

  return (
    <Screen conCintillo>
      <div className="wrap">
        <div className="ruta-head">
          <h1 className="h1" tabIndex={-1} ref={titulo}>
            Tu ruta
          </h1>
          <Button variant="secondary" size="small" onClick={onEditar}>
            <Pencil size={16} strokeWidth={1.8} aria-hidden="true" />
            Editar lugares
          </Button>
        </div>

        <div className="ruta-grid">
          <div className="ruta-mapa" ref={mapa}>
            <RutaMapa itinerario={itinerario} seleccion={seleccion} onSeleccion={setSeleccion} />
            <BotonPdf itinerario={itinerario} />
            <dl className="resumen">
              <div>
                <dt>Días</dt>
                <dd>{totales.dias}</dd>
              </div>
              <div>
                <dt>Traslado total</dt>
                <dd>{duracion(totales.minutos_traslado)}</dd>
                <dd className="resumen-sub">{distancia(totales.km)}</dd>
              </div>
              <div>
                <dt>Visita total</dt>
                <dd>{duracion(totales.minutos_visita)}</dd>
              </div>
            </dl>
            <div className="notice">
              <Info className="notice-ico" size={18} strokeWidth={1.8} aria-hidden="true" />
              <p>
                {aproximada
                  ? 'No pudimos consultar las carreteras: las distancias y tiempos se estimaron en línea recta. '
                  : ''}
                Ruta y tiempos aproximados. Confirma tu recorrido antes de salir.
              </p>
            </div>
          </div>

          <div className="itin">
            <h2 className="h2">Itinerario</h2>
            {dias.map((dia, i) => (
              <DiaCard
                key={dia.dia}
                dia={dia}
                desde={i === 0 ? salida.nombre : dias[i - 1]!.paradas.at(-1)!.nombre}
                minutosPorDia={itinerario.minutos_por_dia}
                seleccion={seleccion}
                onVerEnMapa={verEnMapa}
              />
            ))}
            <p className="source">
              Orden y días calculados para jornadas de {duracion(itinerario.minutos_por_dia)},
              durmiendo cerca del último lugar de cada día. Tiempos de visita estimados por nuestro
              modelo. Alojamientos: Directorio Estadístico Nacional de Unidades Económicas (DENUE),
              INEGI, mayo de 2026. Sin precios ni disponibilidad.
            </p>
            <Button variant="secondary" className="w-full" onClick={onEditar}>
              Volver y editar lugares
            </Button>
          </div>
        </div>
      </div>
    </Screen>
  )
}
