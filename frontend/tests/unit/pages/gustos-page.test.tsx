import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { apiFetch } from '@/lib/api/client'
import { GustosPage } from '@/pages/gustos-page'
import { preferenciasIniciales, useViajeStore } from '@/stores'
import { renderApp } from '../test-utils'

vi.mock('@/lib/api/client', () => ({ apiFetch: vi.fn() }))
const mockApiFetch = vi.mocked(apiFetch)

const GUSTOS = [
  { codigo: 'historia', nombre: 'Historia', pregunta: '¿Te interesa la historia?' },
  { codigo: 'naturaleza', nombre: 'Naturaleza', pregunta: '¿Te gusta la naturaleza?' },
]

const PUNTOS = [
  { id: 'morelia', nombre: 'Morelia', latitud: 19.71, longitud: -101.21 },
  { id: 'uruapan', nombre: 'Uruapan', latitud: 19.42, longitud: -102.05 },
]

/** Responde cada catálogo según la ruta, como el backend. */
function responderCatalogos() {
  mockApiFetch.mockImplementation((ruta) =>
    Promise.resolve(ruta === '/puntos-partida' ? PUNTOS : GUSTOS)
  )
}

beforeEach(() => {
  mockApiFetch.mockReset()
  useViajeStore.setState({ preferencias: preferenciasIniciales })
})

describe('GustosPage', () => {
  it('muestra el skeleton mientras llegan los gustos', () => {
    mockApiFetch.mockReturnValue(new Promise(() => {}))
    renderApp(<GustosPage />)
    expect(screen.getByRole('status', { name: 'Cargando tus opciones' })).toBeInTheDocument()
  })

  it('si falla un catálogo, permite reintentar', async () => {
    mockApiFetch.mockImplementation((ruta) =>
      ruta === '/puntos-partida' ? Promise.reject(new Error('500')) : Promise.resolve(GUSTOS)
    )
    renderApp(<GustosPage />)
    expect(await screen.findByText('No pudimos cargar tus opciones')).toBeInTheDocument()

    responderCatalogos()
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Historia')).toBeInTheDocument()
  })

  it('muestra los puntos de partida que manda el backend', async () => {
    responderCatalogos()
    renderApp(<GustosPage />)
    expect(await screen.findByRole('radio', { name: 'Uruapan' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(2)
  })

  it('pinta un deslizador por cada gusto del backend', async () => {
    responderCatalogos()
    renderApp(<GustosPage />)
    expect(await screen.findByRole('slider', { name: 'Historia' })).toHaveAccessibleDescription(
      '¿Te interesa la historia?'
    )
    expect(screen.getAllByRole('slider')).toHaveLength(2)
  })

  it('tocar un número de la escala elige ese nivel', async () => {
    responderCatalogos()
    renderApp(<GustosPage />)
    const historia = await screen.findByRole('slider', { name: 'Historia' })
    const tarjeta = historia.closest('.gusto-s') as HTMLElement

    await userEvent.click(within(tarjeta).getByText('4'))

    expect(historia).toHaveValue('4')
  })

  it('el botón se habilita cuando están el gusto, el mes y la salida', async () => {
    responderCatalogos()
    renderApp(<GustosPage />)
    const boton = await screen.findByRole('button', { name: 'Ver lugares para mí' })
    expect(boton).toBeDisabled()

    fireEvent.change(screen.getByRole('slider', { name: 'Historia' }), { target: { value: '4' } })
    await userEvent.selectOptions(screen.getByLabelText('¿En qué mes viajas?'), '11')
    await userEvent.click(screen.getByRole('radio', { name: 'Morelia' }))

    expect(boton).toBeEnabled()
    expect(screen.getByText('Todo listo.')).toBeInTheDocument()
  })

  it('al enviar pide las recomendaciones con POST y todos los gustos', async () => {
    responderCatalogos()
    useViajeStore.setState({
      preferencias: {
        ...preferenciasIniciales,
        niveles: { historia: 4 },
        mes: 11,
        salida: 'morelia',
      },
    })
    renderApp(<GustosPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Ver lugares para mí' }))

    expect(mockApiFetch).toHaveBeenCalledWith(
      '/recomendaciones',
      expect.objectContaining({
        method: 'POST',
        json: { gustos: { historia: 4, naturaleza: 1 }, mes: 11, con_dependientes: false },
      })
    )
  })
})
