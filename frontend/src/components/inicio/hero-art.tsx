import { type CSSProperties, type ReactNode } from 'react'
import { MariposaFiguras } from '@/components/shared/mariposa'

// Punta de la espiga del tule donde se posa la mariposa, y base del tallo en el agua (ondas).
const PERCHA = { x: 700, y: 530 }
const BASE_TULE = { x: 690, y: 792 }
// Escala de la mariposa del logo (380 × 330) en la escena; sus patas quedan en la percha.
const ESCALA_MARIPOSA = 0.45
const PATAS = { x: 255, y: 271 }
const MARIPOSA = {
  x: PERCHA.x - PATAS.x * ESCALA_MARIPOSA,
  y: PERCHA.y + 2 - PATAS.y * ESCALA_MARIPOSA,
  w: 380 * ESCALA_MARIPOSA,
  h: 330 * ESCALA_MARIPOSA,
}

/** Hojas del tule: trazos finos y curvos que salen del agua. */
const HOJAS_TULE = [
  'M662 792C664 720 650 660 628 610',
  'M672 792C676 700 672 640 660 588',
  'M708 792C712 730 726 680 752 640',
  'M716 792C724 742 744 706 776 684',
  'M650 792C640 750 616 716 586 698',
  'M684 792C686 740 690 700 694 676',
]
const HOJAS_IZQUIERDA = [
  'M90 900C96 790 80 700 44 630',
  'M120 900C130 780 132 690 118 610',
  'M150 900C160 800 188 720 236 668',
  'M60 900C46 830 18 790 -20 770',
  'M176 900C190 830 224 790 276 772',
]
const HOJAS_DERECHA = [
  'M1290 900C1286 800 1300 720 1330 660',
  'M1320 900C1326 810 1350 750 1392 716',
  'M1262 900C1250 820 1226 770 1188 744',
  'M1352 900C1362 840 1392 808 1440 792',
]

const VISTA = '0 0 1440 900'
const AJUSTE = 'xMidYMax slice'

/** Plano fijo de la escena: ocupa toda la portada y se pinta una sola vez. */
function Plano({ children }: { children: ReactNode }) {
  return (
    <svg className="hero-plano" viewBox={VISTA} preserveAspectRatio={AJUSTE}>
      {children}
    </svg>
  )
}

interface CapaProps {
  className: string
  /** Rectángulo que ocupa en la escena, en unidades del viewBox (1440 × 900). */
  x: number
  y: number
  w: number
  h: number
  children: ReactNode
}

/**
 * Pieza animada en su propia capa: un elemento HTML del tamaño justo, colocado con la misma cuenta
 * que hace el SVG al ajustarse a la pantalla. Así el navegador la mueve en la GPU en lugar de
 * volver a pintar todo el paisaje en cada cuadro.
 */
function Capa({ className, x, y, w, h, children }: CapaProps) {
  return (
    <div
      className={`hero-capa ${className}`}
      style={{ '--x': x, '--y': y, '--w': w, '--h': h } as CSSProperties}
    >
      <svg viewBox={`${x} ${y} ${w} ${h}`} preserveAspectRatio="none">
        {children}
      </svg>
    </div>
  )
}

/**
 * Portada: el lago de Pátzcuaro con Janitzio al fondo. Una monarca llega volando, se posa en un
 * tule y se queda aleteando apenas; donde el tule toca el agua se forman ondas.
 *
 * Va en planos: tres fijos (fondo, tule de la percha, primer plano) y, entre ellos, una capa por
 * cada cosa que se mueve, en el mismo orden en que se encimaban en un solo SVG.
 */
export function HeroArt() {
  return (
    <div className="hero-art" aria-hidden="true">
      <Plano>
        <defs>
          <linearGradient id="hero-cielo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FAF4E8" />
            <stop offset="0.55" stopColor="#FBE9CF" />
            <stop offset="1" stopColor="#F8CF9B" />
          </linearGradient>
          <linearGradient id="hero-lago" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8DB2C2" />
            <stop offset="0.35" stopColor="#4F87A3" />
            <stop offset="1" stopColor="#2E6A88" />
          </linearGradient>
        </defs>
        <rect width="1440" height="610" fill="url(#hero-cielo)" />
        <circle cx="1080" cy="540" r="118" fill="#F5A623" opacity="0.85" />

        {/* Cerros alrededor del lago, del más lejano al más cercano. */}
        <path
          d="M0 560C120 520 220 500 330 530S520 540 600 520S760 470 860 500S1060 530 1160 500S1340 470 1440 510L1440 612L0 612Z"
          fill="#E8BFA6"
        />
        <path
          d="M0 588C140 560 260 566 380 584S600 578 700 590S980 566 1120 580S1340 560 1440 574L1440 612L0 612Z"
          fill="#C99A84"
        />

        {/* Lago */}
        <rect y="606" width="1440" height="294" fill="url(#hero-lago)" />

        {/* Janitzio: la isla, sus casas y el monumento a Morelos en la cima. */}
        <g>
          <path
            d="M640 612C680 600 700 586 730 566C756 548 776 520 796 506L824 506C846 522 866 548 890 566C918 586 940 600 980 612Z"
            fill="#3F6B4D"
          />
          {/* Casitas blancas en la ladera. */}
          <g fill="#FAF4E8" opacity="0.75">
            <rect x="700" y="590" width="10" height="8" rx="1" />
            <rect x="716" y="586" width="10" height="8" rx="1" />
            <rect x="734" y="580" width="10" height="8" rx="1" />
            <rect x="752" y="572" width="10" height="8" rx="1" />
            <rect x="770" y="562" width="10" height="8" rx="1" />
            <rect x="786" y="548" width="10" height="8" rx="1" />
            <rect x="842" y="550" width="10" height="8" rx="1" />
            <rect x="858" y="562" width="10" height="8" rx="1" />
            <rect x="874" y="572" width="10" height="8" rx="1" />
            <rect x="892" y="580" width="10" height="8" rx="1" />
            <rect x="910" y="588" width="10" height="8" rx="1" />
            <rect x="744" y="596" width="10" height="8" rx="1" />
            <rect x="800" y="592" width="10" height="8" rx="1" />
            <rect x="826" y="588" width="10" height="8" rx="1" />
            <rect x="860" y="594" width="10" height="8" rx="1" />
            <rect x="882" y="600" width="10" height="8" rx="1" />
            <rect x="764" y="584" width="10" height="8" rx="1" />
            <rect x="820" y="568" width="10" height="8" rx="1" />
          </g>
          {/* Monumento a Morelos: pedestal y la figura con el puño en alto. */}
          <g fill="#2F5A3C">
            <path d="M794 508L798 476H822L826 508Z" />
            <path d="M802 476L805 446H815L818 476Z" />
            <circle cx="810" cy="440" r="5" />
            <path d="M813 450L823 424" stroke="#2F5A3C" strokeWidth="5" strokeLinecap="round" />
          </g>
        </g>
      </Plano>

      {/* Reflejo de la isla en el agua, temblando y desvaneciéndose hacia abajo. */}
      <Capa className="reflejo" x={640} y={612} w={340} h={106}>
        <defs>
          <linearGradient id="hero-reflejo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1F3A2A" stopOpacity="0.35" />
            <stop offset="1" stopColor="#1F3A2A" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M640 612C680 624 700 638 730 658C756 676 776 704 796 718L824 718C846 702 866 676 890 658C918 638 940 624 980 612Z"
          fill="url(#hero-reflejo)"
        />
      </Capa>

      {/* Reflejo del sol y brillos del agua. */}
      <Capa className="brillos" x={170} y={630} w={960} h={240}>
        <g stroke="#FAF4E8" strokeLinecap="round" strokeWidth="3">
          <path
            d="M1046 640h68M1058 664h44M1040 690h80M1062 718h36"
            stroke="#F5A623"
            opacity="0.9"
          />
          <path d="M300 660h90M440 700h60M180 740h70M960 760h90M1180 690h70M520 840h80M860 860h60" />
        </g>
      </Capa>

      {/* Ondas donde el tule toca el agua: tres, una tras otra. */}
      <Capa className="ondas" x={566} y={768} w={248} h={48}>
        <g fill="none" stroke="#FAF4E8" strokeWidth="2">
          {[0, 1, 2].map((i) => (
            <ellipse
              key={i}
              className="onda"
              style={{ animationDelay: `calc(var(--t-llegada) + ${i * 1.4}s)` }}
              cx={BASE_TULE.x}
              cy={BASE_TULE.y}
              rx="120"
              ry="20"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      </Capa>

      <Plano>
        {/* Tule donde se posa: hojas, tallo y espiga. */}
        <g fill="none" strokeLinecap="round">
          <g stroke="#4C7A55" strokeWidth="6">
            {HOJAS_TULE.slice(0, 3).map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
          <path
            d={`M${BASE_TULE.x} ${BASE_TULE.y}C694 700 700 640 ${PERCHA.x} ${PERCHA.y + 50}`}
            stroke="#2F5A3C"
            strokeWidth="5"
          />
          <g stroke="#2F5A3C" strokeWidth="6">
            {HOJAS_TULE.slice(3).map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
        </g>
        <rect x={PERCHA.x - 7} y={PERCHA.y} width="14" height="54" rx="7" fill="#7A4A2A" />
        <path
          d={`M${PERCHA.x} ${PERCHA.y}v-14`}
          stroke="#7A4A2A"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </Plano>

      {/* La mariposa: vuela hasta la percha; la ubica la capa, no una transformación del SVG. */}
      <Capa className="mariposa-llegada" {...MARIPOSA}>
        <g transform={`translate(${MARIPOSA.x} ${MARIPOSA.y}) scale(${ESCALA_MARIPOSA})`}>
          <MariposaFiguras />
        </g>
      </Capa>

      <Plano>
        {/* Tules del primer plano, a los lados. */}
        <g fill="none" strokeLinecap="round">
          <g stroke="#2F5A3C" strokeWidth="9">
            {HOJAS_IZQUIERDA.map((d) => (
              <path key={d} d={d} />
            ))}
            {HOJAS_DERECHA.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
        </g>
        <rect x="111" y="600" width="16" height="64" rx="8" fill="#7A4A2A" />
        <rect x="1322" y="652" width="16" height="60" rx="8" fill="#7A4A2A" />
      </Plano>
    </div>
  )
}
