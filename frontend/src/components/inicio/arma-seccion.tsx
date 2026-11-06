import { type Ref } from 'react'
import { ArrowRight } from 'lucide-react'
import { Footer } from '@/components/layouts'
import { Button } from '@/components/ui'
import { useRevelarUnaVez } from '@/hooks/use-revelar-una-vez'
import { cn } from '@/lib/utils'
import { RastroHuellas } from './arma-art'
import { ComparacionCard } from './comparacion-card'

const PASOS = [
  {
    titulo: 'Elige tus gustos',
    ayuda: 'Historia, naturaleza, gastronomía y más.',
    color: 'bg-rojo text-white',
  },
  {
    titulo: 'Descubre lugares con espacio',
    ayuda: 'Ordenados de menos a más concurridos en tu mes.',
    color: 'bg-oro text-marino',
  },
  {
    titulo: 'Recibe tu ruta y dónde dormir',
    ayuda: 'Con tiempos aproximados y alojamientos cercanos.',
    color: 'bg-marino text-white',
  },
]

interface ArmaSeccionProps {
  ref?: Ref<HTMLElement>
  tituloRef?: Ref<HTMLHeadingElement>
  onEmpezar: () => void
}

export function ArmaSeccion({ ref, tituloRef, onEmpezar }: ArmaSeccionProps) {
  const [copiaRef, copiaClase] = useRevelarUnaVez<HTMLDivElement>('arma-copia', 'izquierda')

  return (
    <section className="arma" ref={ref} aria-labelledby="arma-title">
      <RastroHuellas clave="arma-huellas-izq" className="huellas-izq" />
      <RastroHuellas clave="arma-huellas-der" className="huellas-der" contorno />
      <div className="arma-espacio arma-espacio-sup" />
      <div className="wrap arma-grid">
        <div className={cn('arma-copia', copiaClase)} ref={copiaRef}>
          <h2 id="arma-title" className="arma-title" tabIndex={-1} ref={tituloRef}>
            ¿Planeas viajar a Michoacán? Arma tu ruta personalizada.
          </h2>
          <p className="lead">
            Recomendamos lugares igual de valiosos según tus gustos, empezando por los menos
            concurridos. Los populares siguen disponibles, ¡Tú decides!
          </p>
          <ol className="pasos">
            {PASOS.map((paso, i) => (
              <li key={paso.titulo} className="paso">
                <span className={cn('paso-n', paso.color)} aria-hidden="true">
                  {i + 1}
                </span>
                <span className="paso-txt">
                  <span className="paso-t">{paso.titulo}</span>
                  <span className="help">{paso.ayuda}</span>
                </span>
              </li>
            ))}
          </ol>
          <Button size="large" onClick={onEmpezar}>
            Armar mi ruta
            <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
          </Button>
        </div>
        <ComparacionCard />
      </div>
      <div className="arma-espacio arma-espacio-inf" />
      <Footer />
    </section>
  )
}
