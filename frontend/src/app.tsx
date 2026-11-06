import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import { queryClient } from '@/lib/query-client'
import { router } from '@/routes'

/** Raíz de la app: el único lugar que conoce a todas las capas y las conecta. */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* La app ocupa la ventana y cada pantalla desplaza su propio contenido. */}
      <div className="relative flex h-dvh flex-col overflow-hidden">
        <RouterProvider router={router} />
      </div>
    </QueryClientProvider>
  )
}
