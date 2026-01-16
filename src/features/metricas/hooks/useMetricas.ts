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
import type { MetricPeriod } from '@/types/metricas';

// ============================================================
// QUERY KEYS
// ============================================================

const QUERY_KEYS = {
  base: ['metricas'] as const,
  dashboard: (dias: MetricPeriod) => [...QUERY_KEYS.base, 'dashboard', dias] as const,
  resumen: (dias: MetricPeriod) => [...QUERY_KEYS.base, 'resumen', dias] as const,
  aperturas: (dias: MetricPeriod) => [...QUERY_KEYS.base, 'aperturas', dias] as const,
  clicks: (dias: MetricPeriod) => [...QUERY_KEYS.base, 'clicks', dias] as const,
  envios: (dias: MetricPeriod) => [...QUERY_KEYS.base, 'envios', dias] as const,
  desuscripciones: (dias: MetricPeriod) => [...QUERY_KEYS.base, 'desuscripciones', dias] as const,
  conversiones: (dias: MetricPeriod) => [...QUERY_KEYS.base, 'conversiones', dias] as const,
  tendencias: (dias: MetricPeriod) => [...QUERY_KEYS.base, 'tendencias', dias] as const,
  topFlujos: (dias: MetricPeriod, limit: number) =>
    [...QUERY_KEYS.base, 'top-flujos', dias, limit] as const,
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
 * @param dias - Period in days (default: 30)
 * @returns Query result with full dashboard data
 */
export function useMetricasDashboard(dias: MetricPeriod = 30) {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard(dias),
    queryFn: () => metricasService.getDashboard(dias),
    staleTime: STALE_TIME.DASHBOARD,
  });
}

// ============================================================
// INDIVIDUAL SECTION HOOKS
// ============================================================

/**
 * Fetches KPI summary metrics
 */
export function useMetricasResumen(dias: MetricPeriod = 30) {
  return useQuery({
    queryKey: QUERY_KEYS.resumen(dias),
    queryFn: () => metricasService.getResumen(dias),
    staleTime: STALE_TIME.SECTION,
  });
}

/**
 * Fetches email open metrics
 */
export function useMetricasAperturas(dias: MetricPeriod = 30) {
  return useQuery({
    queryKey: QUERY_KEYS.aperturas(dias),
    queryFn: () => metricasService.getAperturas(dias),
    staleTime: STALE_TIME.SECTION,
  });
}

/**
 * Fetches click metrics
 */
export function useMetricasClicks(dias: MetricPeriod = 30) {
  return useQuery({
    queryKey: QUERY_KEYS.clicks(dias),
    queryFn: () => metricasService.getClicks(dias),
    staleTime: STALE_TIME.SECTION,
  });
}

/**
 * Fetches send/delivery metrics
 */
export function useMetricasEnvios(dias: MetricPeriod = 30) {
  return useQuery({
    queryKey: QUERY_KEYS.envios(dias),
    queryFn: () => metricasService.getEnvios(dias),
    staleTime: STALE_TIME.SECTION,
  });
}

/**
 * Fetches unsubscribe metrics
 */
export function useMetricasDesuscripciones(dias: MetricPeriod = 30) {
  return useQuery({
    queryKey: QUERY_KEYS.desuscripciones(dias),
    queryFn: () => metricasService.getDesuscripciones(dias),
    staleTime: STALE_TIME.SECTION,
  });
}

/**
 * Fetches conversion metrics
 */
export function useMetricasConversiones(dias: MetricPeriod = 30) {
  return useQuery({
    queryKey: QUERY_KEYS.conversiones(dias),
    queryFn: () => metricasService.getConversiones(dias),
    staleTime: STALE_TIME.SECTION,
  });
}

/**
 * Fetches trend comparison data
 */
export function useMetricasTendencias(dias: MetricPeriod = 30) {
  return useQuery({
    queryKey: QUERY_KEYS.tendencias(dias),
    queryFn: () => metricasService.getTendencias(dias),
    staleTime: STALE_TIME.TRENDS,
  });
}

/**
 * Fetches top performing flows
 */
export function useMetricasTopFlujos(dias: MetricPeriod = 30, limit = 10) {
  return useQuery({
    queryKey: QUERY_KEYS.topFlujos(dias, limit),
    queryFn: () => metricasService.getTopFlujos(dias, limit),
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
