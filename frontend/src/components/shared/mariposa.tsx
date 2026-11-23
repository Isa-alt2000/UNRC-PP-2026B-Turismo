/**
 * Monarca de perfil, la del logo (viewBox 0 0 380 330, de cara a la derecha). Las alas van en grupos
 * propios (.ala-delantera, .ala-trasera) para poder animar el aleteo desde fuera con CSS.
 * Las patas terminan cerca de (255, 271): ahí se apoya al posarse.
 */

const TINTA = '#1F1A17'

/** Puntos blancos del borde del ala, como diamantes pequeños. */
function Puntos({ puntos }: { puntos: [number, number][] }) {
  return (
    <g fill="#FFFFFF">
      {puntos.map(([x, y]) => (
        <polygon
          key={`${x}-${y}`}
          points={`${x},${y - 3} ${x + 3},${y} ${x},${y + 3} ${x - 3},${y}`}
        />
      ))}
    </g>
  )
}

/** Ala delantera, con su grupo .ala-delantera para animarla desde fuera. */
function AlaDelantera() {
  return (
    <g className="ala-delantera">
      <polygon
        points="62,18 84,16 236,210 60,162 46,112 44,60"
        fill={TINTA}
        stroke={TINTA}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <g stroke={TINTA} strokeWidth="4" strokeLinejoin="round">
        <polygon points="214,198 165,140 155,148 154,164 159,179" fill="#C9621A" />
        <polygon points="165,140 92,52 66,72 155,148" fill="#E07B1F" />
        <polygon points="155,148 66,72 64,112 154,164" fill="#F0A04B" />
        <polygon points="154,164 64,112 76,150 159,179" fill="#E8A65A" />
      </g>
      <Puntos
        puntos={[
          [70, 28],
          [58, 40],
          [52, 58],
          [50, 78],
          [51, 98],
          [53, 118],
          [57, 138],
          [64, 154],
          [82, 40],
          [70, 56],
          [100, 48],
          [118, 70],
        ]}
      />
    </g>
  )
}

/** Ala trasera, con su grupo .ala-trasera. */
function AlaTrasera() {
  return (
    <g className="ala-trasera">
      <polygon
        points="240,216 205,200 150,180 90,155 50,160 30,190 28,230 40,265 65,290 95,302 140,300 180,285 215,260 238,236"
        fill={TINTA}
        stroke={TINTA}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <g stroke={TINTA} strokeWidth="4" strokeLinejoin="round">
        <polygon
          points="212,224 160,201 142,210 139,226 144,241 154,251 172,254 189,248"
          fill="#E07B1F"
        />
        <polygon points="160,201 96,172 56,192 142,210" fill="#F0A04B" />
        <polygon points="142,210 56,192 50,228 139,226" fill="#E8A65A" />
        <polygon points="139,226 50,228 60,262 144,241" fill="#F0A04B" />
        <polygon points="144,241 60,262 84,284 154,251" fill="#E8A65A" />
        <polygon points="154,251 84,284 122,290 172,254" fill="#F0A04B" />
        <polygon points="172,254 122,290 160,278 189,248" fill="#E8A65A" />
        <polygon points="189,248 160,278 192,256 212,224" fill="#F0A04B" />
      </g>
      <Puntos
        puntos={[
          [40, 200],
          [38, 228],
          [44, 255],
          [58, 276],
          [78, 292],
          [104, 297],
          [132, 296],
          [160, 288],
          [70, 166],
        ]}
      />
    </g>
  )
}

/** Cuerpo, cabeza, antenas y patas: lo que no se mueve al aletear. */
function CuerpoMariposa() {
  return (
    <>
      {/* Cuerpo, cabeza, antenas y patas: lo que no se mueve al aletear. */}
      <polygon points="225,204 256,204 266,224 250,246 228,240" fill={TINTA} />
      <polygon points="262,210 281,214 286,228 271,237 258,230" fill={TINTA} />
      <Puntos
        puntos={[
          [240, 214],
          [252, 226],
          [272, 222],
        ]}
      />
      <g fill="none" stroke={TINTA} strokeWidth="2" strokeLinejoin="round">
        <polyline points="280,214 296,196 310,176 318,158" />
        <polyline points="274,212 286,192 294,172 298,152" />
        <polyline points="246,244 244,258 248,272" />
        <polyline points="256,240 258,256 262,270" />
      </g>
      <polygon points="315,151 322,151 322,158 315,158" fill={TINTA} />
      <polygon points="295,145 302,145 302,152 295,152" fill={TINTA} />
    </>
  )
}

export function MariposaFiguras() {
  return (
    <>
      <AlaDelantera />
      <AlaTrasera />
      <CuerpoMariposa />
    </>
  )
}
