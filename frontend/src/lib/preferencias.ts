import { NIVEL_INICIAL, NIVEL_MINIMO } from '@/config/constants'
import { listaNatural } from './formato'

/** Nivel de 1 a 5 por código de gusto. Un gusto sin calificar vale NIVEL_INICIAL. */
export type NivelesGustos = Record<string, number>

export interface Preferencias {
  niveles: NivelesGustos
  /** De 1 a 12; null mientras no se elige. */
  mes: number | null
  salida: string | null
  conDependientes: boolean
}

export const nivelDe = (niveles: NivelesGustos, codigo: string) => niveles[codigo] ?? NIVEL_INICIAL

/** Gustos que cuentan, del más al menos importante para la persona. */
export function gustosElegidos(niveles: NivelesGustos) {
  return Object.keys(niveles)
    .filter((codigo) => nivelDe(niveles, codigo) >= NIVEL_MINIMO)
    .sort((a, b) => nivelDe(niveles, b) - nivelDe(niveles, a))
}

export function preferenciasFaltantes({ niveles, mes, salida }: Preferencias) {
  const faltan: string[] = []
  if (!gustosElegidos(niveles).length) faltan.push(`al menos un gusto en ${NIVEL_MINIMO} o más`)
  if (mes === null) faltan.push('el mes')
  if (!salida) faltan.push('el punto de partida')
  return faltan
}

export function textoFaltantes(faltan: string[]) {
  return faltan.length ? `Falta elegir ${listaNatural(faltan)}.` : 'Todo listo.'
}
