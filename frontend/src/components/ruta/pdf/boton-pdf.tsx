import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui'
import { type Itinerario } from '../use-itinerario'

/** Descarga la ruta en PDF: mapa con los puntos, itinerario por día y alojamientos. */
export function BotonPdf({ itinerario }: { itinerario: Itinerario }) {
  const [estado, setEstado] = useState<'listo' | 'generando' | 'error'>('listo')

  async function descargar() {
    setEstado('generando')
    try {
      // El generador y jsPDF se descargan hasta que alguien pide el PDF.
      const { descargarPdf } = await import('./generar-pdf')
      await descargarPdf(itinerario)
      setEstado('listo')
    } catch {
      setEstado('error')
    }
  }

  const generando = estado === 'generando'
  return (
    <div className="flex flex-col">
      <Button className="w-full" onClick={descargar} disabled={generando} aria-busy={generando}>
        <Download size={18} strokeWidth={1.8} aria-hidden="true" />
        {generando ? 'Preparando el PDF…' : 'Descargar ruta en PDF'}
      </Button>
      {/* Siempre presente, para que el lector de pantalla anuncie el error cuando aparezca. */}
      <p className="help mt-2 empty:mt-0" role="status">
        {estado === 'error' ? 'No pudimos generar el PDF. Intenta de nuevo.' : ''}
      </p>
    </div>
  )
}
