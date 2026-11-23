/** Un color por día, el mismo en el mapa y en el itinerario. Con 4 lugares hay como máximo 4 días. */
// Naranja monarca, azul Pátzcuaro, verde oyamel y negro laca: se distinguen entre sí y del mapa.
const COLORES_DIA = ['#e5711b', '#2e6a88', '#2f5a3c', '#1f1a17']

export const colorDia = (dia: number) => COLORES_DIA[(dia - 1) % COLORES_DIA.length]!
