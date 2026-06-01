/**
 * MetricasPage
 *
 * Main analytics dashboard page displaying all metrics.
 * Uses composition pattern with extracted components.
 */

import { useState } from 'react';
import { RefreshCw, AlertCircle, Loader2, Info, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useMetricasDashboard, useRefreshMetricas } from './hooks/useMetricas';
import { METRIC_PERIOD, type MetricPeriod, type DateRange, type MetricsParams } from '@/types/metricas';
import type { FlujoNurturing } from '@/types/flujo';
import { getPeriodLabel, formatDateRange } from './utils/formatters';
import { getApiErrorMessage } from '@/api/client';
import { useFlujos } from '@/features/flujos/hooks/useFlujos';
import {
  useBatchExecutionState,
  getFlowExecutionState,
} from '@/features/flujos/hooks/useBatchExecutionState';
import { FlujoSelector } from '@/features/flujos/components/FlujosFilters/FlujoSelector';
import { DatePicker } from '@/components/ui/date-picker';
import {
  KpiSummary,
  PeriodSelector,
  EnviosChart,
  AperturasChart,
  EnviosHoyCard,
  ProblemasEnvioCard,
  EmbudoCampana,
  EmbudosPorEtapa,
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
  esOnboarding,
  onboardingDia,
  onOnboardingDiaChange,
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
  esOnboarding: boolean;
  onboardingDia: Date;
  onOnboardingDiaChange: (date: Date) => void;
}) {
  // Onboarding muestra un día único; el resto, rango/preset.
  const periodDisplay = esOnboarding
    ? onboardingDia.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
    : dateRange?.from && dateRange?.to
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
          {esOnboarding ? (
            // Onboarding: se elige UN día de contacto (el −3 a ingresos es automático).
            <DatePicker
              date={onboardingDia}
              onDateChange={(d) => d && onOnboardingDiaChange(d)}
              placeholder="Elige el día"
              dateFormat="PPP"
              toDate={new Date()}
              className="w-[240px]"
            />
          ) : (
            <PeriodSelector
              value={period}
              onChange={onPeriodChange}
              dateRange={dateRange}
              onDateRangeChange={onDateRangeChange}
            />
          )}
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

/**
 * Suma (o resta, con días negativos) días a una fecha ISO (YYYY-MM-DD).
 * Usa mediodía UTC para ser inmune a zonas horarias / DST.
 */
function shiftISODate(iso: string, dias: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().split('T')[0];
}

/**
 * Último viernes (≤ hoy) y próximo viernes, formateados en es-CL.
 * Los flujos perpetuos se alimentan por batch los viernes (routes/console.php → weeklyOn(5)).
 */
function viernesBatch(): { ultimo: string; proximo: string } {
  const hoy = new Date();
  const diasDesdeViernes = (hoy.getDay() - 5 + 7) % 7; // getDay(): 0=domingo … 5=viernes
  const ultimo = new Date(hoy);
  ultimo.setDate(hoy.getDate() - diasDesdeViernes);
  const proximo = new Date(ultimo);
  proximo.setDate(ultimo.getDate() + 7);
  const fmt = (d: Date) => d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });
  return { ultimo: fmt(ultimo), proximo: fmt(proximo) };
}

/**
 * ¿El flujo se alimenta por batch SEMANAL (viernes)? Solo los SEGMENTO, que son perpetuos Y asignan
 * por nivel_deuda (nivel_deuda_target seteado). Contratos/Onboarding son perpetuos pero con feed
 * CONTINUO (cada hora vía auto_asignar_nuevos), así que NO deben mostrar el banner de "viernes".
 */
function esBatchSemanal(flujo: FlujoNurturing | undefined): boolean {
  return !!(
    flujo?.es_perpetuo &&
    Array.isArray(flujo.nivel_deuda_target) &&
    flujo.nivel_deuda_target.length > 0
  );
}

export function MetricasPage() {
  const [period, setPeriod] = useState<MetricPeriod>(METRIC_PERIOD.TODAY);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedFlujoId, setSelectedFlujoId] = useState<number | null>(null);
  // Onboarding (Clientes por Fecha Ingreso): se elige UN día de contacto, no un rango.
  const [onboardingDia, setOnboardingDia] = useState<Date>(() => new Date());

  // Cargar lista de flujos para el selector
  const { data: flujosResponse, isLoading: isLoadingFlujos } = useFlujos({ per_page: 100 });
  const flujosList = flujosResponse?.data ?? [];

  // Estado de ejecución (batch) para filtrar el selector. Mismo criterio que la tabla de Flujos:
  // mostramos solo flujos perpetuos o en ejecución (in_progress/paused). Los completados no aportan
  // métricas accionables, así que se ocultan. Sin polling: al dashboard no le hace falta tiempo real.
  const flujoIds = flujosList.map((f) => f.id);
  const { data: estadosEjecucion, isLoading: isLoadingEstados } = useBatchExecutionState(
    flujoIds,
    false,
  );
  // Mientras carga el estado no escondemos nada (evita parpadeo); una vez cargado, filtramos.
  const flujosVisibles = isLoadingEstados
    ? flujosList
    : flujosList.filter((flujo) => {
        if (flujo.es_perpetuo) return true;
        const estado = getFlowExecutionState(estadosEjecucion, flujo.id).ejecucion?.estado;
        return estado === 'in_progress' || estado === 'paused';
      });

  const selectedFlujo = selectedFlujoId
    ? flujosList.find((f) => f.id === selectedFlujoId)
    : undefined;
  const flujoNombre = selectedFlujo?.nombre;
  // Batch semanal (viernes) SOLO para los SEGMENTO (perpetuo + nivel_deuda_target). Esto decide el
  // banner de "viernes" y el período default. Contratos/Onboarding son perpetuos pero feed continuo.
  const esBatchSemanalSel = esBatchSemanal(selectedFlujo);

  // SYSGAL por rango: el "tipo" depende del flujo SYSGAL seleccionado.
  // null = el flujo no es de SYSGAL (no se muestra la tarjeta).
  const sysgalTipo: 'contratos' | 'clientes-ingreso' | null = flujoNombre
    ?.toLowerCase()
    .includes('fecha ingreso')
    ? 'clientes-ingreso'
    : flujoNombre?.toLowerCase().includes('contratos')
      ? 'contratos'
      : null;

  const esOnboarding = sysgalTipo === 'clientes-ingreso';

  // Ventana de CONTACTO (a quién mira la campaña):
  // - Onboarding → UN solo día (onboardingDia).
  // - Otros flujos → el rango del datepicker o la ventana del período.
  const contactoRange = (() => {
    if (esOnboarding) {
      const iso = toISODateString(onboardingDia);
      return { desde: iso, hasta: iso };
    }
    if (dateRange?.from && dateRange?.to) {
      return { desde: toISODateString(dateRange.from), hasta: toISODateString(dateRange.to) };
    }
    const hasta = new Date();
    const desde = new Date();
    desde.setDate(desde.getDate() - Math.max(period - 1, 0));
    return { desde: toISODateString(desde), hasta: toISODateString(hasta) };
  })();

  // Onboarding: la campaña contacta EXACTAMENTE a los 3 días de ingresar (un solo día). El sync
  // corre los 7 días y trae solo la cohorte del día-3 exacto. Por eso a SYSGAL se le consulta ese
  // único día (día-3) y cuadra con los que entraron. Si ese día no ingresó nadie, SYSGAL = 0 (correcto).
  // Contratos: sin corrimiento (la ventana de contacto = la ventana consultada).
  const sysgalRange = esOnboarding
    ? {
        desde: shiftISODate(contactoRange.desde, -3),
        hasta: shiftISODate(contactoRange.hasta, -3),
      }
    : contactoRange;

  // Build MetricsParams. Onboarding usa el día de contacto (un día); el resto, rango o período.
  const baseParams: MetricsParams = esOnboarding
    ? {
        fecha_inicio: toISODateString(onboardingDia),
        fecha_fin: toISODateString(onboardingDia),
      }
    : dateRange?.from && dateRange?.to
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
  } = useMetricasDashboard(metricsParams, { enabled: selectedFlujoId !== null });

  const refreshMutation = useRefreshMetricas();

  const handleRefresh = () => {
    // Reset de los filtros de fecha al estado inicial (mantiene el flujo seleccionado) + datos frescos.
    setPeriod(METRIC_PERIOD.TODAY);
    setDateRange(undefined);
    setOnboardingDia(new Date());
    refreshMutation.mutate(undefined, {
      onSuccess: () => refetch(),
    });
  };

  // Solo los flujos de batch semanal (SEGMENTO) arrancan en "últimos 7 días", para que "Incorporados
  // al flujo" muestre el batch del viernes en lugar de 0. El resto (continuos/normales) arranca en "Hoy".
  const handleFlujoChange = (id: number | null) => {
    setSelectedFlujoId(id);
    setDateRange(undefined);
    const flujo = id ? flujosList.find((f) => f.id === id) : undefined;
    setPeriod(esBatchSemanal(flujo) ? METRIC_PERIOD.WEEK : METRIC_PERIOD.TODAY);
  };

  // Common PageHeader props
  const pageHeaderProps = {
    period,
    onPeriodChange: setPeriod,
    dateRange,
    onDateRangeChange: setDateRange,
    onRefresh: handleRefresh,
    selectedFlujoId,
    onFlujoChange: handleFlujoChange,
    flujos: flujosVisibles,
    isLoadingFlujos,
    flujoNombre,
    esOnboarding,
    onboardingDia,
    onOnboardingDiaChange: setOnboardingDia,
  };

  // Sin flujo seleccionado: pantalla de selección. No se traen métricas globales (el dashboard
  // arranca por flujo). El usuario elige un flujo en el desplegable de arriba.
  if (selectedFlujoId === null) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader {...pageHeaderProps} isRefreshing={false} />
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-center">
          <LayoutDashboard className="h-10 w-10 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Elige un flujo para ver sus métricas</h2>
          <p className="max-w-md text-muted-foreground">
            Seleccione un flujo en el desplegable de arriba. Las métricas y el dato de SYSGAL se
            muestran por flujo.
          </p>
        </div>
      </div>
    );
  }

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
  const { ultimo: ultimoViernes, proximo: proximoViernes } = viernesBatch();
  return (
    <div className="p-6 space-y-6">
      <PageHeader {...pageHeaderProps} isRefreshing={refreshMutation.isPending} />

      {/* Batch semanal (SEGMENTO): los clientes ingresan los viernes. Entre un viernes y otro,
          "Incorporados al flujo" puede ser 0 — es esperado; la actividad diaria está en los Envíos. */}
      {esBatchSemanalSel && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>♾️ Flujo perpetuo · cómo leerlo</AlertTitle>
          <AlertDescription className="mt-1 text-sm">
            Los clientes ingresan en un <strong>batch semanal (todos los viernes)</strong>. El último
            ingreso fue el <strong>viernes {ultimoViernes}</strong> y el próximo es el{' '}
            <strong>viernes {proximoViernes}</strong>. Por eso, entre un viernes y otro,{' '}
            <strong>"Incorporados al flujo" puede mostrar 0</strong> — es normal. La actividad de cada
            día está en los <strong>Envíos</strong>, que procesan ese batch de a poco.
          </AlertDescription>
        </Alert>
      )}

      {/* Resumen de la campaña como EMBUDO (solo flujos SYSGAL): SYSGAL → Entraron → Recibieron →
          Abrieron. Reemplaza la tarjeta de SYSGAL + las notas: cada número sale del anterior y la
          diferencia se explica sola, así no parece inconsistente. */}
      {sysgalTipo && (
        <EmbudoCampana
          tipo={sysgalTipo}
          desde={sysgalRange.desde}
          hasta={sysgalRange.hasta}
          contacto={esOnboarding ? contactoRange : undefined}
          esOnboarding={esOnboarding}
          incorporados={dashboard.embudo?.entraron ?? 0}
          recibieron={dashboard.embudo?.recibieron ?? 0}
          recibieronEmail={dashboard.embudo?.recibieron_email ?? 0}
          recibieronSms={dashboard.embudo?.recibieron_sms ?? 0}
          aperturasUnicas={dashboard.embudo?.abrieron ?? 0}
          tasaApertura={
            dashboard.embudo && dashboard.embudo.recibieron > 0
              ? Math.round((dashboard.embudo.abrieron / dashboard.embudo.recibieron) * 1000) / 10
              : 0
          }
        />
      )}

      {/* Embudos POR ETAPA — para cualquier flujo perpetuo con más de un nodo. El backend
          decide si lo devuelve (es_perpetuo + stages >= 2). Clientes-Ingreso es el caso
          especial con anchor SYSGAL: muestra la columna SYSGAL y permite expandir la fila
          para ver quiénes no entraron. Otros flujos perpetuos usan fecha_inicio como anchor
          y la tabla queda sin la columna SYSGAL. */}
      {dashboard.embudos_por_etapa && dashboard.embudos_por_etapa.length > 0 && (
        <EmbudosPorEtapa etapas={dashboard.embudos_por_etapa} />
      )}

      {/* KPI Summary Cards */}
      {/* En flujos SYSGAL (con embudo), las tasas de abajo se computan de la COHORTE para que
          cuadren con el embudo (no del período, que con 0 envíos hoy daba "Tasa Entrega 0%" aunque
          la cohorte hubiera recibido todo). En flujos no-SYSGAL, queda el cálculo original. */}
      <KpiSummary
        summary={
          sysgalTipo && dashboard.embudo
            ? {
                ...dashboard.resumen,
                total_envios: dashboard.embudo.recibieron,
                envios_exitosos: dashboard.embudo.recibieron,
                aperturas_unicas: dashboard.embudo.abrieron,
                total_aperturas: dashboard.embudo.abrieron,
                clicks_unicos: dashboard.embudo.clickaron,
                total_clicks: dashboard.embudo.clickaron,
                desuscripciones: dashboard.embudo.desuscribieron,
                tasas: {
                  entrega: dashboard.embudo.tasa_entrega,
                  apertura: dashboard.embudo.tasa_apertura,
                  click: dashboard.embudo.tasa_ctr,
                  ctr: dashboard.embudo.tasa_ctr,
                  desuscripcion: dashboard.embudo.tasa_desuscripcion,
                },
              }
            : dashboard.resumen
        }
        trends={sysgalTipo ? undefined : dashboard.tendencias}
        clientesIngresados={dashboard.clientes_ingresados}
        porFlujo={selectedFlujoId !== null}
        soloTasas={sysgalTipo !== null}
      />

      {/* Charts Grid — ocultos en flujos SYSGAL: el embudo de arriba ya muestra lo mismo
          filtrado a la cohorte exacta del día. Para no-SYSGAL siguen visibles. */}
      {sysgalTipo === null && (
        <div className="grid gap-6 lg:grid-cols-2">
          <EnviosChart data={dashboard.envios.por_dia} />
          <AperturasChart data={dashboard.aperturas.por_dia} />
        </div>
      )}

      {/* Envíos de hoy con fallback histórico — solo cuando hay flujo seleccionado y NO es
          flujo SYSGAL. Para SYSGAL, el embudo de arriba ya muestra el total de la cohorte; este
          panel sería redundante y confuso (mostraría un número distinto por filtrar por día). */}
      {selectedFlujoId !== null && sysgalTipo === null && dashboard.envios_hoy && (
        <EnviosHoyCard data={dashboard.envios_hoy} />
      )}

      {/* Prospectos con datos que impiden el envío (calidad de dato del origen / SYSGAL) */}
      {dashboard.problemas_envio && (
        <ProblemasEnvioCard data={dashboard.problemas_envio} />
      )}

      {/* Footer with generation time */}
      <p className="text-xs text-muted-foreground text-right">
        Datos generados: {new Date(dashboard.generado_at).toLocaleString('es-CL')}
      </p>
    </div>
  );
}

export default MetricasPage;
