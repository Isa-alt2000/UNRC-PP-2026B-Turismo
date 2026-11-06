import { type ReactNode } from 'react'

// Lucide ya no incluye íconos de marcas; estos siguen su mismo estilo de trazo.
function IconoInstagram() {
  return (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </>
  )
}

function IconoTiktok() {
  return <path d="M10 11.5a4.25 4.25 0 1 0 4 4.25V3c.6 2.6 2.6 4.6 5 5" />
}

// Agrega la URL de cada cuenta cuando exista; mientras tanto se muestra solo el ícono.
const REDES: { nombre: string; url: string; icono: ReactNode }[] = [
  { nombre: 'TikTok', url: '', icono: <IconoTiktok /> },
  { nombre: 'Instagram', url: '', icono: <IconoInstagram /> },
]

function Red({ nombre, url, icono }: (typeof REDES)[number]) {
  const svg = (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icono}
    </svg>
  )
  const clases =
    'text-marino grid size-11 place-items-center rounded-full bg-white shadow-suave transition-colors'

  if (!url) {
    return (
      <span className={clases} role="img" aria-label={nombre}>
        {svg}
      </span>
    )
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${nombre} (se abre en otra pestaña)`}
      className={`${clases} hover:bg-rojo hover:text-white`}
    >
      {svg}
    </a>
  )
}

export function Footer() {
  return (
    <footer className="wrap w-full pt-0">
      <div className="flex flex-col gap-4 rounded-[20px] bg-dorado px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex flex-col">
            <span className="font-display text-lg font-semibold text-guinda">
              ¿Sabías que también estamos en redes?
            </span>
            <span className="text-sm">Síguenos y descubre más rincones de Michoacán.</span>
          </p>
          <div className="flex gap-3">
            {REDES.map((red) => (
              <Red key={red.nombre} {...red} />
            ))}
          </div>
        </div>
        <p className="border-t border-marino/15 pt-4 text-xs">
          Proyecto prototípico de estudiantes de 5to semestre de la carrera de Licenciatura en
          Ciencia de Datos para Negocios. No es un sitio oficial.
        </p>
      </div>
    </footer>
  )
}
