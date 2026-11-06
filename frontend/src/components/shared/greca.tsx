import { useId } from 'react'

/** Cintillo decorativo que separa secciones. */
export function Greca() {
  const patronId = useId()

  return (
    <svg className="greca" width="100%" height="28" aria-hidden="true">
      <defs>
        <pattern id={patronId} width="56" height="28" patternUnits="userSpaceOnUse">
          <rect width="56" height="28" fill="#9F2241" />
          <path d="M0 14L14 4L28 14L42 24L56 14" fill="none" stroke="#DDC9A3" strokeWidth="2" />
          <path d="M0 14L14 24L28 14L42 4L56 14" fill="none" stroke="#BC955C" strokeWidth="2" />
          <circle cx="14" cy="14" r="2.5" fill="#FFFFFF" />
          <circle cx="42" cy="14" r="2.5" fill="#FFFFFF" />
        </pattern>
      </defs>
      <rect width="100%" height="28" fill={`url(#${patronId})`} />
    </svg>
  )
}
