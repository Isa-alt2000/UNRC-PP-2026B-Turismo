import { colorDia } from '../colores'
import { CONTORNO_MICHOACAN } from '../michoacan'
import { type Itinerario, puntosDeRuta } from '../use-itinerario'

/** [latitud, longitud] */
type Punto = [number, number]

const TESELA = 256
const urlTesela = (z: number, x: number, y: number) =>
  `https://tile.openstreetmap.org/${z}/${x}/${y}.png`
// Una tesela que tarda más que esto se deja en blanco: el PDF no espera indefinidamente a la red.
const ESPERA_TESELA_MS = 8000
// Un solo punto no tiene extensión: se muestra a nivel de ciudad, no de calle.
const ZOOM_MAXIMO = 14

/** Web Mercator, la proyección de OSM: [latitud, longitud] → píxeles del mundo en el zoom z. */
export function aPixel([latitud, longitud]: Punto, z: number) {
  const escala = TESELA * 2 ** z
  const seno = Math.sin((latitud * Math.PI) / 180)
  return {
    x: ((longitud + 180) / 360) * escala,
    y: (0.5 - Math.log((1 + seno) / (1 - seno)) / (4 * Math.PI)) * escala,
  }
}

/** El zoom (fraccionario) más cercano en que todos los puntos caben en ancho × alto con margen. */
export function zoomQueCabe(puntos: Punto[], ancho: number, alto: number, margen: number) {
  const lats = puntos.map((p) => p[0])
  const lons = puntos.map((p) => p[1])
  const suroeste = aPixel([Math.min(...lats), Math.min(...lons)], 0)
  const noreste = aPixel([Math.max(...lats), Math.max(...lons)], 0)
  const zx = Math.log2((ancho - 2 * margen) / (noreste.x - suroeste.x))
  const zy = Math.log2((alto - 2 * margen) / (suroeste.y - noreste.y))
  return Math.min(zx, zy, ZOOM_MAXIMO)
}

function cargarTesela(url: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image()
    // Con CORS el lienzo no queda "contaminado" y se puede exportar como imagen.
    img.crossOrigin = 'anonymous'
    const espera = setTimeout(() => resolve(null), ESPERA_TESELA_MS)
    img.onload = () => {
      clearTimeout(espera)
      resolve(img)
    }
    img.onerror = () => {
      clearTimeout(espera)
      resolve(null)
    }
    img.src = url
  })
}

interface OpcionesMapa {
  /** Píxeles del lienzo; 1600 × 1000 son unos 220 ppp a lo ancho de una hoja A4. */
  ancho?: number
  alto?: number
}

/**
 * Dibuja en un lienzo lo mismo que el mapa de la página (teselas de OSM, sombra fuera de
 * Michoacán, trazo de cada día, alojamientos y paradas) y lo devuelve como JPEG en data URL.
 */
export async function mapaEstatico(
  itinerario: Itinerario,
  { ancho = 1600, alto = 1000 }: OpcionesMapa = {}
): Promise<string> {
  const lienzo = document.createElement('canvas')
  lienzo.width = ancho
  lienzo.height = alto
  const ctx = lienzo.getContext('2d')
  if (!ctx) throw new Error('El navegador no permite dibujar en un lienzo')

  // Todo se dibuja al doble que en pantalla: el lienzo mide el doble que el mapa de la página.
  const k = ancho / 800
  const puntos = puntosDeRuta(itinerario)
  const zoom = zoomQueCabe(puntos, ancho, alto, 40 * k)
  // Las teselas solo existen en zooms enteros: se usa el más cercano y se escala un poco.
  const zTeselas = Math.max(0, Math.min(18, Math.round(zoom)))
  const ladoTesela = TESELA * 2 ** (zoom - zTeselas)

  const lats = puntos.map((p) => p[0])
  const lons = puntos.map((p) => p[1])
  const so = aPixel([Math.min(...lats), Math.min(...lons)], zoom)
  const ne = aPixel([Math.max(...lats), Math.max(...lons)], zoom)
  const origen = { x: (so.x + ne.x) / 2 - ancho / 2, y: (so.y + ne.y) / 2 - alto / 2 }
  const enLienzo = (p: Punto): [number, number] => {
    const { x, y } = aPixel(p, zoom)
    return [x - origen.x, y - origen.y]
  }

  // Fondo blanco ala, como el del mapa mientras cargan las teselas.
  ctx.fillStyle = '#faf4e8'
  ctx.fillRect(0, 0, ancho, alto)

  const limite = 2 ** zTeselas
  const teselas: { x: number; y: number; img: Promise<HTMLImageElement | null> }[] = []
  for (let tx = Math.floor(origen.x / ladoTesela); tx * ladoTesela < origen.x + ancho; tx++) {
    for (let ty = Math.floor(origen.y / ladoTesela); ty * ladoTesela < origen.y + alto; ty++) {
      if (ty < 0 || ty >= limite) continue
      const x = ((tx % limite) + limite) % limite
      teselas.push({ x: tx, y: ty, img: cargarTesela(urlTesela(zTeselas, x, ty)) })
    }
  }
  for (const { x, y, img } of teselas) {
    const imagen = await img
    if (!imagen) continue
    // Medio píxel de más evita líneas finas entre teselas al escalar.
    ctx.drawImage(
      imagen,
      x * ladoTesela - origen.x,
      y * ladoTesela - origen.y,
      ladoTesela + 0.5,
      ladoTesela + 0.5
    )
  }

  // Sombra fuera del estado: todo el lienzo con Michoacán como hueco.
  ctx.beginPath()
  ctx.rect(0, 0, ancho, alto)
  CONTORNO_MICHOACAN.forEach((p, i) => {
    const [x, y] = enLienzo(p)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.closePath()
  ctx.fillStyle = 'rgb(31 26 23 / 0.28)'
  ctx.fill('evenodd')
  ctx.beginPath()
  CONTORNO_MICHOACAN.forEach((p, i) => {
    const [x, y] = enLienzo(p)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.closePath()
  ctx.strokeStyle = 'rgb(160 83 26 / 0.7)'
  ctx.lineWidth = 2 * k
  ctx.stroke()

  // Trazo de cada día, punteado si es línea recta.
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const dia of itinerario.dias) {
    ctx.beginPath()
    dia.trazo.coordinates.forEach(([lon, lat], i) => {
      const [x, y] = enLienzo([lat, lon])
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.setLineDash(itinerario.aproximada ? [8 * k, 8 * k] : [])
    ctx.globalAlpha = 0.85
    ctx.strokeStyle = colorDia(dia.dia)
    ctx.lineWidth = 5 * k
    ctx.stroke()
    ctx.globalAlpha = 1
  }
  ctx.setLineDash([])

  // Alojamientos: cuadrados redondeados en el color de su día, debajo de las paradas.
  for (const dia of itinerario.dias) {
    for (const hotel of dia.hoteles) {
      const [x, y] = enLienzo([hotel.latitud, hotel.longitud])
      const lado = 18 * k
      ctx.beginPath()
      ctx.roundRect(x - lado / 2, y - lado / 2, lado, lado, 6 * k)
      ctx.fillStyle = colorDia(dia.dia)
      ctx.fill()
      ctx.lineWidth = 2 * k
      ctx.strokeStyle = '#ffffff'
      ctx.stroke()
    }
  }

  // Salida: círculo blanco con aro y punto naranjas.
  const [sx, sy] = enLienzo([itinerario.salida.latitud, itinerario.salida.longitud])
  ctx.beginPath()
  ctx.arc(sx, sy, 13 * k, 0, 2 * Math.PI)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.lineWidth = 2.5 * k
  ctx.strokeStyle = '#e5711b'
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(sx, sy, 4 * k, 0, 2 * Math.PI)
  ctx.fillStyle = '#e5711b'
  ctx.fill()

  // Paradas numeradas.
  ctx.font = `700 ${13 * k}px system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (const parada of itinerario.dias.flatMap((d) => d.paradas)) {
    const [x, y] = enLienzo([parada.latitud, parada.longitud])
    ctx.beginPath()
    ctx.arc(x, y, 14 * k, 0, 2 * Math.PI)
    ctx.fillStyle = '#e5711b'
    ctx.fill()
    ctx.lineWidth = 2 * k
    ctx.strokeStyle = '#ffffff'
    ctx.stroke()
    ctx.fillStyle = '#1f1a17'
    ctx.fillText(String(parada.orden), x, y + 0.5 * k)
  }

  // Atribución que exige la licencia de OSM, en la esquina como en el mapa de la página.
  const atribucion = '© OpenStreetMap · rutas: openrouteservice'
  ctx.font = `${10 * k}px system-ui, sans-serif`
  const anchoTexto = ctx.measureText(atribucion).width
  ctx.fillStyle = 'rgb(255 255 255 / 0.8)'
  ctx.fillRect(ancho - anchoTexto - 12 * k, alto - 18 * k, anchoTexto + 12 * k, 18 * k)
  ctx.fillStyle = '#1f1a17'
  ctx.textAlign = 'right'
  ctx.fillText(atribucion, ancho - 6 * k, alto - 9 * k)

  // JPEG: las teselas son fotos de mapa y pesan varias veces menos que en PNG.
  return lienzo.toDataURL('image/jpeg', 0.88)
}
