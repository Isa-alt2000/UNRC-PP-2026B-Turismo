import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { type HotelCercano, type Itinerario } from '@/components/ruta'
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

const hotel = (id: number, tamano: HotelCercano['tamano'], km: number): HotelCercano => ({
  id,
  nombre: `Hotel ${id}`,
  tipo: 'Hotel',
  tamano,
  es_local: tamano === 'micro' || tamano === 'pequena',
  distancia_km: km,
  telefono: id === 1 ? '4343421234' : null,
  sitio_web: id === 1 ? 'https://www.hotel1.mx' : null,
  direccion: id === 1 ? 'Calle Ponce de León 12, Centro' : null,
  latitud: 19.5,
  longitud: -101.6,
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
      hoteles: [
        hotel(1, 'micro', 0.4),
        hotel(2, 'grande', 0.8),
        hotel(3, 'pequena', 1.5),
        hotel(4, 'micro', 2.1),
      ],
      radio_hoteles_km: 10,
    },
    {
      dia: 2,
      paradas: [parada(3, 'Paricutín', 500)],
      trazo: { type: 'LineString', coordinates: [] },
      totales: { km: 40.2, minutos_traslado: 45, minutos_visita: 500, minutos_jornada: 545 },
      excede_jornada: true,
      hoteles: [],
      radio_hoteles_km: 25,
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

  it('muestra 3 alojamientos y despliega el resto', async () => {
    responder(ITINERARIO)
    renderPagina()

    const dia1 = await screen.findByRole('region', { name: 'Día 1' })
    expect(within(dia1).getByText('Dónde dormir cerca de Pátzcuaro')).toBeInTheDocument()
    expect(
      within(dia1)
        .getAllByRole('listitem')
        .filter((li) => li.matches('.hotel'))
    ).toHaveLength(3)
    expect(within(dia1).queryByText('Hotel 4')).toBeNull()

    const ver = within(dia1).getByRole('button', { name: 'Ver los 4 alojamientos' })
    expect(ver).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(ver)

    expect(within(dia1).getByText('Hotel 4')).toBeInTheDocument()
    expect(within(dia1).getByRole('button', { name: 'Ver menos' })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
  })

  it('cada alojamiento muestra tipo, tamaño, distancia y contacto', async () => {
    responder(ITINERARIO)
    renderPagina()

    const item = (await screen.findByText('Hotel 1')).closest('li')!
    expect(within(item).getByText('Hotel · Microempresa')).toBeInTheDocument()
    expect(within(item).getByText('a 0.4 km')).toBeInTheDocument()
    expect(within(item).getByText('Calle Ponce de León 12, Centro')).toBeInTheDocument()
    expect(within(item).getByRole('link', { name: '434 342 1234' })).toHaveAttribute(
      'href',
      'tel:+524343421234'
    )
    expect(within(item).getByRole('link', { name: /hotel1\.mx/ })).toHaveAttribute(
      'href',
      'https://www.hotel1.mx'
    )

    const sinContacto = screen.getByText('Hotel 2').closest('li')!
    expect(
      within(sinContacto).getByText('Sin teléfono ni sitio web en el directorio')
    ).toBeInTheDocument()
  })

  it('marca como negocio local solo a micro y pequeñas empresas', async () => {
    responder(ITINERARIO)
    renderPagina()

    const local = (await screen.findByText('Hotel 1')).closest('li')!
    const grande = screen.getByText('Hotel 2').closest('li')!
    expect(within(local).getByText('Negocio local')).toBeInTheDocument()
    expect(within(grande).queryByText('Negocio local')).toBeNull()
    expect(within(grande).getByText('Hotel · Gran empresa')).toBeInTheDocument()
  })

  it('sin alojamientos cerca lo explica', async () => {
    responder(ITINERARIO)
    renderPagina()

    const dia2 = await screen.findByRole('region', { name: 'Día 2' })
    expect(
      within(dia2).getByText('Sin alojamientos registrados a menos de 25 km')
    ).toBeInTheDocument()
  })

  it('avisa cuando se amplió la búsqueda a 25 km', async () => {
    const dias = ITINERARIO.dias.map((d, i) => (i === 0 ? { ...d, radio_hoteles_km: 25 } : d))
    responder({ ...ITINERARIO, dias })
    renderPagina()

    const dia1 = await screen.findByRole('region', { name: 'Día 1' })
    expect(
      within(dia1).getByText(/No encontramos alojamientos a menos de 10 km/)
    ).toBeInTheDocument()
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
