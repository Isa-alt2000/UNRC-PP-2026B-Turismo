/** Un color por día, el mismo en el mapa y en el itinerario. Con 4 lugares hay como máximo 4 días. */
// Naranja quemado, azul Pátzcuaro, verde oyamel y negro laca: se distinguen entre sí y del mapa, y
// todos llevan texto blanco encima con 4.5:1 o más (la franja de cada día en el itinerario).
const COLORES_DIA = ['#b9560f', '#2e6a88', '#2f5a3c', '#1f1a17']

export const colorDia = (dia: number) => COLORES_DIA[(dia - 1) % COLORES_DIA.length]!
