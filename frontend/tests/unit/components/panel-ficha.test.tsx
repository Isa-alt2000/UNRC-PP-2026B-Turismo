import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PanelFicha } from '@/components/ruta/panel-ficha'

describe('PanelFicha', () => {
  it('se anuncia con su título y muestra la ficha', () => {
    render(
      <PanelFicha titulo="Parada 2: Tzintzuntzan" onCerrar={() => {}}>
        <p>Antigua capital purépecha</p>
      </PanelFicha>
    )
    expect(screen.getByRole('region', { name: 'Parada 2: Tzintzuntzan' })).toBeInTheDocument()
    expect(screen.getByText('Antigua capital purépecha')).toBeInTheDocument()
  })

  it('se cierra con la ✕', async () => {
    const onCerrar = vi.fn()
    render(
      <PanelFicha titulo="Salida desde Morelia" onCerrar={onCerrar}>
        <p>Salida</p>
      </PanelFicha>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(onCerrar).toHaveBeenCalledOnce()
  })

  it('se cierra con Esc', () => {
    const onCerrar = vi.fn()
    render(
      <PanelFicha titulo="Salida desde Morelia" onCerrar={onCerrar}>
        <p>Salida</p>
      </PanelFicha>
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCerrar).toHaveBeenCalledOnce()
  })
})
