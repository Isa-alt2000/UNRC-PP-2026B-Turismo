// Trazo SVG de cada gusto, por su código en la API. Son parte del diseño, por eso viven en el frontend.
const ICONOS: Record<string, string> = {
  historia: 'M3 20h18M5 20v-4h14v4M7 16v-4h10v4M9 12V8h6v4M11 8V5h2v3',
  artes_artesanias:
    'M9 3h6M10 3v3.2C7 7.3 5 10 5 13c0 4.4 3.1 8 7 8s7-3.6 7-8c0-3-2-5.7-5-6.8V3M5.5 12h13',
  arquitectura: 'M3 21h18M5 21V10a7 7 0 0 1 14 0v11M9 21v-8a3 3 0 0 1 6 0v8',
  gastronomia:
    'M3 12h18a9 7 0 0 1-18 0zM9 21h6M9.5 8.5c0-1.6 1.2-1.6 1.2-3.2M13.3 8.5c0-1.6 1.2-1.6 1.2-3.2',
  naturaleza: 'M12 3 6 11h4l-5 7h14l-5-7h4zM12 18v3',
  aventura: 'M2 20 9 9l4 6 3-4 6 9zM9 9V3.5l4.5 1.6L9 6.8',
}

// Un gusto nuevo en el backend se muestra con un círculo hasta que tenga su ícono.
const ICONO_GENERICO = 'M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16'

export const iconoDe = (codigo: string) => ICONOS[codigo] ?? ICONO_GENERICO
