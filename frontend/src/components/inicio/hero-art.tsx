import { CatedralArt } from './catedral-art'
import { CiudadArt } from './ciudad-art'

/** Paisaje de la portada: volcán, catedral, ciudad, bosque y sol de cobre martillado. */
export function HeroArt() {
  return (
    <svg
      className="hero-art"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <rect width="1440" height="900" fill="#F9F4EF" />
      <g className="sun">
        <circle cx="920" cy="560" r="150" fill="#DDC9A3" />
        <circle
          className="sun-ring"
          cx="920"
          cy="560"
          r="192"
          fill="none"
          stroke="#BC955C"
          strokeWidth="2.5"
          strokeDasharray="2 11"
          strokeLinecap="round"
        />
        <circle
          className="sun-ring r2"
          cx="920"
          cy="560"
          r="238"
          fill="none"
          stroke="#DDC9A3"
          strokeWidth="2.5"
          strokeDasharray="1 15"
          strokeLinecap="round"
        />
      </g>
      <g className="clouds">
        <rect x="60" y="440" width="170" height="28" rx="14" fill="#FFFFFF" />
        <rect x="114" y="418" width="92" height="28" rx="14" fill="#FFFFFF" />
        <rect x="1060" y="300" width="210" height="26" rx="13" fill="#FFFFFF" />
        <rect x="1120" y="280" width="100" height="26" rx="13" fill="#FFFFFF" />
      </g>
      <path
        className="birds"
        d="M1150 372q8-8 16 0q8-8 16 0M1202 348q6-6 12 0q6-6 12 0M1010 380q7-7 14 0q7-7 14 0"
        fill="none"
        stroke="#232F3F"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <g className="mountains">
        <path
          d="M0 650L200 560L360 600L520 500L640 430L680 430L820 520L980 575L1160 505L1440 600L1440 700L0 700Z"
          fill="#EAD7C6"
        />
        <path d="M640 430L654 414L666 414L680 430Z" fill="#D4AF8D" />
        <path
          d="M0 660C180 612 320 620 480 650S820 618 980 640S1300 610 1440 634L1440 700L0 700Z"
          fill="#D4AF8D"
        />
        <CatedralArt />
      </g>
      <CiudadArt />
      <path
        d="M0 770C200 732 380 748 520 778S900 748 1100 768S1360 742 1440 756L1440 900L0 900Z"
        fill="#691C32"
      />
      <path
        d="M40 812L72 690L104 812ZM96 822L132 660L168 822ZM160 816L186 712L212 816ZM470 806L496 716L522 806ZM520 816L554 668L588 816ZM1180 806L1210 700L1240 806ZM1232 820L1268 650L1304 820ZM1304 814L1330 720L1356 814ZM1360 824L1396 668L1432 824Z"
        fill="#9F2241"
      />
      <path
        d="M0 840L30 742L60 840ZM228 836L256 744L284 836ZM600 832L624 752L648 832ZM860 830L886 734L912 830ZM904 840L936 700L968 840ZM1110 836L1136 748L1162 836Z"
        fill="#232F3F"
      />
    </svg>
  )
}
