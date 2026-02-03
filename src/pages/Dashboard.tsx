/**
 * Dashboard - Container component
 *
 * Responsibilities: data fetching, loading/error states, composition.
 * All presentational logic is delegated to child components.
 */

import { useQuery } from '@tanstack/react-query';
import { Users, Send, Calendar, Tag, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { formatNumber, formatPercentage } from '@/lib/utils';
import { dashboardService } from '@/api/dashboard.service';
import { useTheme } from '@/hooks/useTheme';
import { StatCard } from '@/components/dashboard/StatCard';
import { EmailQualityCard } from '@/components/dashboard/EmailQualityCard';
import { EnviosPorDiaChart } from '@/components/dashboard/EnviosPorDiaChart';
import { ProspectosPorFlujoChart } from '@/components/dashboard/ProspectosPorFlujoChart';

export default function Dashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Obtener datos del backend en tiempo real
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 10 * 60 * 1000, // Refetch cada 10 minutos
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-segal-blue dark:text-segal-turquoise mx-auto mb-4" />
          <p className="text-segal-dark/60 dark:text-gray-400">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-red-800 dark:text-red-300">Error al cargar el dashboard</h3>
          <p className="text-sm text-red-700 dark:text-red-400">{error instanceof Error ? error.message : 'Error desconocido'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header - Segal Corporate */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-segal-dark dark:text-white">Dashboard</h1>
        <p className="text-segal-dark/60 dark:text-gray-400">
          Vista general del sistema de nurturing
        </p>
      </div>

      {/* Stats cards - Segal Corporate Colors */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Prospectos"
          value={formatNumber(stats?.total_prospectos || 0)}
          subtitle="En el sistema"
          icon={Users}
          cardClassName="border-segal-blue/10 dark:border-gray-700 dark:bg-gray-900 hover:border-segal-blue/30 dark:hover:border-segal-blue/50 hover:shadow-md transition-all duration-200"
          iconClassName="text-segal-blue dark:text-segal-turquoise"
        />
        <StatCard
          title="Envíos Hoy"
          value={formatNumber(stats?.envios_hoy || 0)}
          subtitle="Mensajes enviados"
          icon={Send}
          cardClassName="border-segal-turquoise/10 dark:border-gray-700 dark:bg-gray-900 hover:border-segal-turquoise/30 dark:hover:border-segal-turquoise/50 hover:shadow-md transition-all duration-200"
          iconClassName="text-segal-turquoise"
        />
        <StatCard
          title="Envíos Programados"
          value={formatNumber(stats?.envios_programados || 0)}
          subtitle="Próximos envíos"
          icon={Calendar}
          cardClassName="border-segal-orange/10 dark:border-gray-700 dark:bg-gray-900 hover:border-segal-orange/30 dark:hover:border-orange-500/50 hover:shadow-md transition-all duration-200"
          iconClassName="text-segal-orange dark:text-orange-400"
        />
        <StatCard
          title="Ofertas Activas"
          value={stats?.ofertas_activas || 0}
          subtitle="Ofertas Infocom"
          icon={Tag}
          cardClassName="border-segal-green/10 dark:border-gray-700 dark:bg-gray-900 hover:border-segal-green/30 dark:hover:border-green-500/50 hover:shadow-md transition-all duration-200"
          iconClassName="text-segal-green dark:text-green-400"
        />
        <StatCard
          title="Tasa de Entrega"
          value={formatPercentage(stats?.tasa_entrega || 0)}
          subtitle="Últimos 30 días"
          icon={TrendingUp}
          cardClassName="border-segal-blue/10 dark:border-gray-700 dark:bg-gray-900 hover:border-segal-blue/30 dark:hover:border-segal-blue/50 hover:shadow-md transition-all duration-200"
          iconClassName="text-segal-blue dark:text-segal-turquoise"
        />
      </div>

      {/* Email Quality Card */}
      <EmailQualityCard data={stats?.calidad_emails} />

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <EnviosPorDiaChart data={stats?.envios_por_dia || []} isDark={isDark} />
        <ProspectosPorFlujoChart data={stats?.prospectos_por_flujo || []} isDark={isDark} />
      </div>
    </div>
  );
}
