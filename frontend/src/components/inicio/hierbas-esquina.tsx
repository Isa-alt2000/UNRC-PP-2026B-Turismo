/**
 * Hierbas que cuelgan desde las esquinas superiores de la portada, para enmarcar el cielo.
 * Se dibuja la esquina izquierda; la derecha es la misma en espejo (ver .hierbas-der en inicio.css).
 *
 * Las ramas se quedan en una franja delgada arriba y bajan pegadas al borde: en escritorio el
 * título empieza a unos 112 px de la orilla y 80 px de arriba, y no debe quedar encima de las hojas.
 * En celular el título casi toca las orillas, así que solo se ve el fleco de arriba (inicio.css).
 */

type Punto = readonly [number, number]

interface Rama {
  /** Curva cuadrática del tallo, en unidades del viewBox (300 × 300). */
  desde: Punto
  control: Punto
  hasta: Punto
  hojas: number
  /** Largo de la hoja más grande; se achican hacia la punta. */
  largo: number
  color: string
}

const RAMAS: Rama[] = [
  {
    desde: [-10, 6],
    control: [130, -14],
    hasta: [290, 34],
    hojas: 10,
    largo: 34,
    color: '#2F5A3C',
  },
  { desde: [-6, -4], control: [34, 110], hasta: [22, 290], hojas: 9, largo: 32, color: '#2F5A3C' },
  { desde: [-8, 0], control: [70, 30], hasta: [150, 58], hojas: 6, largo: 28, color: '#4C7A55' },
  { desde: [-8, 0], control: [50, 60], hasta: [70, 180], hojas: 6, largo: 28, color: '#4C7A55' },
  { desde: [-4, 0], control: [40, 20], hasta: [96, 98], hojas: 5, largo: 24, color: '#6E9A6A' },
]

function enCurva(rama: Rama, t: number): { punto: Punto; angulo: number } {
  const [x0, y0] = rama.desde
  const [cx, cy] = rama.control
  const [x1, y1] = rama.hasta
  const u = 1 - t
  const punto: Punto = [
    u * u * x0 + 2 * u * t * cx + t * t * x1,
    u * u * y0 + 2 * u * t * cy + t * t * y1,
  ]
  const dx = 2 * u * (cx - x0) + 2 * t * (x1 - cx)
  const dy = 2 * u * (cy - y0) + 2 * t * (y1 - cy)
  return { punto, angulo: (Math.atan2(dy, dx) * 180) / Math.PI }
}

/** Hoja alargada y puntiaguda que sale del tallo hacia +x. */
function hoja(largo: number): string {
  const ancho = largo * 0.28
  return `M0 0Q${largo * 0.45} ${-ancho} ${largo} 0Q${largo * 0.45} ${ancho} 0 0Z`
}

/** Hojas alternadas a lo largo de cada tallo, abiertas 40° hacia adelante. Se calculan una vez. */
const HOJAS = RAMAS.flatMap((rama, r) =>
  Array.from({ length: rama.hojas }, (_, i) => {
    const t = 0.18 + (0.8 * i) / rama.hojas
    const { punto, angulo } = enCurva(rama, t)
    const lado = i % 2 === 0 ? 1 : -1
    return {
      clave: `${r}-${i}`,
      d: hoja(rama.largo * (1 - 0.45 * t)),
      transform: `translate(${punto[0].toFixed(1)} ${punto[1].toFixed(1)}) rotate(${(angulo + lado * 40).toFixed(1)})`,
      color: rama.color,
    }
  })
)

function Esquina({ className }: { className: string }) {
  return (
    <svg
      className={`hierbas ${className}`}
      viewBox="0 0 300 300"
      preserveAspectRatio="xMinYMin slice"
    >
      <g fill="none" strokeLinecap="round" strokeWidth={3}>
        {RAMAS.map((rama) => (
          <path
            key={rama.hasta.join()}
            d={`M${rama.desde.join(' ')}Q${rama.control.join(' ')} ${rama.hasta.join(' ')}`}
            stroke={rama.color}
          />
        ))}
      </g>
      {HOJAS.map((h) => (
        <path key={h.clave} d={h.d} transform={h.transform} fill={h.color} />
      ))}
    </svg>
  )
}

export function HierbasEsquinas() {
  return (
    <>
      <Esquina className="hierbas-izq" />
      <Esquina className="hierbas-der" />
    </>
  )
}
