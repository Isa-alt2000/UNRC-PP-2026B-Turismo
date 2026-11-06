import { AfluenciaBadge, Greca, type NivelAfluencia } from '@/components/shared'
import { useRevelarUnaVez } from '@/hooks/use-revelar-una-vez'
import { cn } from '@/lib/utils'

/** Un recinto de la comparación, con sus visitas promedio del mes. */
export interface RecintoVisitas {
  nombre: string
  visitas: number
  nivel: NivelAfluencia
}

/** Lo que la tarjeta espera del backend. Las claves siguen el mismo formato de la API. */
export interface ComparacionVisitas {
  mes: string
  descripcion: string
  recintos: RecintoVisitas[]
  fuente: string
}

const COLOR_BARRA: Record<NivelAfluencia, string> = {
  baja: 'bg-afluencia-baja',
  media: 'bg-afluencia-media',
  alta: 'bg-afluencia-alta',
  sin_datos: 'bg-borde-fuerte',
}

// Se muestra mientras no lleguen los datos: misma forma, sin contenido.
const MARCADOR: ComparacionVisitas = {
  mes: '…',
  descripcion: 'Descripción',
  recintos: [
    { nombre: 'Recinto', visitas: 0, nivel: 'sin_datos' },
    { nombre: 'Recinto', visitas: 0, nivel: 'sin_datos' },
  ],
  fuente: '',
}
const ANCHOS_MARCADOR = ['100%', '20%']

/** Cuántas veces menos visitas recibe el recinto menos concurrido que el más concurrido. */
function conclusion(recintos: RecintoVisitas[]) {
  const ordenados = [...recintos].sort((a, b) => b.visitas - a.visitas)
  const mayor = ordenados[0]
  const menor = ordenados.at(-1)
  if (!mayor || !menor || menor === mayor || menor.visitas === 0) return null
  return `${menor.nombre} recibe casi ${Math.round(mayor.visitas / menor.visitas)} veces menos visitas.`
}

export function ComparacionCard({ datos }: { datos?: ComparacionVisitas }) {
  const [tarjetaRef, tarjetaClase] = useRevelarUnaVez<HTMLElement>('arma-comparacion', 'derecha')
  const { mes, descripcion, recintos, fuente } = datos ?? MARCADOR
  // Al menos 1 para no dividir entre cero si ningún recinto tiene visitas.
  const maximo = Math.max(1, ...recintos.map((r) => r.visitas))

  return (
    <section className={cn('compare', tarjetaClase)} ref={tarjetaRef} aria-labelledby="cmp-title">
      <Greca />
      <div className="flex flex-col gap-1">
        <h2 id="cmp-title" className="compare-title">
          Visitas promedio en {mes}
        </h2>
        <p className="help">{descripcion}</p>
      </div>
      {recintos.map((recinto, i) => (
        <div key={i} className="cmp-row">
          <div className="cmp-head">
            <span className="cmp-name">{recinto.nombre}</span>
            <span className="cmp-num">{datos ? recinto.visitas.toLocaleString('es-MX') : '—'}</span>
          </div>
          <div className="bar-track">
            <div
              className={cn('bar', COLOR_BARRA[recinto.nivel])}
              style={{
                width: datos ? `${(recinto.visitas / maximo) * 100}%` : ANCHOS_MARCADOR[i],
              }}
            />
          </div>
          <AfluenciaBadge nivel={recinto.nivel} className="self-start" />
        </div>
      ))}
      <p className="compare-find">
        {datos ? <strong>{conclusion(recintos)}</strong> : 'Descripción'}
      </p>
      {fuente && <p className="source">{fuente}</p>}
    </section>
  )
}
