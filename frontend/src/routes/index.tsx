import { createBrowserRouter, Navigate } from 'react-router'
import { RouteError, ViajeLayout } from '@/components/layouts'
import { InicioPage } from '@/pages/inicio-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { GustosDiferida, RecomendacionesDiferida } from './pantallas-diferidas'

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <InicioPage /> },
      {
        path: 'viaje',
        element: <ViajeLayout />,
        children: [
          { index: true, element: <Navigate to="gustos" replace /> },
          { path: 'gustos', element: <GustosDiferida /> },
          { path: 'lugares', element: <RecomendacionesDiferida /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
