/** Un color por día, el mismo en el mapa y en el itinerario. Con 4 lugares hay como máximo 4 días. */
const COLORES_DIA = ['#9f2241', '#232f3f', '#1f7fb0', '#a67935']

export const colorDia = (dia: number) => COLORES_DIA[(dia - 1) % COLORES_DIA.length]!
