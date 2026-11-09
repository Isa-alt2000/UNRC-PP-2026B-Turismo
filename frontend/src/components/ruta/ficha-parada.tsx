import { useState } from 'react'
import { Car, Clock, ImageIcon } from 'lucide-react'
import { distancia, duracion } from '@/lib/formato'
import { colorDia } from './colores'
import { type Parada } from './use-itinerario'

interface FichaParadaProps {
  parada: Parada
  dia: number
}

/** Ficha breve de una parada, la que se abre al tocar su número en el mapa. */
export function FichaParada({ parada, dia }: FichaParadaProps) {
  // Si la imagen no carga (enlace roto, sin conexión), se muestra el recuadro en su lugar.
  const [fallo, setFallo] = useState(false)
  const imagen = parada.imagen !== 'sin_imagen' && !fallo ? parada.imagen : null

  return (
    <article className="ficha">
      {imagen ? (
        <img
          className="ficha-img"
          src={imagen.url}
          alt={`Foto de ${parada.nombre}`}
          loading="lazy"
          onError={() => setFallo(true)}
        />
      ) : (
        <div className="ficha-img ficha-img-vacia" aria-hidden="true">
          <ImageIcon size={28} strokeWidth={1.5} />
        </div>
      )}
      {/* Franja a todo el ancho, en dos columnas; el día lleva el color de su trazo en el mapa. */}
      <div className="ficha-banda">
        <span>
          <span
            className="ficha-banda-color"
            style={{ background: colorDia(dia) }}
            aria-hidden="true"
          />
          Día {dia}
        </span>
        <span>Parada {parada.orden}</span>
      </div>
      <div className="ficha-cuerpo">
        <h3 className="ficha-nombre">{parada.nombre}</h3>
        {parada.descripcion && <p className="ficha-desc">{parada.descripcion}</p>}
        <ul className="ficha-datos">
          <li>
            <Clock size={14} strokeWidth={1.8} aria-hidden="true" />
            Visita: {duracion(parada.minutos_visita)}
          </li>
          <li>
            <Car size={14} strokeWidth={1.8} aria-hidden="true" />
            Llegas en {duracion(parada.minutos_traslado)} · {distancia(parada.km_desde_anterior)}
          </li>
        </ul>
        {imagen?.credito && <p className="ficha-credito">{imagen.credito}</p>}
      </div>
    </article>
  )
}
