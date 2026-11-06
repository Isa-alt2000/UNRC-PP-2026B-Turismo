const ANCHO_VISTA = 1440
const INCLINACION = 0.45

// De la fila más lejana a la más cercana: los techos crecen, se separan y ganan color.
const FILAS = [
  { y: 675, ancho: 14, alto: 10, paso: 29, opacidad: 0.5 },
  { y: 691, ancho: 18, alto: 13, paso: 37, opacidad: 0.62 },
  { y: 711, ancho: 23, alto: 17, paso: 47, opacidad: 0.75 },
  { y: 736, ancho: 29, alto: 22, paso: 59, opacidad: 0.88 },
  { y: 766, ancho: 36, alto: 27, paso: 73, opacidad: 1 },
]

type Fila = (typeof FILAS)[number]

// Valor pseudoaleatorio en [0, 1): el dibujo varía sin cambiar entre renders.
const azar = (semilla: number) => ((semilla * 9301 + 49297) % 233280) / 233280

function trazarTechos({ y, ancho, alto, paso }: Fila, indiceFila: number) {
  let trazo = ''
  for (let i = 0; i * paso < ANCHO_VISTA + paso; i++) {
    const semilla = i * 31 + indiceFila * 97
    if (azar(semilla) < 0.16) continue // Los huecos sugieren calles y plazas.
    const escala = 0.85 + azar(semilla + 1) * 0.3
    const a = Math.round(ancho * escala)
    const h = Math.round(alto * escala)
    const x = Math.round(i * paso + (azar(semilla + 2) - 0.5) * paso * 0.4)
    const base = Math.round(y + azar(semilla + 3) * alto * 0.3) + h
    const fondo = Math.round(h * INCLINACION)
    trazo += `M${x} ${base}h${a}l${fondo} ${-h}h${-a}Z`
  }
  return trazo
}

/** Ciudad en vista semiaérea. El suelo es opaco porque tapa a las montañas antes de que suban. */
export function CiudadArt() {
  return (
    <>
      <rect y="668" width={ANCHO_VISTA} height="130" fill="#EAD7C6" />
      {FILAS.map((fila, i) => (
        <path key={fila.y} d={trazarTechos(fila, i)} fill="#9F2241" fillOpacity={fila.opacidad} />
      ))}
    </>
  )
}
