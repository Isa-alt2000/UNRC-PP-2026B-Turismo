/** ["a", "b", "c"] → "a, b y c" */
export function listaNatural(elementos: string[]) {
  if (elementos.length <= 1) return elementos.join('')
  return `${elementos.slice(0, -1).join(', ')} y ${elementos.at(-1)}`
}
