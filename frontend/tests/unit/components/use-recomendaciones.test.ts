import { armarSolicitud } from '@/components/recomendaciones'
import { preferenciasIniciales } from '@/stores'

const CODIGOS = ['historia', 'naturaleza', 'aventura']

describe('armarSolicitud', () => {
  it('incluye todos los gustos del catálogo; los no tocados van en 1', () => {
    const solicitud = armarSolicitud(
      { ...preferenciasIniciales, niveles: { historia: 4 }, mes: 11, conDependientes: true },
      CODIGOS
    )
    expect(solicitud).toEqual({
      gustos: { historia: 4, naturaleza: 1, aventura: 1 },
      mes: 11,
      con_dependientes: true,
    })
  })

  it('sin mes no arma la solicitud', () => {
    expect(armarSolicitud(preferenciasIniciales, CODIGOS)).toBeNull()
  })
})
