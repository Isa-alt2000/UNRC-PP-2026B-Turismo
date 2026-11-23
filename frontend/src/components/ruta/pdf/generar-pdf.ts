import type { jsPDF } from 'jspdf'
import { distancia, duracion } from '@/lib/formato'
import { colorDia } from '../colores'
import { dominio, TEXTO_TAMANO, telefonoLegible } from '../texto-hotel'
import { type Dia, type HotelCercano, type Itinerario } from '../use-itinerario'
import { LOGO } from './logo'
import { mapaEstatico } from './mapa-estatico'

// Hoja A4 vertical, en milímetros.
const HOJA = { ancho: 210, alto: 297 }
const MARGEN = 14
const ANCHO_UTIL = HOJA.ancho - 2 * MARGEN
// Debajo de esto se pasa a otra hoja; deja sitio al pie de página.
const FONDO = HOJA.alto - 18
// El logo es casi cuadrado (380 × 400): un recuadro de 24 × 25 mm junto al título.
const LOGO_CAJA = { ancho: 24, alto: 25 }
// Píxeles del mapa: 16:9, unos 220 ppp a lo ancho de la hoja.
const MAPA_PX = { ancho: 1600, alto: 900 }

const COLOR = {
  tinta: '#1f1a17',
  naranja: '#e5711b',
  naranjaOscuro: '#a0531a', // texto naranja: títulos y enlaces
  naranja50: '#fdf1e8',
  cempasuchil: '#f5a623',
  texto2: '#5e5a58',
  borde: '#e1dfde',
  ala: '#faf4e8',
  cantera50: '#f3e4dc',
  oyamel: '#2f5a3c',
}

export const FUENTES =
  'Orden y días calculados para jornadas de {jornada}, durmiendo cerca del último lugar de cada ' +
  'día. Tiempos de visita estimados por nuestro modelo. Alojamientos: Directorio Estadístico ' +
  'Nacional de Unidades Económicas (DENUE), INEGI, mayo de 2026. Sin precios ni disponibilidad. ' +
  'Mapa: © OpenStreetMap; rutas: openrouteservice.'

/** 2026-11-22 → ruta-michoacan-2026-11-22.pdf */
export const nombreArchivo = (fecha: Date) =>
  `ruta-michoacan-${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}.pdf`

/** Escribe hacia abajo de la hoja y pasa a la siguiente cuando ya no cabe. */
class Hoja {
  y = MARGEN
  readonly doc: jsPDF

  constructor(doc: jsPDF) {
    this.doc = doc
  }

  /** Alto en mm de una línea de texto con el tamaño de letra actual. */
  get interlinea() {
    return this.doc.getFontSize() * 0.3528 * 1.25
  }

  asegurar(alto: number) {
    if (this.y + alto > FONDO) {
      this.doc.addPage()
      this.y = MARGEN + 2
    }
  }

  fuente(tamano: number, estilo: 'normal' | 'bold' = 'normal', color = COLOR.tinta) {
    this.doc.setFont('helvetica', estilo)
    this.doc.setFontSize(tamano)
    this.doc.setTextColor(color)
  }

  /** Párrafo partido al ancho dado; devuelve el alto que ocupó. */
  parrafo(texto: string, x = MARGEN, ancho = ANCHO_UTIL) {
    const lineas: string[] = this.doc.splitTextToSize(texto, ancho)
    this.asegurar(lineas.length * this.interlinea)
    this.doc.text(lineas, x, this.y, { baseline: 'top', lineHeightFactor: 1.25 })
    this.y += lineas.length * this.interlinea
  }
}

/** Logo ya convertido a PNG, con sus proporciones. */
export interface LogoPdf {
  png: string
  ancho: number
  alto: number
}

function cabecera(h: Hoja, itinerario: Itinerario, logo: LogoPdf | null, fecha: Date) {
  const { doc } = h
  const caja = { x: MARGEN, y: MARGEN, ...LOGO_CAJA }
  if (logo) {
    // Cabe en el recuadro sin deformarse, alineado a la izquierda.
    const escala = Math.min(caja.ancho / logo.ancho, caja.alto / logo.alto)
    const ancho = logo.ancho * escala
    const alto = logo.alto * escala
    doc.addImage(logo.png, 'PNG', caja.x, caja.y + (caja.alto - alto) / 2, ancho, alto)
  } else {
    doc.setDrawColor(COLOR.cempasuchil)
    doc.setLineWidth(0.3)
    doc.setLineDashPattern([1.5, 1.2], 0)
    doc.roundedRect(caja.x, caja.y, caja.ancho, caja.alto, 2, 2, 'S')
    doc.setLineDashPattern([], 0)
    h.fuente(8, 'normal', COLOR.texto2)
    doc.text('Logo', caja.x + caja.ancho / 2, caja.y + caja.alto / 2, {
      align: 'center',
      baseline: 'middle',
    })
  }

  const x = caja.x + caja.ancho + 6
  // El bloque de texto (unos 12 mm) va centrado a la altura del logo.
  const y = caja.y + caja.alto / 2 - 6
  h.fuente(18, 'bold', COLOR.naranjaOscuro)
  doc.text('Tu ruta por Michoacán', x, y, { baseline: 'middle' })
  const dias = itinerario.totales.dias === 1 ? '1 día' : `${itinerario.totales.dias} días`
  h.fuente(10)
  doc.text(`Salida desde ${itinerario.salida.nombre} · ${dias}`, x, y + 7, {
    baseline: 'middle',
  })
  h.fuente(8.5, 'normal', COLOR.texto2)
  const hoy = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(fecha)
  doc.text(`Generada el ${hoy}`, x, y + 12, { baseline: 'middle' })

  h.y = caja.y + caja.alto + 4
  doc.setDrawColor(COLOR.naranjaOscuro)
  doc.setLineWidth(0.6)
  doc.line(MARGEN, h.y, HOJA.ancho - MARGEN, h.y)
  h.y += 5
}

function mapa(h: Hoja, imagen: string | null) {
  const { doc } = h
  const alto = ANCHO_UTIL * (MAPA_PX.alto / MAPA_PX.ancho)
  if (imagen) {
    doc.addImage(imagen, 'JPEG', MARGEN, h.y, ANCHO_UTIL, alto)
  } else {
    doc.setFillColor(COLOR.ala)
    doc.rect(MARGEN, h.y, ANCHO_UTIL, alto, 'F')
    h.fuente(10, 'normal', COLOR.texto2)
    doc.text(
      'No pudimos cargar el mapa. El itinerario sigue abajo.',
      HOJA.ancho / 2,
      h.y + alto / 2,
      {
        align: 'center',
        baseline: 'middle',
      }
    )
  }
  doc.setDrawColor(COLOR.borde)
  doc.setLineWidth(0.3)
  doc.rect(MARGEN, h.y, ANCHO_UTIL, alto, 'S')
  h.y += alto + 5
}

function resumen(h: Hoja, itinerario: Itinerario) {
  const { doc } = h
  const { totales } = itinerario
  const celdas = [
    ['Días', String(totales.dias), ''],
    ['Traslado total', duracion(totales.minutos_traslado), distancia(totales.km)],
    ['Visita total', duracion(totales.minutos_visita), ''],
  ]
  const ancho = ANCHO_UTIL / celdas.length
  const alto = 17
  doc.setDrawColor(COLOR.borde)
  doc.setLineWidth(0.3)
  doc.roundedRect(MARGEN, h.y, ANCHO_UTIL, alto, 3, 3, 'S')
  celdas.forEach(([etiqueta, valor, sub], i) => {
    const x = MARGEN + i * ancho + 5
    if (i > 0) doc.line(MARGEN + i * ancho, h.y, MARGEN + i * ancho, h.y + alto)
    h.fuente(8, 'normal', COLOR.texto2)
    doc.text(etiqueta!, x, h.y + 4.5, { baseline: 'middle' })
    h.fuente(13, 'bold')
    doc.text(valor!, x, h.y + 10, { baseline: 'middle' })
    if (sub) {
      h.fuente(8.5, 'normal', COLOR.texto2)
      doc.text(sub, x, h.y + 14.5, { baseline: 'middle' })
    }
  })
  h.y += alto + 4

  h.fuente(8.5, 'normal', COLOR.texto2)
  h.parrafo(
    (itinerario.aproximada
      ? 'No pudimos consultar las carreteras: las distancias y tiempos se estimaron en línea recta. '
      : '') + 'Ruta y tiempos aproximados. Confirma tu recorrido antes de salir.'
  )
  h.y += 4
}

function dia(h: Hoja, d: Dia, desde: string, minutosPorDia: number) {
  const { doc } = h
  const derecha = HOJA.ancho - MARGEN
  const riel = MARGEN + 4.5 // eje de la línea de tiempo
  const x = MARGEN + 10 // texto a la derecha de la línea de tiempo

  // Se mide antes de dibujar: la línea de tiempo va completa en una hoja, sin cortarse.
  h.fuente(10, 'bold')
  const nombres = d.paradas.map((p) => doc.splitTextToSize(p.nombre, derecha - x - 32) as string[])
  const altoNombre = (lineas: string[]) => Math.max(5, lineas.length * h.interlinea) + 1.4
  const ALTO_BANDA = 9
  const altoLinea =
    ALTO_BANDA + 3 + 6 + nombres.reduce((suma, lineas) => suma + 4.6 + altoNombre(lineas), 0)
  h.asegurar(altoLinea)

  // Banda del día: franja con su color a la izquierda, como en el mapa.
  doc.setFillColor(colorDia(d.dia))
  // Solo a la izquierda: a todo lo ancho se asomaría como contorno en las esquinas derechas.
  doc.roundedRect(MARGEN, h.y, 6, ALTO_BANDA, 1.8, 1.8, 'F')
  doc.setFillColor(COLOR.ala)
  doc.roundedRect(MARGEN + 1.4, h.y, ANCHO_UTIL - 1.4, ALTO_BANDA, 1.8, 1.8, 'F')
  doc.rect(MARGEN + 1.4, h.y, 2, ALTO_BANDA, 'F') // borde izquierdo recto junto a la franja
  const medio = h.y + ALTO_BANDA / 2
  h.fuente(11.5, 'bold', COLOR.naranjaOscuro)
  const titulo = `Día ${d.dia}`
  doc.text(titulo, MARGEN + 5, medio, { baseline: 'middle' })
  const paradas = d.paradas.length === 1 ? '1 parada' : `${d.paradas.length} paradas`
  const anchoTitulo = doc.getTextWidth(titulo)
  h.fuente(8.5, 'normal', COLOR.texto2)
  doc.text(`${paradas} · ${distancia(d.totales.km)}`, MARGEN + 5 + anchoTitulo + 4, medio, {
    baseline: 'middle',
  })
  h.fuente(8.5, 'bold')
  const jornada = duracion(d.totales.minutos_jornada)
  doc.text(jornada, derecha - 4, medio, { align: 'right', baseline: 'middle' })
  const anchoJornada = doc.getTextWidth(jornada)
  h.fuente(8.5, 'normal', COLOR.texto2)
  doc.text('Jornada: ', derecha - 4 - anchoJornada - 1, medio, {
    align: 'right',
    baseline: 'middle',
  })
  h.y += ALTO_BANDA + 3

  // Posiciones de cada fila, para trazar primero el riel y encima los círculos.
  const yCentroSalida = h.y + 2.5
  let cursor = h.y + 6
  const filas = d.paradas.map((parada, i) => {
    const yTraslado = cursor
    cursor += 4.6
    const fila = { parada, nombre: nombres[i]!, yTraslado, yNombre: cursor, yCentro: cursor + 2.2 }
    cursor += altoNombre(nombres[i]!)
    return fila
  })

  doc.setDrawColor('#f2b98b')
  doc.setLineWidth(0.5)
  doc.setLineDashPattern([0.9, 0.9], 0)
  doc.line(riel, yCentroSalida, riel, filas.at(-1)!.yCentro)
  doc.setLineDashPattern([], 0)

  // Salida: aro rojo con punto, como en el mapa.
  doc.setFillColor('#ffffff')
  doc.setDrawColor(COLOR.naranja)
  doc.setLineWidth(0.6)
  doc.circle(riel, yCentroSalida, 2.2, 'FD')
  doc.setFillColor(COLOR.naranja)
  doc.circle(riel, yCentroSalida, 0.8, 'F')
  h.fuente(9, 'bold')
  doc.text(`Salida desde ${desde}`, x, yCentroSalida, { baseline: 'middle' })

  for (const { parada, nombre, yTraslado, yNombre, yCentro } of filas) {
    h.fuente(8, 'normal', COLOR.texto2)
    doc.text(
      `Traslado aprox. ${duracion(parada.minutos_traslado)} · ${distancia(parada.km_desde_anterior)}`,
      x,
      yTraslado + 0.6,
      { baseline: 'top' }
    )

    doc.setFillColor(COLOR.naranja)
    doc.circle(riel, yCentro, 2.6, 'F')
    h.fuente(7.5, 'bold', COLOR.tinta)
    doc.text(String(parada.orden), riel, yCentro + 0.1, { align: 'center', baseline: 'middle' })

    h.fuente(10, 'bold')
    doc.text(nombre, x, yNombre, { baseline: 'top', lineHeightFactor: 1.25 })

    // Tiempo de visita en una pastilla a la derecha.
    h.fuente(7.5, 'bold', COLOR.naranjaOscuro)
    const visita = `Visita ${duracion(parada.minutos_visita)}`
    const anchoPastilla = doc.getTextWidth(visita) + 4
    doc.setFillColor(COLOR.naranja50)
    doc.roundedRect(derecha - anchoPastilla, yCentro - 2.2, anchoPastilla, 4.4, 2.2, 2.2, 'F')
    doc.text(visita, derecha - anchoPastilla / 2, yCentro + 0.1, {
      align: 'center',
      baseline: 'middle',
    })
  }
  h.y = cursor

  if (d.excede_jornada) {
    h.y += 1.5
    h.fuente(8.5, 'normal', COLOR.tinta)
    const texto = `Este día pasa de ${duracion(minutosPorDia)}: el lugar queda lejos y su visita es larga. Considera salir temprano.`
    const lineas: string[] = doc.splitTextToSize(texto, ANCHO_UTIL - 6)
    const alto = lineas.length * h.interlinea + 3.5
    h.asegurar(alto)
    doc.setFillColor(COLOR.cantera50)
    doc.setDrawColor('#d8a58c')
    doc.setLineWidth(0.25)
    doc.roundedRect(MARGEN, h.y, ANCHO_UTIL, alto, 1.5, 1.5, 'FD')
    h.y += 1.75
    h.parrafo(texto, MARGEN + 3, ANCHO_UTIL - 6)
    h.y += 1.75
  }

  hoteles(h, d)
  h.y += 6
}

// Alojamientos en dos columnas, cada uno en un recuadro tenue.
const COLUMNAS = 2
const SEPARACION = 4
const ANCHO_TARJETA = (ANCHO_UTIL - SEPARACION * (COLUMNAS - 1)) / COLUMNAS
const RELLENO = 3
// Las direcciones largas se cortan: el recuadro es un vistazo, no una ficha completa.
const MAX_LINEAS_DIRECCION = 2

function hoteles(h: Hoja, d: Dia) {
  const { doc } = h
  const ultima = d.paradas.at(-1)!
  h.y += 2.5
  const primeraFila = Math.max(
    0,
    ...d.hoteles.slice(0, COLUMNAS).map((hotel) => tarjetaHotel(h, hotel, 0, 0, null))
  )
  // El título junto con la primera fila (o el aviso de que no hay): nunca solo al fondo.
  h.asegurar(12 + (primeraFila || 10))
  h.fuente(9.5, 'bold')
  h.parrafo(`Dónde dormir cerca de ${ultima.nombre}`)
  h.y += 1

  if (d.hoteles.length === 0) {
    h.fuente(8.5, 'bold')
    h.parrafo(`Sin alojamientos registrados a menos de ${d.radio_hoteles_km} km`)
    h.fuente(8.5, 'normal', COLOR.texto2)
    h.parrafo(
      'Considera dormir en una ciudad más grande del camino o cambiar los lugares para que el día termine en otro punto.'
    )
    return
  }
  if (d.radio_hoteles_km > 10) {
    h.fuente(8, 'normal', COLOR.texto2)
    h.parrafo(
      `No encontramos alojamientos a menos de 10 km. Estos están a menos de ${d.radio_hoteles_km} km.`
    )
    h.y += 1
  }

  // En papel no hay "ver más": van todos los alojamientos del día, fila por fila.
  for (let i = 0; i < d.hoteles.length; i += COLUMNAS) {
    const fila = d.hoteles.slice(i, i + COLUMNAS)
    // Primero se miden, para que los dos recuadros de la fila tengan el mismo alto.
    const alto = Math.max(...fila.map((hotel) => tarjetaHotel(h, hotel, 0, 0, null)))
    h.asegurar(alto)
    fila.forEach((hotel, j) => {
      const x = MARGEN + j * (ANCHO_TARJETA + SEPARACION)
      doc.setFillColor('#fdfbf7')
      doc.setDrawColor(COLOR.borde)
      doc.setLineWidth(0.25)
      doc.roundedRect(x, h.y, ANCHO_TARJETA, alto, 1.8, 1.8, 'FD')
      tarjetaHotel(h, hotel, x, h.y, alto)
    })
    h.y += alto + SEPARACION / 2
  }
}

/**
 * Contenido de un recuadro de alojamiento. Con alto null solo mide y devuelve el alto que
 * ocuparía; con alto, dibuja en (x, y).
 */
function tarjetaHotel(h: Hoja, hotel: HotelCercano, x: number, y: number, alto: number | null) {
  const { doc } = h
  const dibujar = alto !== null
  const izq = x + RELLENO
  const ancho = ANCHO_TARJETA - 2 * RELLENO
  let cursor = y + RELLENO
  const lineas = (texto: string, anchoMax: number) =>
    doc.splitTextToSize(texto, anchoMax) as string[]
  const escribir = (texto: string | string[], tx: number, opciones = {}) => {
    if (dibujar)
      doc.text(texto, tx, cursor, { baseline: 'top', lineHeightFactor: 1.25, ...opciones })
  }

  // Nombre, con la distancia a la derecha.
  h.fuente(8.5, 'bold')
  const dist = `a ${distancia(hotel.distancia_km)}`
  const anchoDist = doc.getTextWidth(dist)
  escribir(dist, izq + ancho, { align: 'right' })
  h.fuente(9, 'bold')
  const nombre = lineas(hotel.nombre, ancho - anchoDist - 3)
  escribir(nombre, izq)
  cursor += nombre.length * h.interlinea + 0.4

  // Tipo y tamaño; "Negocio local" en verde al final si cabe en la última línea.
  h.fuente(7.5, 'normal', COLOR.texto2)
  const meta = lineas(`${hotel.tipo} · ${TEXTO_TAMANO[hotel.tamano]}`, ancho)
  escribir(meta, izq)
  let altoMeta = meta.length * h.interlinea
  if (hotel.es_local) {
    // jsPDF descarta los espacios en los extremos de un texto: el hueco se suma a la x.
    const local = '· Negocio local'
    const finMeta = doc.getTextWidth(meta.at(-1)!) + 1.2
    h.fuente(7.5, 'bold', COLOR.oyamel)
    const cabe = finMeta + doc.getTextWidth(local) <= ancho
    if (cabe) {
      if (dibujar)
        doc.text(local, izq + finMeta, cursor + altoMeta - h.interlinea, { baseline: 'top' })
    } else {
      if (dibujar) doc.text('Negocio local', izq, cursor + altoMeta, { baseline: 'top' })
      altoMeta += h.interlinea
    }
  }
  cursor += altoMeta

  if (hotel.direccion) {
    h.fuente(7.5, 'normal', COLOR.texto2)
    let direccion = lineas(hotel.direccion, ancho)
    if (direccion.length > MAX_LINEAS_DIRECCION) {
      direccion = direccion.slice(0, MAX_LINEAS_DIRECCION)
      direccion[MAX_LINEAS_DIRECCION - 1] =
        `${direccion[MAX_LINEAS_DIRECCION - 1]!.replace(/\s*\S*$/, '')}…`
    }
    escribir(direccion, izq)
    cursor += direccion.length * h.interlinea
  }

  cursor += 0.8
  cursor += contacto(h, hotel.telefono, hotel.sitio_web, izq, cursor, ancho, dibujar)
  return cursor + RELLENO - y
}

/** Teléfono y sitio como enlaces, en una línea o en dos si no caben; devuelve el alto usado. */
function contacto(
  h: Hoja,
  telefono: string | null,
  sitio: string | null,
  x: number,
  y: number,
  ancho: number,
  dibujar: boolean
) {
  const { doc } = h
  if (!telefono && !sitio) {
    h.fuente(7.5, 'normal', COLOR.texto2)
    doc.setFont('helvetica', 'italic')
    if (dibujar) doc.text('Sin teléfono ni sitio web en el directorio', x, y, { baseline: 'top' })
    return h.interlinea
  }
  h.fuente(8, 'normal', COLOR.naranjaOscuro)
  const tel = telefono ? `Tel. ${telefonoLegible(telefono)}` : null
  const web = sitio ? dominio(sitio) : null
  const anchoTel = tel ? doc.getTextWidth(tel) + 5 : 0
  const enUnaLinea = !web || anchoTel + doc.getTextWidth(web) <= ancho
  if (dibujar && tel) doc.textWithLink(tel, x, y, { url: `tel:+52${telefono}`, baseline: 'top' })
  if (dibujar && web) {
    const [wx, wy] = enUnaLinea ? [x + anchoTel, y] : [x, y + h.interlinea]
    doc.textWithLink(web, wx, wy, { url: sitio!, baseline: 'top' })
  }
  return enUnaLinea ? h.interlinea : 2 * h.interlinea
}

function pies(doc: jsPDF) {
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(COLOR.texto2)
    const y = HOJA.alto - 9
    doc.text('Ruta y tiempos aproximados. Confirma tu recorrido antes de salir.', MARGEN, y)
    doc.text(`Página ${i} de ${total}`, HOJA.ancho - MARGEN, y, { align: 'right' })
  }
}

/** Arma el PDF completo; separado de la descarga para poder probarlo sin navegador. */
export function armarPdf(
  doc: jsPDF,
  itinerario: Itinerario,
  { mapa: imagenMapa, logo, fecha }: { mapa: string | null; logo: LogoPdf | null; fecha: Date }
) {
  const h = new Hoja(doc)
  doc.setProperties({ title: 'Tu ruta por Michoacán', subject: 'Itinerario de viaje' })
  cabecera(h, itinerario, logo, fecha)
  mapa(h, imagenMapa)
  resumen(h, itinerario)

  h.asegurar(20)
  h.fuente(14, 'bold', COLOR.naranjaOscuro)
  h.parrafo('Itinerario')
  h.y += 2
  itinerario.dias.forEach((d, i) => {
    const desde =
      i === 0 ? itinerario.salida.nombre : itinerario.dias[i - 1]!.paradas.at(-1)!.nombre
    dia(h, d, desde, itinerario.minutos_por_dia)
  })

  h.fuente(8, 'normal', COLOR.texto2)
  h.parrafo(FUENTES.replace('{jornada}', duracion(itinerario.minutos_por_dia)))
  pies(doc)
  return doc
}

/**
 * Carga el logo (SVG o PNG) y lo pasa a PNG en un lienzo: jsPDF no incrusta SVG. Se dibuja a
 * 600 px de alto, unos 600 ppp en los 25 mm de la cabecera, para que se vea nítido al imprimir.
 */
function cargarLogo(url: string) {
  return new Promise<LogoPdf>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const alto = 600
      const ancho = Math.round((alto * img.naturalWidth) / img.naturalHeight)
      const lienzo = document.createElement('canvas')
      lienzo.width = ancho
      lienzo.height = alto
      const ctx = lienzo.getContext('2d')
      if (!ctx) return reject(new Error('El navegador no permite dibujar en un lienzo'))
      ctx.drawImage(img, 0, 0, ancho, alto)
      resolve({ png: lienzo.toDataURL('image/png'), ancho, alto })
    }
    img.onerror = () => reject(new Error(`No se pudo cargar ${url}`))
    img.src = url
  })
}

/** Genera el PDF de la ruta y lo descarga. jsPDF se carga hasta aquí, no con la página. */
export async function descargarPdf(itinerario: Itinerario) {
  const [{ jsPDF }, imagenMapa, logo] = await Promise.all([
    import('jspdf'),
    // Sin mapa (sin red, o el navegador bloqueó el lienzo) el itinerario sigue siendo útil.
    mapaEstatico(itinerario, MAPA_PX).catch(() => null),
    // Sin logo el PDF sale igual, con el recuadro punteado en su lugar.
    LOGO ? cargarLogo(LOGO).catch(() => null) : Promise.resolve(null),
  ])
  const fecha = new Date()
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  armarPdf(doc, itinerario, { mapa: imagenMapa, logo, fecha })
  doc.save(nombreArchivo(fecha))
}
