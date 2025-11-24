import { useQuery } from '@tanstack/react-query'
import { monitorApi, type MonitorStats } from '@/api/monitor'

/**
 * Query hook to fetch monitor statistics
 * Provides comprehensive dashboard data
 * Cached with shorter staleTime due to real-time nature of monitoring
 */
export function useMonitorStats() {
  return useQuery({
    queryKey: ['monitor', 'stats'],
    queryFn: () => monitorApi.getStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent updates for monitoring)
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 2 * 60 * 1000, // Auto-refetch every 2 minutes
  })
}

/**
 * Selector for monitor stats - get just active flows count
 */
export function selectFlujosActivos(stats: MonitorStats | undefined): number {
  return stats?.flujosActivos ?? 0
}

/**
 * Selector for monitor stats - get just active offers count
 */
export function selectOfertasActivas(stats: MonitorStats | undefined): number {
  return stats?.ofertasActivas ?? 0
}

/**
 * Selector for monitor stats - get delivery rate
 */
export function selectTasaEntrega(stats: MonitorStats | undefined): string {
  return stats?.tasaEntrega ?? '0'
}

/**
 * Selector for monitor stats - get prospects by flow type
 */
export function selectFlujosPorTipo(
  stats: MonitorStats | undefined
): Record<string, number> {
  return stats?.flujosPorTipo ?? {}
}
