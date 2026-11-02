import { createBrowserRouter, Outlet } from 'react-router-dom'

// Mapa de URLs. Cada pantalla nueva se agrega como hija de la ruta raíz.
export const router = createBrowserRouter([
  {
    element: <Outlet />,
    children: [],
  },
])
