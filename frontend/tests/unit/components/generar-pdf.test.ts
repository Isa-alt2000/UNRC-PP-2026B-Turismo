import { jsPDF } from 'jspdf'
import { type HotelCercano, type Itinerario } from '@/components/ruta'
import { armarPdf, nombreArchivo } from '@/components/ruta/pdf/generar-pdf'
import { aPixel, zoomQueCabe } from '@/components/ruta/pdf/mapa-estatico'

const hotel = (id: number, extra: Partial<HotelCercano> = {}): HotelCercano => ({
  id,
  nombre: `Hotel ${id}`,
  tipo: 'Hotel',
  tamano: 'micro',
  es_local: true,
  distancia_km: 0.4,
  telefono: null,
  sitio_web: null,
  direccion: null,
  latitud: 19.5,
  longitud: -101.6,
  ...extra,
})

const parada = (orden: number, nombre: string) => ({
  orden,
  id: `R000${orden}`,
  nombre,
  descripcion: null,
  imagen: 'sin_imagen' as const,
  latitud: 19.5,
  longitud: -101.6,
  km_desde_anterior: 40.2,
  minutos_traslado: 45,
  minutos_visita: 90,
})

const itinerario = (hotelesPorDia: number): Itinerario => ({
  aproximada: false,
  salida: { id: 'morelia', nombre: 'Morelia', latitud: 19.7, longitud: -101.2 },
  minutos_por_dia: 480,
  dias: [1, 2, 3].map((n) => ({
    dia: n,
    paradas: [parada(n * 2 - 1, `Lugar ${n}A`), parada(n * 2, `Lugar ${n}B`)],
    trazo: { type: 'LineString' as const, coordinates: [] },
    totales: { km: 80, minutos_traslado: 90, minutos_visita: 180, minutos_jornada: 270 },
    excede_jornada: n === 3,
    hoteles: Array.from({ length: hotelesPorDia }, (_, i) =>
      hotel(n * 10 + i, i === 0 ? { telefono: '4343421234', sitio_web: 'https://www.h.mx' } : {})
    ),
    radio_hoteles_km: 10,
  })),
  totales: { km: 240, minutos_traslado: 270, minutos_visita: 540, dias: 3 },
})

/** El texto de un PDF sin comprimir, para buscar lo que se escribió en él. */
const texto = (doc: jsPDF) => doc.output()

const armar = (it: Itinerario) =>
  armarPdf(new jsPDF({ unit: 'mm', format: 'a4', compress: false }), it, {
    mapa: null,
    logo: null,
    fecha: new Date(2026, 10, 22),
  })

describe('armarPdf', () => {
  it('incluye cada día, sus paradas y todos sus alojamientos', () => {
    const salida = texto(armar(itinerario(5)))
    for (const n of [1, 2, 3]) {
      expect(salida).toContain(`Lugar ${n}A`)
      expect(salida).toContain(`Lugar ${n}B`)
      // Los 5, no solo los 3 que la página muestra sin desplegar.
      for (let i = 0; i < 5; i++) expect(salida).toContain(`Hotel ${n * 10 + i}`)
    }
    expect(salida).toContain('Logo') // el recuadro mientras no haya logo
    expect(salida).toContain('434 342 1234')
    expect(salida).toContain('/URI (tel:+524343421234)')
  })

  it('pasa a otra hoja cuando el itinerario no cabe y numera las páginas', () => {
    const doc = armar(itinerario(5))
    const total = doc.getNumberOfPages()
    expect(total).toBeGreaterThan(1)
    expect(texto(doc)).toContain(`Página ${total} de ${total}`)
  })
})

describe('nombreArchivo', () => {
  it('lleva la fecha con ceros', () => {
    expect(nombreArchivo(new Date(2026, 0, 5))).toBe('ruta-michoacan-2026-01-05.pdf')
  })
})

describe('mapa estático', () => {
  it('proyecta en Web Mercator como las teselas de OSM', () => {
    // Morelia en el zoom 7 cae en la tesela x = 28, y = 56.
    const { x, y } = aPixel([19.7, -101.2], 7)
    expect(Math.floor(x / 256)).toBe(28)
    expect(Math.floor(y / 256)).toBe(56)
  })

  it('elige un zoom en que todos los puntos caben', () => {
    const puntos: [number, number][] = [
      [19.7, -101.2],
      [19.4, -102.0],
    ]
    const z = zoomQueCabe(puntos, 1600, 1000, 80)
    const a = aPixel(puntos[0]!, z)
    const b = aPixel(puntos[1]!, z)
    expect(Math.abs(a.x - b.x)).toBeLessThanOrEqual(1600 - 160 + 1e-6)
    expect(Math.abs(a.y - b.y)).toBeLessThanOrEqual(1000 - 160 + 1e-6)
  })

  it('no acerca a nivel de calle cuando hay un solo punto', () => {
    expect(zoomQueCabe([[19.7, -101.2]], 1600, 1000, 80)).toBe(14)
  })
})
