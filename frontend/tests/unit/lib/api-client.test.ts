import { ApiError, apiFetch } from '@/lib/api/client'

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

const responder = (cuerpo: string | null, status = 200) =>
  fetchMock.mockResolvedValue(new Response(cuerpo, { status }))

describe('apiFetch', () => {
  it('antepone el prefijo de la API y devuelve el JSON', async () => {
    responder(JSON.stringify([{ codigo: 'historia' }]))
    await expect(apiFetch('/gustos')).resolves.toEqual([{ codigo: 'historia' }])
    expect(fetchMock.mock.calls[0]![0]).toBe('/prueba/gustos')
  })

  it('envía el cuerpo como JSON sin perder los headers propios', async () => {
    responder(null, 204)
    await apiFetch('/x', { method: 'POST', json: { mes: 11 }, headers: { 'X-A': '1' } })
    const [, init] = fetchMock.mock.calls[0]!
    expect(init.body).toBe('{"mes":11}')
    expect(init.headers).toEqual({ 'Content-Type': 'application/json', 'X-A': '1' })
  })

  it('usa el detail de FastAPI como mensaje de error', async () => {
    responder(JSON.stringify({ detail: 'Recinto no encontrado' }), 404)
    await expect(apiFetch('/x')).rejects.toMatchObject({
      message: 'Recinto no encontrado',
      status: 404,
    })
  })

  it('un error que no es JSON (502 del proxy) da un mensaje legible', async () => {
    responder('<html>Bad Gateway</html>', 502)
    await expect(apiFetch('/x')).rejects.toMatchObject({
      message: 'Ocurrió un error en el servidor',
      status: 502,
    })
  })

  it('sin conexión lanza un ApiError con estado 0', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    const error = await apiFetch('/x').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 0 })
  })
})
