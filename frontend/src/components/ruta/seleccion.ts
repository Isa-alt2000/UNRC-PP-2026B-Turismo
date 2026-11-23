import { type HotelCercano, type Parada } from './use-itinerario'

/**
 * Lo que está abierto en el panel del mapa: una parada, un alojamiento o el punto de salida.
 * Lo comparten el mapa y el itinerario: tocar un lugar en cualquiera de los dos lo abre.
 */
export type Seleccion =
  | { tipo: 'parada'; parada: Parada; dia: number }
  | { tipo: 'hotel'; hotel: HotelCercano; dia: number }
  | { tipo: 'salida' }

/** ¿Es este el elemento abierto? Sirve para marcarlo en el mapa y en la lista. */
export const esParada = (s: Seleccion | null, id: string) =>
  s?.tipo === 'parada' && s.parada.id === id
export const esHotel = (s: Seleccion | null, id: number) => s?.tipo === 'hotel' && s.hotel.id === id
