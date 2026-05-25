/**
 * MetricasPage
 *
 * Main analytics dashboard page displaying all metrics.
 * Uses composition pattern with extracted components.
 */

import { useState } from 'react';
import { RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useMetricasDashboard, useRefreshMetricas } from './hooks/useMetricas';
import { METRIC_PERIOD, type MetricPeriod, type DateRange, type MetricsParams } from '@/types/metricas';
import { getPeriodLabel, formatDateRange } from './utils/formatters';
import { getApiErrorMessage } from '@/api/client';
import { useFlujos } from '@/features/flujos/hooks/useFlujos';
import { FlujoSelector } from '@/features/flujos/components/FlujosFilters/FlujoSelector';
import {
  KpiSummary,
  PeriodSelector,
  EnviosChart,
  AperturasChart,
  TopFlujosTable,
  NuevosProspectosChart,
  EnviosHoyCard,
  ProblemasEnvioCard,
  ReconciliacionSysgalCard,
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
  selectedFlujoId,
  onFlujoChange,
  flujos,
  isLoadingFlujos,
  flujoNombre,
}: {
  period: MetricPeriod;
  onPeriodChange: (value: MetricPeriod) => void;
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  selectedFlujoId: number | null;
  onFlujoChange: (id: number | null) => void;
  flujos: { id: number; nombre: string }[];
  isLoadingFlujos: boolean;
  flujoNombre?: string;
}) {
  // Show formatted date range when both bounds are set; otherwise show preset label
  const periodDisplay =
    dateRange?.from && dateRange?.to
      ? formatDateRange(dateRange.from, dateRange.to)
      : getPeriodLabel(period);

  const subtitle = flujoNombre
    ? `${flujoNombre} · ${periodDisplay}`
    : `Resumen de rendimiento · ${periodDisplay}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Métricas y Analytics</h1>
          <p className="text-muted-foreground mt-1">{subtitle}</p>
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
      <div className="max-w-md">
        <FlujoSelector
          selectedId={selectedFlujoId}
          flujos={flujos as any}
          onChange={onFlujoChange}
          isLoading={isLoadingFlujos}
        />
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
  const [period, setPeriod] = useState<MetricPeriod>(METRIC_PERIOD.TODAY);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedFlujoId, setSelectedFlujoId] = useState<number | null>(null);

  // Cargar lista de flujos para el selector
  const { data: flujosResponse, isLoading: isLoadingFlujos } = useFlujos({ per_page: 100 });
  const flujosList = flujosResponse?.data ?? [];
  const flujoNombre = selectedFlujoId
    ? flujosList.find((f) => f.id === selectedFlujoId)?.nombre
    : undefined;

  // Build MetricsParams based on period selection + flujo selection.
  // Custom date range takes precedence over dias when both from/to are set.
  const baseParams: MetricsParams =
    dateRange?.from && dateRange?.to
      ? {
          fecha_inicio: toISODateString(dateRange.from),
          fecha_fin: toISODateString(dateRange.to),
        }
      : { dias: period };

  const metricsParams: MetricsParams =
    selectedFlujoId !== null
      ? { ...baseParams, flujo_id: selectedFlujoId }
      : baseParams;

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
    selectedFlujoId,
    onFlujoChange: setSelectedFlujoId,
    flujos: flujosList,
    isLoadingFlujos,
    flujoNombre,
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
      <KpiSummary
        summary={dashboard.resumen}
        trends={dashboard.tendencias}
        clientesIngresados={dashboard.clientes_ingresados}
        porFlujo={selectedFlujoId !== null}
      />

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <EnviosChart data={dashboard.envios.por_dia} />
        <AperturasChart data={dashboard.aperturas.por_dia} />
      </div>

      {/* Envíos de hoy con fallback histórico — solo cuando hay flujo seleccionado */}
      {selectedFlujoId !== null && dashboard.envios_hoy && (
        <EnviosHoyCard data={dashboard.envios_hoy} />
      )}

      {/* Incorporados a campañas: SOLO sin flujo seleccionado. Con un flujo elegido, el KPI
          "Clientes ingresados" ya muestra ese número por flujo, así que evitamos el duplicado. */}
      {selectedFlujoId === null && dashboard.nuevos_prospectos && (
        <NuevosProspectosChart data={dashboard.nuevos_prospectos} />
      )}

      {/* Prospectos con datos que impiden el envío (calidad de dato del origen / SYSGAL) */}
      {dashboard.problemas_envio && (
        <ProblemasEnvioCard data={dashboard.problemas_envio} />
      )}

      {/* Reconciliación SYSGAL ↔ ingresados (GLOBAL, mes en curso): garantiza que no se escape ningún contrato */}
      <ReconciliacionSysgalCard data={dashboard.reconciliacion_sysgal} />

      {/* Top Flujos: solo cuando no hay filtro de flujo seleccionado */}
      {selectedFlujoId === null && <TopFlujosTable flujos={dashboard.top_flujos} />}

      {/* Footer with generation time */}
      <p className="text-xs text-muted-foreground text-right">
        Datos generados: {new Date(dashboard.generado_at).toLocaleString('es-CL')}
      </p>
    </div>
  );
}

export default MetricasPage;
