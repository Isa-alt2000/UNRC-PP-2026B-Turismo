import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import {
  type RecintoRecomendado,
  type RespuestaRecomendaciones,
} from '@/components/recomendaciones'
import { apiFetch } from '@/lib/api/client'
import { RecomendacionesPage } from '@/pages/recomendaciones-page'
import { preferenciasIniciales, useViajeStore } from '@/stores'
import { renderApp } from '../test-utils'

vi.mock('@/lib/api/client', () => ({ apiFetch: vi.fn() }))
const mockApiFetch = vi.mocked(apiFetch)

const GUSTOS = [{ codigo: 'naturaleza', nombre: 'Naturaleza', pregunta: '¿Naturaleza?' }]

const recinto = (n: number, probabilidad = 0.5): RecintoRecomendado => ({
  id: `R000${n}`,
  nombre: `Recinto ${n}`,
  descripcion: null,
  probabilidad,
  afluencia: 'sin_datos',
  etiquetas: ['familiar', 'grande'],
})

function responder(respuesta: RespuestaRecomendaciones | Promise<never>) {
  mockApiFetch.mockImplementation((ruta) =>
    ruta === '/gustos' ? Promise.resolve(GUSTOS) : Promise.resolve(respuesta)
  )
}

function renderPagina() {
  renderApp(
    <Routes>
      <Route path="/viaje/lugares" element={<RecomendacionesPage />} />
      <Route path="/viaje/gustos" element={<p>Paso 1</p>} />
    </Routes>,
    { route: '/viaje/lugares' }
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
    seleccion: [],
  })
})

describe('RecomendacionesPage', () => {
  it('sin respuestas completas regresa al paso 1', () => {
    useViajeStore.setState({ preferencias: preferenciasIniciales })
    renderPagina()
    expect(screen.getByText('Paso 1')).toBeInTheDocument()
  })

  it('muestra el skeleton mientras llegan las recomendaciones', () => {
    mockApiFetch.mockReturnValue(new Promise(() => {}))
    renderPagina()
    expect(screen.getByRole('status', { name: 'Buscando lugares para ti' })).toBeInTheDocument()
  })

  it('si la carga falla, permite reintentar', async () => {
    mockApiFetch.mockImplementation((ruta) =>
      ruta === '/gustos' ? Promise.resolve(GUSTOS) : Promise.reject(new Error('500'))
    )
    renderPagina()
    expect(await screen.findByText('No pudimos cargar las recomendaciones')).toBeInTheDocument()

    responder({ recintos: [recinto(1)], recintos_por_afluencia: [] })
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Recinto 1')).toBeInTheDocument()
  })

  it('sin afines muestra las sorpresas', async () => {
    responder({ recintos: [], recintos_por_afluencia: [recinto(1), recinto(2), recinto(3)] })
    renderPagina()
    expect(await screen.findByText(/ninguno se ajustó a tus gustos/)).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox')).toHaveLength(3)
  })

  it('con pocos afines sugiere otros lugares', async () => {
    responder({ recintos: [recinto(1)], recintos_por_afluencia: [recinto(2), recinto(3)] })
    renderPagina()
    expect(await screen.findByText('También podrían interesarte estos lugares')).toBeInTheDocument()
  })

  it('muestra las etiquetas de cada lugar', async () => {
    responder({ recintos: [recinto(1)], recintos_por_afluencia: [] })
    renderPagina()
    expect(await screen.findByText('Apto para familias')).toBeInTheDocument()
    expect(screen.getByText('Lugar grande')).toBeInTheDocument()
  })

  it('muestra la afinidad de los afines con color de semáforo', async () => {
    responder({
      recintos: [recinto(1, 0.61), recinto(2, 0.55), recinto(3, 0.4)],
      recintos_por_afluencia: [],
    })
    renderPagina()
    expect(await screen.findByText('61 % de afinidad')).toHaveClass('afinidad-verde')
    expect(screen.getByText('55 % de afinidad')).toHaveClass('afinidad-naranja')
    expect(screen.getByText('40 % de afinidad')).toHaveClass('afinidad-roja')
  })

  it('no muestra la afinidad en las sugerencias por afluencia', async () => {
    responder({ recintos: [recinto(1, 0.7)], recintos_por_afluencia: [recinto(2, 0.02)] })
    renderPagina()
    expect(await screen.findByText('70 % de afinidad')).toBeInTheDocument()
    expect(screen.queryByText('2 % de afinidad')).not.toBeInTheDocument()
  })

  it('crea la ruta con 2 lugares y no deja elegir más de 4', async () => {
    responder({ recintos: [1, 2, 3, 4, 5].map(recinto), recintos_por_afluencia: [] })
    renderPagina()
    const boton = await screen.findByRole('button', { name: 'Crear mi ruta' })
    const casillas = screen.getAllByRole('checkbox')
    expect(boton).toBeDisabled()

    await userEvent.click(casillas[0]!)
    await userEvent.click(casillas[1]!)
    expect(boton).toBeEnabled()

    await userEvent.click(casillas[2]!)
    await userEvent.click(casillas[3]!)
    expect(casillas[4]).toBeDisabled()
    expect(screen.getByText(/4 de 4 lugares/)).toBeInTheDocument()
  })
})
