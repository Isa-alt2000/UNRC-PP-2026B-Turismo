import { useEffect, useRef } from 'react'

/** Lleva el foco al elemento al abrir una pantalla, para que los lectores de pantalla la anuncien. */
export function useFocusOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [])

  return ref
}
