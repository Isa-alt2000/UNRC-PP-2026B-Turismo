import { createBrowserRouter } from 'react-router'
import { RouteError } from '@/components/layouts'
import { InicioPage } from '@/pages/inicio-page'
import { NotFoundPage } from '@/pages/not-found-page'

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <InicioPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
