/**
 * React Query hooks for metrics data fetching
 *
 * Follows Single Responsibility Principle - each hook handles one data concern.
 * Uses React Query for caching, background refetching, and error handling.
 *
 * @example
 * const { data, isLoading, error } = useMetricasDashboard(30);
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { metricasService } from '@/api/metricas.service';
import type { MetricsParams } from '@/types/metricas';

// ============================================================
// QUERY KEYS
// ============================================================

/**
 * Creates a stable key for the metrics params
 */
function paramsToKey(params: MetricsParams): string {
  if (params.fecha_inicio && params.fecha_fin) {
    return `custom:${params.fecha_inicio}:${params.fecha_fin}`;
  }
  return `dias:${params.dias ?? 30}`;
}

const QUERY_KEYS = {
  base: ['metricas'] as const,
  dashboard: (params: MetricsParams) => [...QUERY_KEYS.base, 'dashboard', paramsToKey(params)] as const,
  resumen: (params: MetricsParams) => [...QUERY_KEYS.base, 'resumen', paramsToKey(params)] as const,
  aperturas: (params: MetricsParams) => [...QUERY_KEYS.base, 'aperturas', paramsToKey(params)] as const,
  clicks: (params: MetricsParams) => [...QUERY_KEYS.base, 'clicks', paramsToKey(params)] as const,
  envios: (params: MetricsParams) => [...QUERY_KEYS.base, 'envios', paramsToKey(params)] as const,
  desuscripciones: (params: MetricsParams) => [...QUERY_KEYS.base, 'desuscripciones', paramsToKey(params)] as const,
  conversiones: (params: MetricsParams) => [...QUERY_KEYS.base, 'conversiones', paramsToKey(params)] as const,
  tendencias: (params: MetricsParams) => [...QUERY_KEYS.base, 'tendencias', paramsToKey(params)] as const,
  topFlujos: (params: MetricsParams, limit: number) =>
    [...QUERY_KEYS.base, 'top-flujos', paramsToKey(params), limit] as const,
};

// ============================================================
// CACHE CONFIGURATION
// ============================================================

const STALE_TIME = {
  DASHBOARD: 5 * 60 * 1000, // 5 minutes - main dashboard
  SECTION: 3 * 60 * 1000, // 3 minutes - individual sections
  TRENDS: 10 * 60 * 1000, // 10 minutes - trends change slowly
};

// ============================================================
// MAIN DASHBOARD HOOK
// ============================================================

/**
 * Fetches the complete metrics dashboard
 *
 * @param params - Period in days or custom date range
 * @returns Query result with full dashboard data
 */
export function useMetricasDashboard(params: MetricsParams = { dias: 30 }) {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard(params),
    queryFn: () => metricasService.getDashboard(params),
    staleTime: STALE_TIME.DASHBOARD,
  });
}

// ============================================================
// INDIVIDUAL SECTION HOOKS
// ============================================================

/**
 * Fetches KPI summary metrics
 */
export function useMetricasResumen(params: MetricsParams = { dias: 30 }) {
  return useQuery({
    queryKey: QUERY_KEYS.resumen(params),
    queryFn: () => metricasService.getResumen(params),
    staleTime: STALE_TIME.SECTION,
  });
}

/**
 * Fetches email open metrics
 */
export function useMetricasAperturas(params: MetricsParams = { dias: 30 }) {
  return useQuery({
    queryKey: QUERY_KEYS.aperturas(params),
    queryFn: () => metricasService.getAperturas(params),
    staleTime: STALE_TIME.SECTION,
  });
}

/**
 * Fetches click metrics
 */
export function useMetricasClicks(params: MetricsParams = { dias: 30 }) {
  return useQuery({
    queryKey: QUERY_KEYS.clicks(params),
    queryFn: () => metricasService.getClicks(params),
    staleTime: STALE_TIME.SECTION,
  });
}

/**
 * Fetches send/delivery metrics
 */
export function useMetricasEnvios(params: MetricsParams = { dias: 30 }) {
  return useQuery({
    queryKey: QUERY_KEYS.envios(params),
    queryFn: () => metricasService.getEnvios(params),
    staleTime: STALE_TIME.SECTION,
  });
}

/**
 * Fetches unsubscribe metrics
 */
export function useMetricasDesuscripciones(params: MetricsParams = { dias: 30 }) {
  return useQuery({
    queryKey: QUERY_KEYS.desuscripciones(params),
    queryFn: () => metricasService.getDesuscripciones(params),
    staleTime: STALE_TIME.SECTION,
  });
}

/**
 * Fetches conversion metrics
 */
export function useMetricasConversiones(params: MetricsParams = { dias: 30 }) {
  return useQuery({
    queryKey: QUERY_KEYS.conversiones(params),
    queryFn: () => metricasService.getConversiones(params),
    staleTime: STALE_TIME.SECTION,
  });
}

/**
 * Fetches trend comparison data
 */
export function useMetricasTendencias(params: MetricsParams = { dias: 30 }) {
  return useQuery({
    queryKey: QUERY_KEYS.tendencias(params),
    queryFn: () => metricasService.getTendencias(params),
    staleTime: STALE_TIME.TRENDS,
  });
}

/**
 * Fetches top performing flows
 */
export function useMetricasTopFlujos(params: MetricsParams = { dias: 30 }, limit = 10) {
  return useQuery({
    queryKey: QUERY_KEYS.topFlujos(params, limit),
    queryFn: () => metricasService.getTopFlujos(params, limit),
    staleTime: STALE_TIME.SECTION,
  });
}

// ============================================================
// CACHE MANAGEMENT HOOK
// ============================================================

/**
 * Hook to refresh metrics cache
 */
export function useRefreshMetricas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => metricasService.refreshCache(),
    onSuccess: () => {
      // Invalidate all metrics queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.base });
    },
  });
}

// ============================================================
// EXPORT QUERY KEYS FOR EXTERNAL USE
// ============================================================

export { QUERY_KEYS as metricasQueryKeys };
