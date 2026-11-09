import { fireEvent, render, screen } from '@testing-library/react'
import { type Parada } from '@/components/ruta'
import { FichaParada } from '@/components/ruta/ficha-parada'

const PARADA: Parada = {
  orden: 2,
  id: 'R0002',
  nombre: 'Zona Arqueológica de Tzintzuntzan',
  descripcion: 'Antigua capital purépecha con sus yácatas.',
  imagen: 'sin_imagen',
  latitud: 19.62,
  longitud: -101.57,
  km_desde_anterior: 15.4,
  minutos_traslado: 20,
  minutos_visita: 97,
}

const CON_IMAGEN: Parada = {
  ...PARADA,
  imagen: { url: '/api/v1/static/recintos/R0002.webp', credito: 'Foto: Autora, CC BY-SA 4.0' },
}

describe('FichaParada', () => {
  it('muestra el día, la parada, la descripción y los tiempos', () => {
    render(<FichaParada parada={PARADA} dia={1} />)

    expect(screen.getByText('Día 1')).toBeInTheDocument()
    expect(screen.getByText('Parada 2')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: PARADA.nombre })).toBeInTheDocument()
    expect(screen.getByText(PARADA.descripcion!)).toBeInTheDocument()
    expect(screen.getByText('Visita: 1 h 37 min')).toBeInTheDocument()
    expect(screen.getByText('Llegas en 20 min · 15.4 km')).toBeInTheDocument()
  })

  it('con sin_imagen pinta el recuadro y sin descripción no deja hueco', () => {
    const { container } = render(<FichaParada parada={{ ...PARADA, descripcion: null }} dia={1} />)
    expect(screen.queryByRole('img')).toBeNull()
    expect(container.querySelector('.ficha-img-vacia')).toBeInTheDocument()
    expect(container.querySelector('.ficha-desc')).toBeNull()
  })

  it('con imagen la muestra con su crédito en lugar del recuadro', () => {
    const { container } = render(<FichaParada parada={CON_IMAGEN} dia={1} />)

    expect(screen.getByRole('img', { name: `Foto de ${PARADA.nombre}` })).toHaveAttribute(
      'src',
      '/api/v1/static/recintos/R0002.webp'
    )
    expect(screen.getByText('Foto: Autora, CC BY-SA 4.0')).toBeInTheDocument()
    expect(container.querySelector('.ficha-img-vacia')).toBeNull()
  })

  it('una imagen sin crédito no muestra la línea de crédito', () => {
    const sinCredito: Parada = { ...PARADA, imagen: { url: '/foto.jpg', credito: null } }
    const { container } = render(<FichaParada parada={sinCredito} dia={1} />)
    expect(container.querySelector('.ficha-credito')).toBeNull()
  })

  it('si la imagen no carga, vuelve al recuadro', () => {
    const { container } = render(<FichaParada parada={CON_IMAGEN} dia={1} />)
    fireEvent.error(screen.getByRole('img'))
    expect(container.querySelector('.ficha-img-vacia')).toBeInTheDocument()
    expect(container.querySelector('.ficha-credito')).toBeNull()
  })
})
