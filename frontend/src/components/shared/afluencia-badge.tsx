import { cn } from '@/lib/utils'

export type NivelAfluencia = 'baja' | 'media' | 'alta' | 'sin_datos'

const ETIQUETAS: Record<NivelAfluencia, string> = {
  baja: 'Afluencia baja',
  media: 'Afluencia media',
  alta: 'Afluencia alta',
  sin_datos: 'Sin datos',
}

const CLASES: Record<NivelAfluencia, string> = {
  baja: 'afl-baja',
  media: 'afl-media',
  alta: 'afl-alta',
  sin_datos: 'afl-sd',
}

const BARRAS = [
  { x: 1, y: 8, altura: 5 },
  { x: 5.5, y: 5, altura: 8 },
  { x: 10, y: 2, altura: 11 },
]

const BARRAS_LLENAS: Record<Exclude<NivelAfluencia, 'sin_datos'>, number> = {
  baja: 1,
  media: 2,
  alta: 3,
}

function IconoNivel({ nivel }: { nivel: NivelAfluencia }) {
  if (nivel === 'sin_datos') {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        <circle
          cx="7"
          cy="7"
          r="5.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeDasharray="2 2"
        />
        <path d="M4.5 7h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    )
  }

  // Las barras llenas indican el nivel; las demás quedan solo con contorno.
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      {BARRAS.map((barra, i) =>
        i < BARRAS_LLENAS[nivel] ? (
          <rect
            key={barra.x}
            x={barra.x}
            y={barra.y}
            width="3"
            height={barra.altura}
            rx="1"
            fill="currentColor"
          />
        ) : (
          <rect
            key={barra.x}
            x={barra.x + 0.6}
            y={barra.y + 0.6}
            width="1.8"
            height={barra.altura - 1.2}
            rx=".9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        )
      )}
    </svg>
  )
}

/** Comunica la afluencia con ícono y texto, nunca solo con color. */
export function AfluenciaBadge({
  nivel,
  className,
}: {
  nivel: NivelAfluencia
  className?: string
}) {
  return (
    <span className={cn('afl', CLASES[nivel], className)}>
      <IconoNivel nivel={nivel} />
      {ETIQUETAS[nivel]}
    </span>
  )
}
