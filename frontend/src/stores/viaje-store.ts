import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { type Preferencias } from '@/lib/preferencias'

export const preferenciasIniciales: Preferencias = {
  niveles: {},
  mes: null,
  salida: null,
  conDependientes: false,
}

interface ViajeState {
  preferencias: Preferencias
  /** Claves de los recintos elegidos para la ruta, en el orden en que se eligieron. */
  seleccion: string[]
  setNivel: (codigo: string, nivel: number) => void
  setMes: (mes: number | null) => void
  setSalida: (salida: string) => void
  setConDependientes: (conDependientes: boolean) => void
  alternarRecinto: (id: string) => void
  /** Reemplaza la selección, por ejemplo para quitar lugares que ya no se muestran. */
  fijarSeleccion: (seleccion: string[]) => void
}

const actualizar = (cambio: Partial<Preferencias>) => (state: ViajeState) => ({
  preferencias: { ...state.preferencias, ...cambio },
})

/** Respuestas del viaje en curso; las comparten todas las pantallas del flujo. */
export const useViajeStore = create<ViajeState>()(
  persist(
    (set) => ({
      preferencias: preferenciasIniciales,
      seleccion: [],
      setNivel: (codigo, nivel) =>
        set((state) => ({
          preferencias: {
            ...state.preferencias,
            niveles: { ...state.preferencias.niveles, [codigo]: nivel },
          },
        })),
      setMes: (mes) => set(actualizar({ mes })),
      setSalida: (salida) => set(actualizar({ salida })),
      setConDependientes: (conDependientes) => set(actualizar({ conDependientes })),
      alternarRecinto: (id) =>
        set((state) => ({
          seleccion: state.seleccion.includes(id)
            ? state.seleccion.filter((elegido) => elegido !== id)
            : [...state.seleccion, id],
        })),
      fijarSeleccion: (seleccion) => set({ seleccion }),
    }),
    {
      name: 'viaje',
      // Sobrevive a recargar la página, pero cada pestaña nueva empieza un viaje desde cero.
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ preferencias, seleccion }) => ({ preferencias, seleccion }),
    }
  )
)
