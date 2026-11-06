import type { ReactNode } from 'react'

// Dirección en la que se proyecta la profundidad de los muros.
const FONDO_X = 26
const FONDO_Y = -15

const MURO = '#9F2241'
const SOMBRA = '#691C32'
const CORNISA = '#BC955C'
const CLARO = '#DDC9A3'
const OSCURO = '#232F3F'
const CARATULA = '#F9F4EF'

// Los muros bajan más allá del horizonte para que la ciudad tape su base.
const SUELO = 500

interface CuerpoProps {
  x: number
  y: number
  ancho: number
  base: number
  /** Profundidad relativa; los cuerpos con menos fondo quedan centrados sobre el inferior. */
  fondo?: number
  color?: string
  techo?: string
  children?: ReactNode
}

function Cuerpo({
  x,
  y,
  ancho,
  base,
  fondo = 1,
  color = MURO,
  techo = CORNISA,
  children,
}: CuerpoProps) {
  const retiro = (1 - fondo) / 2
  const dx = FONDO_X * fondo
  const dy = FONDO_Y * fondo

  return (
    <g transform={`translate(${FONDO_X * retiro} ${FONDO_Y * retiro})`}>
      <path d={`M${x} ${y}l${dx} ${dy}h${ancho}l${-dx} ${-dy}Z`} fill={techo} />
      <path d={`M${x + ancho} ${y}l${dx} ${dy}V${base + dy}l${-dx} ${-dy}Z`} fill={SOMBRA} />
      <rect x={x} y={y} width={ancho} height={base - y} fill={color} />
      {children}
    </g>
  )
}

function Cornisa({ x, y, ancho, fondo }: Pick<CuerpoProps, 'x' | 'y' | 'ancho' | 'fondo'>) {
  return (
    <Cuerpo
      x={x - 4}
      y={y}
      ancho={ancho + 8}
      base={y + 5}
      fondo={fondo}
      color={CORNISA}
      techo={CLARO}
    />
  )
}

function Arco({
  x,
  y,
  ancho,
  base,
  fill,
}: {
  x: number
  y: number
  ancho: number
  base: number
  fill: string
}) {
  const radio = ancho / 2
  return (
    <path
      d={`M${x} ${base}V${y + radio}a${radio} ${radio} 0 0 1 ${ancho} 0V${base}Z`}
      fill={fill}
    />
  )
}

function Pinaculo({ x, y }: { x: number; y: number }) {
  return (
    <g fill={CORNISA}>
      <rect x={x - 2} y={y - 6} width="4" height="6" />
      <circle cx={x} cy={y - 10} r="4" />
      <rect x={x - 0.75} y={y - 18} width="1.5" height="6" />
    </g>
  )
}

function Reloj() {
  return (
    <g>
      <circle
        cx="54"
        cy="248"
        r="13"
        fill="none"
        stroke={CORNISA}
        strokeWidth="3"
        strokeDasharray="1.5 3"
      />
      <circle cx="54" cy="248" r="8" fill={CARATULA} stroke={OSCURO} strokeWidth="1.5" />
      <path d="M54 243v5l3 2" fill="none" stroke={OSCURO} strokeWidth="1.25" />
    </g>
  )
}

function Campanario() {
  return (
    <g>
      <path d="M42 214V188l6-7h12l6 7V214Z" fill={OSCURO} />
      <path d="M48 212c0-8 2-13 6-13s6 5 6 13Z" fill={CORNISA} />
      <rect x="39" y="212" width="30" height="4" fill={CLARO} />
      <Arco x={20} y={188} ancho={9} base={208} fill={SOMBRA} />
      <Arco x={79} y={188} ancho={9} base={208} fill={SOMBRA} />
    </g>
  )
}

function Remate() {
  return (
    <g transform={`translate(${FONDO_X / 2} ${FONDO_Y / 2})`}>
      <rect x="52.75" y="0" width="2.5" height="24" fill={OSCURO} />
      <rect x="48" y="7" width="12" height="2.5" fill={OSCURO} />
      <rect x="46" y="30" width="16" height="9" fill={MURO} />
      <path d="M47 30a7 7 0 0 1 14 0Z" fill={CORNISA} />
      <path d="M30 60L40 38H68L78 60Z" fill={CORNISA} />
      <path d="M64 60L60 38H68L78 60Z" fill={SOMBRA} fillOpacity="0.4" />
      <rect x="46" y="46" width="4" height="8" fill={OSCURO} />
      <rect x="55" y="46" width="4" height="8" fill={OSCURO} />
    </g>
  )
}

function Torre({ x = 0 }: { x?: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <Cuerpo x={0} y={275} ancho={108} base={SUELO} />
      <Cornisa x={0} y={270} ancho={108} />
      <Cuerpo x={12} y={137} ancho={84} base={270} fondo={0.78}>
        <Reloj />
        <Campanario />
      </Cuerpo>
      <Cornisa x={12} y={132} ancho={84} fondo={0.78} />
      <Cuerpo x={21} y={62} ancho={66} base={132} fondo={0.6}>
        <Arco x={35} y={82} ancho={14} base={118} fill={OSCURO} />
        <Arco x={59} y={82} ancho={14} base={118} fill={OSCURO} />
        <rect x="33" y="116" width="42" height="3" fill={CLARO} />
      </Cuerpo>
      <Cornisa x={21} y={58} ancho={66} fondo={0.6} />
      <Remate />
    </g>
  )
}

function PilaresEntrada({ centro, radio }: { centro: number; radio: number }) {
  const y = 408
  return (
    <g>
      {[centro - radio - 12, centro + radio].map((x) => (
        <g key={x}>
          <rect x={x} y={y} width="12" height={SUELO - y} fill={SOMBRA} />
          <rect x={x - 2} y={y - 4} width="16" height="4" fill={CORNISA} />
        </g>
      ))}
    </g>
  )
}

function Portada() {
  return (
    <g transform="translate(9 -5)">
      <Cuerpo x={108} y={327} ancho={184} base={SUELO}>
        {[129, 257].map((x) => (
          <rect key={x} x={x} y="335" width="14" height="20" rx="2" fill={CLARO} />
        ))}
        {[136, 264].map((cx) => (
          <circle
            key={cx}
            cx={cx}
            cy="378"
            r="6"
            fill={OSCURO}
            stroke={CORNISA}
            strokeWidth="1.5"
          />
        ))}
        {[126, 254].map((x) => (
          <g key={x}>
            <Arco x={x} y={424} ancho={20} base={SUELO} fill={SOMBRA} />
            <Arco x={x + 3} y={428} ancho={14} base={SUELO} fill={CORNISA} />
          </g>
        ))}
      </Cuerpo>
      <path d="M124 327a12 10 0 0 1 24 0ZM252 327a12 10 0 0 1 24 0Z" fill={MURO} />
      <Cuerpo x={160} y={305} ancho={80} base={327} />
      <g>
        <Arco x={174} y={316} ancho={10} base={342} fill={OSCURO} />
        <Arco x={216} y={316} ancho={10} base={342} fill={OSCURO} />
        <ellipse cx="200" cy="334" rx="10" ry="8" fill={OSCURO} stroke={CLARO} strokeWidth="2" />
        <Arco x={184} y={410} ancho={32} base={SUELO} fill={SOMBRA} />
        <Arco x={188} y={415} ancho={24} base={SUELO} fill={CORNISA} />
        <rect x="199.5" y="415" width="1" height="85" fill={SOMBRA} />
      </g>
      <Cuerpo x={184} y={290} ancho={32} base={305} fondo={0.6} />
      <g transform={`translate(${FONDO_X * 0.2} ${FONDO_Y * 0.2})`}>
        <path d="M184 290a16 12 0 0 1 32 0Z" fill={MURO} />
        <rect x="191" y="293" width="18" height="10" rx="1.5" fill={CLARO} />
        <Pinaculo x={200} y={278} />
      </g>
      <PilaresEntrada centro={200} radio={22} />
    </g>
  )
}

/** Fachada de la Catedral de Morelia en estilo plano, detrás de la ciudad. */
export function CatedralArt() {
  return (
    <g transform="translate(560 428) scale(0.5)">
      <Torre />
      <Portada />
      <Torre x={292} />
      <PilaresEntrada centro={88} radio={16} />
      <PilaresEntrada centro={312} radio={16} />
    </g>
  )
}
