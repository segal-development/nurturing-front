import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageLoader } from '@/components/shared/PageLoader';

// Login se carga síncronamente porque es la primera página que ve el usuario
import { Login } from '@/features/auth/Login';

// ============================================================
// LAZY LOADED PAGES
// Cada página se carga solo cuando el usuario navega a ella.
// Esto reduce el bundle inicial significativamente.
// ============================================================

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Prospectos = lazy(() => import('@/pages/Prospectos'));
const Flujos = lazy(() => import('@/pages/Flujos'));
const Ofertas = lazy(() => import('@/pages/Ofertas'));
const Monitor = lazy(() => import('@/pages/Monitor'));
const Configuracion = lazy(() => import('@/pages/Configuracion'));
const Costos = lazy(() => import('@/pages/Costos'));
const EnviosPage = lazy(() => import('@/pages/Envios'));

// Features con export nombrado necesitan wrapper
const ProfilePage = lazy(() =>
  import('@/pages/Profile').then((module) => ({ default: module.ProfilePage }))
);
const PlantillasPage = lazy(() =>
  import('@/features/plantillas/pages/PlantillasPage').then((module) => ({
    default: module.PlantillasPage,
  }))
);
const MetricasPage = lazy(() =>
  import('@/features/metricas').then((module) => ({
    default: module.MetricasPage,
  }))
);

/**
 * Wrapper que envuelve páginas lazy-loaded con Suspense
 */
function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

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
        element: (
          <LazyPage>
            <Dashboard />
          </LazyPage>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <LazyPage>
            <Dashboard />
          </LazyPage>
        ),
      },
      {
        path: 'prospectos',
        element: (
          <LazyPage>
            <Prospectos />
          </LazyPage>
        ),
      },
      {
        path: 'flujos',
        element: (
          <LazyPage>
            <Flujos />
          </LazyPage>
        ),
      },
      {
        path: 'envios',
        element: (
          <LazyPage>
            <EnviosPage />
          </LazyPage>
        ),
      },
      {
        path: 'plantillas',
        element: (
          <LazyPage>
            <PlantillasPage />
          </LazyPage>
        ),
      },
      {
        path: 'ofertas',
        element: (
          <LazyPage>
            <Ofertas />
          </LazyPage>
        ),
      },
      {
        path: 'monitor',
        element: (
          <LazyPage>
            <Monitor />
          </LazyPage>
        ),
      },
      {
        path: 'configuracion',
        element: (
          <LazyPage>
            <Configuracion />
          </LazyPage>
        ),
      },
      {
        path: 'costos',
        element: (
          <LazyPage>
            <Costos />
          </LazyPage>
        ),
      },
      {
        path: 'metricas',
        element: (
          <LazyPage>
            <MetricasPage />
          </LazyPage>
        ),
      },
      {
        path: 'profile',
        element: (
          <LazyPage>
            <ProfilePage />
          </LazyPage>
        ),
      },
    ],
  },
]);
