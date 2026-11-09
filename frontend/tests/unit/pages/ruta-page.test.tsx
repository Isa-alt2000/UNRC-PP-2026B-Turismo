import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { type Itinerario } from '@/components/ruta'
import { apiFetch } from '@/lib/api/client'
import { RutaPage } from '@/pages/ruta-page'
import { preferenciasIniciales, useViajeStore } from '@/stores'
import { renderApp } from '../test-utils'

vi.mock('@/lib/api/client', () => ({ apiFetch: vi.fn() }))
// Leaflet necesita un navegador real; aquí basta con saber que el mapa se muestra.
vi.mock('@/components/ruta/ruta-mapa', () => ({
  RutaMapa: () => <div role="region" aria-label="Mapa de la ruta" />,
}))
const mockApiFetch = vi.mocked(apiFetch)

const GUSTOS = [{ codigo: 'naturaleza', nombre: 'Naturaleza', pregunta: '¿Naturaleza?' }]

const parada = (orden: number, nombre: string, visita = 90) => ({
  orden,
  id: `R000${orden}`,
  nombre,
  descripcion: null,
  imagen: 'sin_imagen' as const,
  latitud: 19.5,
  longitud: -101.6,
  km_desde_anterior: 40.2,
  minutos_traslado: 45,
  minutos_visita: visita,
})

const ITINERARIO: Itinerario = {
  aproximada: false,
  salida: { id: 'morelia', nombre: 'Morelia', latitud: 19.7, longitud: -101.2 },
  minutos_por_dia: 480,
  dias: [
    {
      dia: 1,
      paradas: [parada(1, 'Tzintzuntzan'), parada(2, 'Pátzcuaro')],
      trazo: { type: 'LineString', coordinates: [] },
      totales: { km: 80.4, minutos_traslado: 90, minutos_visita: 180, minutos_jornada: 270 },
      excede_jornada: false,
    },
    {
      dia: 2,
      paradas: [parada(3, 'Paricutín', 500)],
      trazo: { type: 'LineString', coordinates: [] },
      totales: { km: 40.2, minutos_traslado: 45, minutos_visita: 500, minutos_jornada: 545 },
      excede_jornada: true,
    },
  ],
  totales: { km: 120.6, minutos_traslado: 135, minutos_visita: 680, dias: 2 },
}

function responder(itinerario: Itinerario | Promise<never>) {
  mockApiFetch.mockImplementation((ruta) =>
    ruta === '/gustos' ? Promise.resolve(GUSTOS) : Promise.resolve(itinerario)
  )
}

function renderPagina() {
  renderApp(
    <Routes>
      <Route path="/viaje/ruta" element={<RutaPage />} />
      <Route path="/viaje/lugares" element={<p>Paso 2</p>} />
      <Route path="/viaje/gustos" element={<p>Paso 1</p>} />
    </Routes>,
    { route: '/viaje/ruta' }
  )
}

beforeEach(() => {
  mockApiFetch.mockReset()
  useViajeStore.setState({
    preferencias: {
      niveles: { naturaleza: 5 },
      mes: 11,
      salida: 'morelia',
      conDependientes: false,
    },
    seleccion: ['R0003', 'R0001', 'R0002'],
  })
})

describe('RutaPage', () => {
  it('sin respuestas completas regresa al paso 1', () => {
    useViajeStore.setState({ preferencias: preferenciasIniciales })
    renderPagina()
    expect(screen.getByText('Paso 1')).toBeInTheDocument()
  })

  it('con menos de 2 lugares regresa a elegirlos', () => {
    useViajeStore.setState({ seleccion: ['R0001'] })
    renderPagina()
    expect(screen.getByText('Paso 2')).toBeInTheDocument()
  })

  it('pide el itinerario con la salida, los lugares y los gustos', async () => {
    responder(ITINERARIO)
    renderPagina()
    await screen.findByRole('region', { name: 'Día 1' })

    expect(mockApiFetch).toHaveBeenCalledWith('/itinerarios', {
      method: 'POST',
      json: {
        salida: 'morelia',
        recintos: ['R0001', 'R0002', 'R0003'],
        gustos: { naturaleza: 5 },
      },
      signal: expect.any(AbortSignal),
    })
  })

  it('muestra el cálculo mientras llega la ruta', () => {
    mockApiFetch.mockImplementation((ruta) =>
      ruta === '/gustos' ? Promise.resolve(GUSTOS) : new Promise(() => {})
    )
    renderPagina()
    expect(screen.getByRole('status')).toHaveTextContent('Calculando el mejor orden')
  })

  it('muestra el mapa, el resumen y cada día con sus paradas', async () => {
    responder(ITINERARIO)
    renderPagina()

    expect(await screen.findByRole('region', { name: 'Mapa de la ruta' })).toBeInTheDocument()
    expect(screen.getByText('Días').nextSibling).toHaveTextContent('2')
    expect(screen.getByText('2 h 15 min')).toBeInTheDocument()

    const dia1 = screen.getByRole('region', { name: 'Día 1' })
    expect(within(dia1).getByText('Salida desde Morelia')).toBeInTheDocument()
    expect(within(dia1).getByText('Tzintzuntzan')).toBeInTheDocument()
    expect(within(dia1).getAllByText(/Visita: 1 h 30 min/)).toHaveLength(2)

    // El día 2 sale del último lugar del día 1.
    const dia2 = screen.getByRole('region', { name: 'Día 2' })
    expect(within(dia2).getByText('Salida desde Pátzcuaro')).toBeInTheDocument()
  })

  it('cada día muestra los alojamientos como sin datos', async () => {
    responder(ITINERARIO)
    renderPagina()

    const dia1 = await screen.findByRole('region', { name: 'Día 1' })
    expect(within(dia1).getByText('Dónde dormir cerca de Pátzcuaro')).toBeInTheDocument()
    expect(within(dia1).getByText('Sin datos de alojamientos')).toBeInTheDocument()
  })

  it('avisa del día que pasa de la jornada', async () => {
    responder(ITINERARIO)
    renderPagina()

    const dia2 = await screen.findByRole('region', { name: 'Día 2' })
    expect(within(dia2).getByText(/Este día pasa de 8 h/)).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Día 1' })).queryByText(/pasa de/)).toBeNull()
  })

  it('avisa cuando la ruta es en línea recta', async () => {
    responder({ ...ITINERARIO, aproximada: true })
    renderPagina()
    expect(await screen.findByText(/estimaron en línea recta/)).toBeInTheDocument()
  })

  it('si el cálculo falla, permite reintentar o editar los lugares', async () => {
    mockApiFetch.mockImplementation((ruta) =>
      ruta === '/gustos' ? Promise.resolve(GUSTOS) : Promise.reject(new Error('500'))
    )
    renderPagina()
    expect(await screen.findByText('No pudimos calcular tu ruta')).toBeInTheDocument()

    responder(ITINERARIO)
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('region', { name: 'Día 1' })).toBeInTheDocument()
  })

  it('editar lugares regresa al paso 2', async () => {
    responder(ITINERARIO)
    renderPagina()
    await userEvent.click(await screen.findByRole('button', { name: 'Editar lugares' }))
    expect(screen.getByText('Paso 2')).toBeInTheDocument()
  })
})
