import { armarSolicitudItinerario } from '@/components/ruta'
import { preferenciasIniciales } from '@/stores'

const CODIGOS = ['historia', 'naturaleza']

describe('armarSolicitudItinerario', () => {
  it('manda la salida, los lugares ordenados y todos los gustos', () => {
    const solicitud = armarSolicitudItinerario(
      { ...preferenciasIniciales, niveles: { historia: 5 }, salida: 'morelia' },
      ['R0011', 'R0002'],
      CODIGOS
    )
    expect(solicitud).toEqual({
      salida: 'morelia',
      recintos: ['R0002', 'R0011'],
      gustos: { historia: 5, naturaleza: 1 },
    })
  })

  it('el orden en que se eligieron no cambia la solicitud', () => {
    const preferencias = { ...preferenciasIniciales, salida: 'morelia' }
    expect(armarSolicitudItinerario(preferencias, ['R0002', 'R0011'], CODIGOS)).toEqual(
      armarSolicitudItinerario(preferencias, ['R0011', 'R0002'], CODIGOS)
    )
  })

  it('sin salida o sin lugares no arma la solicitud', () => {
    expect(armarSolicitudItinerario(preferenciasIniciales, ['R0001'], CODIGOS)).toBeNull()
    expect(
      armarSolicitudItinerario({ ...preferenciasIniciales, salida: 'morelia' }, [], CODIGOS)
    ).toBeNull()
  })
})
