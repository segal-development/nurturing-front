/**
 * MetricasPage
 *
 * Main analytics dashboard page displaying all metrics.
 * Uses composition pattern with extracted components.
 */

import { useState, useMemo } from 'react';
import { RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useMetricasDashboard, useRefreshMetricas } from './hooks/useMetricas';
import { METRIC_PERIOD, type MetricPeriod, type DateRange, type MetricsParams } from '@/types/metricas';
import { getPeriodLabel, formatDateRange } from './utils/formatters';
import { getApiErrorMessage } from '@/api/client';
import {
  KpiSummary,
  PeriodSelector,
  EnviosChart,
  AperturasChart,
  TopFlujosTable,
} from './components';

// ============================================================
// SUB-COMPONENTS
// ============================================================

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-segal-blue dark:text-segal-turquoise" />
      <p className="text-muted-foreground">Cargando métricas...</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error al cargar métricas</AlertTitle>
      <AlertDescription className="mt-2">
        <p>{message}</p>
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </AlertDescription>
    </Alert>
  );
}

function PageHeader({
  period,
  onPeriodChange,
  dateRange,
  onDateRangeChange,
  onRefresh,
  isRefreshing,
}: {
  period: MetricPeriod;
  onPeriodChange: (value: MetricPeriod) => void;
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  // Display period label or custom date range
  const periodDisplay =
    period === METRIC_PERIOD.CUSTOM && dateRange?.from && dateRange?.to
      ? formatDateRange(dateRange.from, dateRange.to)
      : getPeriodLabel(period);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Métricas y Analytics</h1>
        <p className="text-muted-foreground mt-1">Resumen de rendimiento - {periodDisplay}</p>
      </div>
      <div className="flex items-center gap-3">
        <PeriodSelector
          value={period}
          onChange={onPeriodChange}
          dateRange={dateRange}
          onDateRangeChange={onDateRangeChange}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Actualizar datos"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

/**
 * Converts Date to ISO date string (YYYY-MM-DD)
 */
function toISODateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function MetricasPage() {
  const [period, setPeriod] = useState<MetricPeriod>(METRIC_PERIOD.MONTH);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Build MetricsParams based on period selection
  const metricsParams = useMemo<MetricsParams>(() => {
    if (period === METRIC_PERIOD.CUSTOM && dateRange?.from && dateRange?.to) {
      return {
        fecha_inicio: toISODateString(dateRange.from),
        fecha_fin: toISODateString(dateRange.to),
      };
    }
    return { dias: period };
  }, [period, dateRange]);

  const {
    data: dashboard,
    isLoading,
    error,
    refetch,
  } = useMetricasDashboard(metricsParams);

  const refreshMutation = useRefreshMetricas();

  const handleRefresh = () => {
    refreshMutation.mutate(undefined, {
      onSuccess: () => refetch(),
    });
  };

  // Common PageHeader props
  const pageHeaderProps = {
    period,
    onPeriodChange: setPeriod,
    dateRange,
    onDateRangeChange: setDateRange,
    onRefresh: handleRefresh,
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <PageHeader {...pageHeaderProps} isRefreshing={false} />
        <LoadingState />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <PageHeader {...pageHeaderProps} isRefreshing={false} />
        <ErrorState
          message={getApiErrorMessage(error, 'No se pudieron cargar las métricas')}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // No data state
  if (!dashboard) {
    return (
      <div className="p-6">
        <PageHeader {...pageHeaderProps} isRefreshing={false} />
        <div className="text-center py-12 text-muted-foreground">
          No hay datos disponibles para el período seleccionado
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="p-6 space-y-6">
      <PageHeader {...pageHeaderProps} isRefreshing={refreshMutation.isPending} />

      {/* KPI Summary Cards */}
      <KpiSummary summary={dashboard.resumen} trends={dashboard.tendencias} />

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <EnviosChart data={dashboard.envios.por_dia} />
        <AperturasChart data={dashboard.aperturas.por_dia} />
      </div>

      {/* Top Flujos */}
      <TopFlujosTable flujos={dashboard.top_flujos} />

      {/* Footer with generation time */}
      <p className="text-xs text-muted-foreground text-right">
        Datos generados: {new Date(dashboard.generado_at).toLocaleString('es-CL')}
      </p>
    </div>
  );
}

export default MetricasPage;
