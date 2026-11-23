import { useState } from 'react'
import { BedDouble, Globe, Phone } from 'lucide-react'
import { distancia } from '@/lib/formato'
import { dominio, TEXTO_TAMANO, telefonoLegible } from './texto-hotel'
import { type Dia, type HotelCercano } from './use-itinerario'

/** Hoteles a la vista en cada día; el resto se despliega. */
const VISIBLES = 3

export function InsigniaLocal() {
  return <span className="insignia-local">Negocio local</span>
}

/** Teléfono y sitio web como enlaces, o el aviso de que el directorio no los trae. */
export function ContactoHotel({ hotel }: { hotel: HotelCercano }) {
  if (!hotel.telefono && !hotel.sitio_web) {
    return <p className="hotel-sin-contacto">Sin teléfono ni sitio web en el directorio</p>
  }
  return (
    <div className="hotel-links">
      {hotel.telefono && (
        <a className="hotel-link" href={`tel:+52${hotel.telefono}`}>
          <Phone size={15} strokeWidth={1.8} aria-hidden="true" />
          <span>{telefonoLegible(hotel.telefono)}</span>
        </a>
      )}
      {hotel.sitio_web && (
        <a className="hotel-link" href={hotel.sitio_web} target="_blank" rel="noopener noreferrer">
          <Globe size={15} strokeWidth={1.8} aria-hidden="true" />
          <span>{dominio(hotel.sitio_web)}</span>
          <span className="sr-only"> (abre en otra pestaña)</span>
        </a>
      )}
    </div>
  )
}

function HotelItem({ hotel }: { hotel: HotelCercano }) {
  return (
    <li className="hotel">
      <div className="hotel-top">
        <div className="min-w-0">
          <p className="hotel-nombre">{hotel.nombre}</p>
          <p className="hotel-meta">
            {hotel.tipo} · {TEXTO_TAMANO[hotel.tamano]}
          </p>
        </div>
        <span className="hotel-dist">a {distancia(hotel.distancia_km)}</span>
      </div>
      {hotel.es_local && <InsigniaLocal />}
      {hotel.direccion && <p className="hotel-direccion">{hotel.direccion}</p>}
      <ContactoHotel hotel={hotel} />
    </li>
  )
}

interface HotelesDiaProps {
  dia: Dia
  /** Nombre de la última parada, donde se duerme. */
  cerca: string
}

/** Dónde dormir al final de un día: los primeros 3 a la vista y el resto desplegable. */
export function HotelesDia({ dia, cerca }: HotelesDiaProps) {
  const [abierto, setAbierto] = useState(false)
  const { hoteles, radio_hoteles_km: radio } = dia
  const visibles = abierto ? hoteles : hoteles.slice(0, VISIBLES)
  const listaId = `hoteles-dia-${dia.dia}`

  return (
    <div className="hoteles">
      <h4 className="hoteles-title">
        <BedDouble size={18} strokeWidth={1.7} aria-hidden="true" />
        Dónde dormir cerca de {cerca}
      </h4>

      {hoteles.length === 0 ? (
        <div className="empty">
          <p className="font-semibold">Sin alojamientos registrados a menos de {radio} km</p>
          <p className="help">
            Considera dormir en una ciudad más grande del camino o cambiar los lugares para que el
            día termine en otro punto.
          </p>
        </div>
      ) : (
        <>
          {radio > 10 && (
            <p className="help">
              No encontramos alojamientos a menos de 10 km. Estos están a menos de {radio} km.
            </p>
          )}
          <ul id={listaId} className="hotel-list">
            {visibles.map((hotel) => (
              <HotelItem key={hotel.id} hotel={hotel} />
            ))}
          </ul>
          {hoteles.length > VISIBLES && (
            <button
              type="button"
              className="btn btn-secondary btn-sm w-full"
              aria-expanded={abierto}
              aria-controls={listaId}
              onClick={() => setAbierto(!abierto)}
            >
              {abierto ? 'Ver menos' : `Ver los ${hoteles.length} alojamientos`}
            </button>
          )}
        </>
      )}
    </div>
  )
}

/** Ficha de un alojamiento en el mapa, con el mismo estilo que la de las paradas. */
export function FichaHotel({ hotel, dia }: { hotel: HotelCercano; dia: number }) {
  return (
    <article className="ficha ficha-hotel">
      <div className="ficha-cuerpo">
        <p className="ficha-eyebrow">Alojamiento · Día {dia}</p>
        <h3 className="ficha-nombre">{hotel.nombre}</h3>
        <p className="hotel-meta">
          {hotel.tipo} · {TEXTO_TAMANO[hotel.tamano]} · a {distancia(hotel.distancia_km)} de la
          parada
        </p>
        {hotel.es_local && <InsigniaLocal />}
        <ContactoHotel hotel={hotel} />
      </div>
    </article>
  )
}
