import { distancia, duracion } from '@/lib/formato'

describe('duracion', () => {
  it.each([
    [45, '45 min'],
    [60, '1 h'],
    [135, '2 h 15 min'],
    [97.4, '1 h 37 min'],
    [0, '0 min'],
  ])('%s min → %s', (minutos, texto) => {
    expect(duracion(minutos)).toBe(texto)
  })
})

describe('distancia', () => {
  it('con un decimal por debajo de 100 km y entera desde 100', () => {
    expect(distancia(8.25)).toBe('8.3 km')
    expect(distancia(172.4)).toBe('172 km')
  })
})
