/** ["a", "b", "c"] → "a, b y c" */
export function listaNatural(elementos: string[]) {
  if (elementos.length <= 1) return elementos.join('')
  return `${elementos.slice(0, -1).join(', ')} y ${elementos.at(-1)}`
}

/** 45 → "45 min", 60 → "1 h", 135 → "2 h 15 min" */
export function duracion(minutos: number) {
  const total = Math.round(minutos)
  const horas = Math.floor(total / 60)
  const resto = total % 60
  if (horas === 0) return `${resto} min`
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`
}

/** 172.4 → "172 km", 8.25 → "8.3 km" */
export function distancia(km: number) {
  return km >= 100 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`
}
