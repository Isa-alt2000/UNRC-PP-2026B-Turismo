import { render, screen } from '@testing-library/react'
import { ComparacionCard, type ComparacionVisitas } from '@/components/inicio/comparacion-card'

const DATOS: ComparacionVisitas = {
  mes: 'noviembre',
  descripcion: 'Dos zonas arqueológicas junto al lago de Pátzcuaro.',
  recintos: [
    { nombre: 'Tzintzuntzan', visitas: 14272, nivel: 'alta' },
    { nombre: 'Ihuatzio', visitas: 811, nivel: 'media' },
  ],
  fuente: 'Promedio de visitas 2022–2025, INAH.',
}

describe('ComparacionCard', () => {
  it('sin datos muestra el marcador con la misma forma', () => {
    render(<ComparacionCard />)
    expect(screen.getAllByText('Recinto')).toHaveLength(2)
    expect(screen.getAllByText('Sin datos')).toHaveLength(2)
    expect(screen.getAllByText('Descripción')).toHaveLength(2)
  })

  it('con datos muestra los recintos, sus visitas y la conclusión', () => {
    render(<ComparacionCard datos={DATOS} />)
    expect(screen.getByText('Visitas promedio en noviembre')).toBeInTheDocument()
    expect(screen.getByText('14,272')).toBeInTheDocument()
    expect(screen.getByText('Afluencia media')).toBeInTheDocument()
    expect(screen.getByText('Ihuatzio recibe casi 18 veces menos visitas.')).toBeInTheDocument()
    expect(screen.getByText(DATOS.fuente)).toBeInTheDocument()
  })
})
