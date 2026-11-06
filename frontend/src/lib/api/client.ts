const BASE_URL = import.meta.env.VITE_API_PREFIX
const MENSAJE_GENERICO = 'Ocurrió un error en el servidor'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface ApiFetchOptions extends Omit<RequestInit, 'body' | 'headers'> {
  /** Cuerpo que se envía como JSON. */
  json?: unknown
  headers?: Record<string, string>
}

/** Lee el cuerpo sin fallar si viene vacío (204) o no es JSON (un 502 del proxy). */
async function leerCuerpo(res: Response): Promise<unknown> {
  const texto = await res.text()
  if (!texto) return undefined
  try {
    return JSON.parse(texto)
  } catch {
    return undefined
  }
}

/** FastAPI manda sus errores en detail; en validaciones es una lista técnica y no se muestra. */
function mensajeError(cuerpo: unknown) {
  const detail = (cuerpo as { detail?: unknown } | undefined)?.detail
  return typeof detail === 'string' ? detail : MENSAJE_GENERICO
}

/** Única puerta de salida hacia el backend: todas las llamadas JSON pasan por aquí. */
export async function apiFetch<T>(
  ruta: string,
  { json, headers, ...opciones }: ApiFetchOptions = {}
): Promise<T> {
  const request: RequestInit = { ...opciones, headers }
  if (json !== undefined) {
    request.headers = { 'Content-Type': 'application/json', ...headers }
    request.body = JSON.stringify(json)
  }

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${ruta}`, request)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('Sin conexión con el servidor', 0)
  }

  const cuerpo = await leerCuerpo(res)
  if (!res.ok) throw new ApiError(mensajeError(cuerpo), res.status)
  return cuerpo as T
}
