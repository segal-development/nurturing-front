import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Login } from '@/features/auth/Login';
import Dashboard from '@/pages/Dashboard';
import Prospectos from '@/pages/Prospectos';
import Flujos from '@/pages/Flujos';
import Ofertas from '@/pages/Ofertas';
import Monitor from '@/pages/Monitor';
import Configuracion from '@/pages/Configuracion';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'prospectos',
        element: <Prospectos />,
      },
      {
        path: 'flujos',
        element: <Flujos />,
      },
      {
        path: 'ofertas',
        element: <Ofertas />,
      },
      {
        path: 'monitor',
        element: <Monitor />,
      },
      {
        path: 'configuracion',
        element: <Configuracion />,
      },
    ],
  },
]);


