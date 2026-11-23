import { useCallback, useEffect, useRef, useState } from 'react'
import {
  divIcon,
  type LatLngExpression,
  type LatLngTuple,
  latLngBounds,
  type Map as MapaLeaflet,
} from 'leaflet'
import { MapContainer, Marker, Polygon, Polyline, TileLayer, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { colorDia } from './colores'
import { FichaParada } from './ficha-parada'
import { FichaHotel } from './hoteles'
import { CONTORNO_MICHOACAN, LIMITES_MICHOACAN } from './michoacan'
import { PanelFicha } from './panel-ficha'
import { esHotel, esParada, type Seleccion } from './seleccion'
import { type Itinerario, puntosDeRuta } from './use-itinerario'

const ATRIBUCION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · rutas: <a href="https://openrouteservice.org/">openrouteservice</a>'

// En el zoom 7 cabe el estado completo aun en un celular; alejarse más no aporta nada.
const ZOOM_MINIMO = 7
const ZOOM_MAXIMO = 18

// Marcadores con HTML y CSS propios: los íconos de imagen de Leaflet no cargan bien con Vite.
// El marcador elegido lleva un aro (ruta-pin-activo): así se ve a qué punto corresponde el panel.
const activo = (elegido: boolean) => (elegido ? ' ruta-pin-activo' : '')

const pin = (texto: string, salida = false, elegido = false) =>
  divIcon({
    className: '',
    html: `<span class="ruta-pin${salida ? ' ruta-pin-salida' : ''}${activo(elegido)}">${texto}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })

// Cama de lucide (BedDouble) en SVG: el HTML de un divIcon es texto, no un componente de React.
const CAMA =
  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/>' +
  '<path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/></svg>'

/** Alojamiento: cuadrado redondeado y más chico que las paradas, en el color de su día. */
const pinHotel = (dia: number, elegido = false) =>
  divIcon({
    className: '',
    html: `<span class="ruta-pin-hotel${activo(elegido)}" style="background:${colorDia(dia)}">${CAMA}</span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })

// Separación entre el punto elegido y el borde del mapa o del panel al acomodarlo.
const HOLGURA = 24

/** Tocar el mapa (no un marcador) cierra el panel, como en cualquier app de mapas. */
function CerrarAlTocarElMapa({ onCerrar }: { onCerrar: () => void }) {
  useMapEvents({ click: onCerrar })
  return null
}

/** GeoJSON trae [longitud, latitud]; Leaflet espera [latitud, longitud]. */
const aLeaflet = ([longitud, latitud]: [number, number]): LatLngExpression => [latitud, longitud]

// Sombra fuera del estado: un rectángulo del tamaño del mundo con Michoacán como hueco. Se arma
// una sola vez al cargar el módulo; Leaflet recorta y simplifica el trazo según el zoom.
const MUNDO: LatLngExpression[] = [
  [-85, -180],
  [-85, 180],
  [85, 180],
  [85, -180],
]
const MASCARA_MICHOACAN: LatLngExpression[][] = [MUNDO, CONTORNO_MICHOACAN]

interface RutaMapaProps {
  itinerario: Itinerario
  /** Lo abierto en el panel; lo comparte con el itinerario. */
  seleccion: Seleccion | null
  onSeleccion: (seleccion: Seleccion | null) => void
}

/** Mapa de OpenStreetMap con el trazo de cada día en su color y las paradas numeradas con su ficha. */
export function RutaMapa({ itinerario, seleccion, onSeleccion }: RutaMapaProps) {
  const { salida, dias, aproximada } = itinerario
  const [conHoteles, setConHoteles] = useState(true)
  const [mapa, setMapa] = useState<MapaLeaflet | null>(null)
  const panel = useRef<HTMLElement>(null)
  const hayHoteles = dias.some((dia) => dia.hoteles.length > 0)
  // Abrir un alojamiento desde el itinerario lo muestra aunque el interruptor esté apagado.
  const verHoteles = conHoteles || seleccion?.tipo === 'hotel'
  const puntos = puntosDeRuta(itinerario)
  const cerrar = useCallback(() => onSeleccion(null), [onSeleccion])

  const posicion: LatLngTuple | null = !seleccion
    ? null
    : seleccion.tipo === 'parada'
      ? [seleccion.parada.latitud, seleccion.parada.longitud]
      : seleccion.tipo === 'hotel'
        ? [seleccion.hotel.latitud, seleccion.hotel.longitud]
        : [salida.latitud, salida.longitud]

  // Si el punto elegido quedó debajo del panel o fuera de vista, el mapa se mueve lo justo para
  // mostrarlo, sin cambiar el zoom. El panel va abajo a todo el ancho (celular) o a la izquierda.
  useEffect(() => {
    if (!mapa || !posicion || !panel.current) return
    const p = panel.current.getBoundingClientRect()
    const c = mapa.getContainer().getBoundingClientRect()
    const abajo = p.width > c.width * 0.7
    mapa.panInside(posicion, {
      paddingTopLeft: abajo ? [HOLGURA, HOLGURA] : [p.right - c.left + HOLGURA, HOLGURA],
      paddingBottomRight: abajo ? [HOLGURA, c.bottom - p.top + HOLGURA] : [HOLGURA, HOLGURA],
    })
    // Al abrir, el foco va al panel para que el lector de pantalla lo anuncie.
    panel.current.focus({ preventScroll: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- posicion se deriva de seleccion
  }, [mapa, seleccion])

  // Al ocultar los alojamientos, un alojamiento abierto se cierra con ellos.
  const mostrarHoteles = (mostrar: boolean) => {
    setConHoteles(mostrar)
    if (!mostrar && seleccion?.tipo === 'hotel') onSeleccion(null)
  }

  return (
    <div className="mapa" role="region" aria-label="Mapa de la ruta">
      {hayHoteles && (
        <button
          type="button"
          className="mapa-toggle"
          role="switch"
          aria-checked={verHoteles}
          onClick={() => mostrarHoteles(!verHoteles)}
        >
          <span className="mapa-toggle-track" aria-hidden="true">
            <span className="mapa-toggle-thumb" />
          </span>
          Alojamientos
        </button>
      )}
      <MapContainer
        bounds={latLngBounds(puntos)}
        boundsOptions={{ padding: [32, 32] }}
        // Sin zoom con la rueda: así la página se puede desplazar con el mapa debajo del cursor.
        scrollWheelZoom={false}
        // No se puede arrastrar fuera de Michoacán (1 = tope firme) ni alejarse más que el estado.
        maxBounds={LIMITES_MICHOACAN}
        maxBoundsViscosity={1}
        minZoom={ZOOM_MINIMO}
        maxZoom={ZOOM_MAXIMO}
        className="mapa-leaflet"
        ref={setMapa}
      >
        <CerrarAlTocarElMapa onCerrar={cerrar} />
        <TileLayer
          attribution={ATRIBUCION}
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          // Con CORS, como las pide el PDF: así reutiliza las teselas que el navegador ya guardó.
          crossOrigin=""
          // Tampoco se piden teselas de fuera del estado: menos peticiones a los servidores de OSM.
          bounds={LIMITES_MICHOACAN}
          minZoom={ZOOM_MINIMO}
          maxZoom={ZOOM_MAXIMO}
        />
        {/* Antes que los trazos para quedar debajo; no interactiva, así no roba clics al mapa. */}
        <Polygon
          positions={MASCARA_MICHOACAN}
          interactive={false}
          pathOptions={{
            color: '#a0531a', // naranja oscuro: el contorno del estado
            weight: 2,
            opacity: 0.7,
            fillColor: '#1f1a17', // negro laca: la sombra de fuera
            fillOpacity: 0.28,
            fillRule: 'evenodd',
          }}
        />
        {dias.map((dia) => (
          <Polyline
            key={dia.dia}
            positions={dia.trazo.coordinates.map(aLeaflet)}
            pathOptions={{
              color: colorDia(dia.dia),
              weight: 5,
              opacity: 0.85,
              // Punteada cuando es línea recta, para no aparentar un camino real.
              dashArray: aproximada ? '8 8' : undefined,
            }}
          />
        ))}
        <Marker
          position={[salida.latitud, salida.longitud]}
          icon={pin('', true, seleccion?.tipo === 'salida')}
          title={`Salida: ${salida.nombre}`}
          eventHandlers={{ click: () => onSeleccion({ tipo: 'salida' }) }}
        />
        {/* Antes que las paradas, para que los números queden encima si se enciman. */}
        {verHoteles &&
          dias.flatMap((dia) =>
            dia.hoteles.map((hotel) => (
              <Marker
                key={`${dia.dia}-${hotel.id}`}
                position={[hotel.latitud, hotel.longitud]}
                icon={pinHotel(dia.dia, esHotel(seleccion, hotel.id))}
                title={`Alojamiento: ${hotel.nombre}`}
                eventHandlers={{
                  click: () => onSeleccion({ tipo: 'hotel', hotel, dia: dia.dia }),
                }}
              />
            ))
          )}
        {dias.flatMap((dia) =>
          dia.paradas.map((parada) => (
            <Marker
              key={parada.id}
              position={[parada.latitud, parada.longitud]}
              icon={pin(String(parada.orden), false, esParada(seleccion, parada.id))}
              // Los marcadores también se abren con el teclado: Tab y luego Enter.
              title={`Parada ${parada.orden}: ${parada.nombre}`}
              // Leaflet apila los marcadores por su altura en el mapa: un alojamiento más al sur
              // taparía el número. Con este desfase las paradas siempre quedan al frente.
              zIndexOffset={1000}
              eventHandlers={{
                click: () => onSeleccion({ tipo: 'parada', parada, dia: dia.dia }),
              }}
            />
          ))
        )}
      </MapContainer>
      {/* Fuera del mapa de Leaflet: así no lo recorta ni se mueve con él. */}
      {seleccion && (
        <PanelFicha titulo={tituloDe(seleccion, salida.nombre)} onCerrar={cerrar} ref={panel}>
          {seleccion.tipo === 'parada' && (
            <FichaParada parada={seleccion.parada} dia={seleccion.dia} />
          )}
          {seleccion.tipo === 'hotel' && <FichaHotel hotel={seleccion.hotel} dia={seleccion.dia} />}
          {seleccion.tipo === 'salida' && (
            <p className="ficha-salida">Salida desde {salida.nombre}</p>
          )}
        </PanelFicha>
      )}
    </div>
  )
}

function tituloDe(seleccion: Seleccion, salida: string) {
  if (seleccion.tipo === 'parada') {
    return `Parada ${seleccion.parada.orden}: ${seleccion.parada.nombre}`
  }
  if (seleccion.tipo === 'hotel') return `Alojamiento: ${seleccion.hotel.nombre}`
  return `Salida desde ${salida}`
}
