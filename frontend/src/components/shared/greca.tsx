import { useId } from 'react'

// Flor de punto de cruz de la Meseta Purépecha: 7 × 7 puntadas de 4 px. B = borde, C = centro.
const FLOR = ['...B...', '..B.B..', '.B.B.B.', 'B.BCB.B', '.B.B.B.', '..B.B..', '...B...']
const PUNTADA = 4

/** Flor bordada con su color de borde y de centro, a partir de x. */
function Flor({ x, borde, centro }: { x: number; borde: string; centro: string }) {
  return FLOR.flatMap((fila, j) =>
    [...fila].flatMap((puntada, i) =>
      puntada === '.'
        ? []
        : [
            <rect
              key={`${i}-${j}`}
              x={x + i * PUNTADA}
              y={j * PUNTADA}
              width={PUNTADA - 0.6}
              height={PUNTADA - 0.6}
              fill={puntada === 'C' ? centro : borde}
            />,
          ]
    )
  )
}

/**
 * Cintillo decorativo que separa secciones: flores en punto de cruz como las de los rebozos y
 * blusas purépechas, en dos combinaciones de la paleta, entre líneas naranja (en CSS).
 */
export function Greca() {
  const patronId = useId()

  return (
    <svg className="greca" width="100%" height="32" aria-hidden="true">
      <defs>
        <pattern
          id={patronId}
          width="72"
          height="32"
          patternUnits="userSpaceOnUse"
          patternTransform="translate(0 2)"
        >
          <Flor x={2} borde="#E5711B" centro="#2E6A88" />
          <rect x="31" y="12" width="3.4" height="3.4" fill="#1F1A17" />
          <Flor x={38} borde="#2F5A3C" centro="#F5A623" />
          <rect x="67" y="12" width="3.4" height="3.4" fill="#1F1A17" />
        </pattern>
      </defs>
      <rect width="100%" height="32" fill="#FFFFFF" />
      <rect width="100%" height="32" fill={`url(#${patronId})`} />
    </svg>
  )
}
