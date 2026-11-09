import { divIcon, type LatLngBoundsExpression, type LatLngExpression, latLngBounds } from 'leaflet'
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { colorDia } from './colores'
import { FichaParada } from './ficha-parada'
import { type Itinerario } from './use-itinerario'

const ATRIBUCION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · rutas: <a href="https://openrouteservice.org/">openrouteservice</a>'

// Michoacán va de 17.9° a 20.4° N y de 103.7° a 100.1° O. El margen, unos 30 km, evita que los
// recintos cerca del borde (Paricutín, Tlalpujahua) queden pegados a la orilla del mapa.
const LIMITES_MICHOACAN: LatLngBoundsExpression = [
  [17.6, -104.1], // suroeste
  [20.7, -99.7], // noreste
]
// En el zoom 7 cabe el estado completo aun en un celular; alejarse más no aporta nada.
const ZOOM_MINIMO = 7
const ZOOM_MAXIMO = 18

// Marcadores con HTML y CSS propios: los íconos de imagen de Leaflet no cargan bien con Vite.
const pin = (texto: string, salida = false) =>
  divIcon({
    className: '',
    html: `<span class="ruta-pin${salida ? ' ruta-pin-salida' : ''}">${texto}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })

// Ficha de ancho fijo y separada del borde del mapa al acomodarse.
const ANCHO_FICHA = 240
const MARGEN_POPUP: [number, number] = [12, 12]

/** GeoJSON trae [longitud, latitud]; Leaflet espera [latitud, longitud]. */
const aLeaflet = ([longitud, latitud]: [number, number]): LatLngExpression => [latitud, longitud]

interface RutaMapaProps {
  itinerario: Itinerario
}

/** Mapa de OpenStreetMap con el trazo de cada día en su color y las paradas numeradas con su ficha. */
export function RutaMapa({ itinerario }: RutaMapaProps) {
  const { salida, dias, aproximada } = itinerario
  const puntos = [
    [salida.latitud, salida.longitud] as [number, number],
    ...dias.flatMap((d) => d.trazo.coordinates.map(([lon, lat]) => [lat, lon] as [number, number])),
  ]

  return (
    <div className="mapa" role="region" aria-label="Mapa de la ruta">
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
      >
        <TileLayer
          attribution={ATRIBUCION}
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          // Tampoco se piden teselas de fuera del estado: menos peticiones a los servidores de OSM.
          bounds={LIMITES_MICHOACAN}
          minZoom={ZOOM_MINIMO}
          maxZoom={ZOOM_MAXIMO}
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
          icon={pin('', true)}
          title={`Salida: ${salida.nombre}`}
        >
          <Popup offset={[0, -10]} autoPanPadding={MARGEN_POPUP}>
            <p className="ficha-salida">Salida desde {salida.nombre}</p>
          </Popup>
        </Marker>
        {dias.flatMap((dia) =>
          dia.paradas.map((parada) => (
            <Marker
              key={parada.id}
              position={[parada.latitud, parada.longitud]}
              icon={pin(String(parada.orden))}
              // Los marcadores también se abren con el teclado: Tab y luego Enter.
              title={`Parada ${parada.orden}: ${parada.nombre}`}
            >
              {/* Se abre al tocar el número y se cierra con la ✕ o tocando el mapa. */}
              <Popup
                offset={[0, -10]}
                minWidth={ANCHO_FICHA}
                maxWidth={ANCHO_FICHA}
                autoPanPadding={MARGEN_POPUP}
              >
                <FichaParada parada={parada} dia={dia.dia} />
              </Popup>
            </Marker>
          ))
        )}
      </MapContainer>
    </div>
  )
}
