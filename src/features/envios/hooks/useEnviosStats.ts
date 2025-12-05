/**
 * Hooks for fetching Envios statistics
 *
 * Provides three main hooks:
 * - useEnviosDailyStats: Daily statistics for a date range
 * - useEnviosTodayStats: Today's summary with auto-refresh option
 * - useEnviosFlowStats: Statistics grouped by flow
 */

import { useQuery } from '@tanstack/react-query'
import { enviosService } from '@/api/envios.service'

/**
 * Hook to fetch daily statistics for a date range
 *
 * @param fechaInicio - Start date (YYYY-MM-DD)
 * @param fechaFin - End date (YYYY-MM-DD)
 * @returns Query result with daily statistics
 *
 * @example
 * const { data, isLoading, isError } = useEnviosDailyStats('2025-01-01', '2025-01-31')
 */
export function useEnviosDailyStats(fechaInicio: string, fechaFin: string) {
  return useQuery({
    queryKey: ['envios', 'daily-stats', fechaInicio, fechaFin],
    queryFn: () => enviosService.getDailyStats(fechaInicio, fechaFin),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to fetch today's statistics with optional auto-refresh
 *
 * @param options - Configuration options
 * @param options.refetchInterval - Auto-refresh interval in ms (optional)
 * @returns Query result with today's statistics
 *
 * @example
 * // Without auto-refresh
 * const { data: todayStats } = useEnviosTodayStats()
 *
 * @example
 * // With auto-refresh every 30 seconds
 * const { data: todayStats } = useEnviosTodayStats({ refetchInterval: 30000 })
 */
export function useEnviosTodayStats(options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ['envios', 'today-stats'],
    queryFn: () => enviosService.getTodayStats(),
    staleTime: 1 * 60 * 1000, // 1 minute (fresh data for today)
    refetchInterval: options?.refetchInterval,
  })
}

/**
 * Hook to fetch statistics grouped by flow
 *
 * @param fechaInicio - Start date (YYYY-MM-DD)
 * @param fechaFin - End date (YYYY-MM-DD)
 * @returns Query result with flow statistics
 *
 * @example
 * const { data, isLoading } = useEnviosFlowStats('2025-01-01', '2025-01-31')
 */
export function useEnviosFlowStats(fechaInicio: string, fechaFin: string) {
  return useQuery({
    queryKey: ['envios', 'flow-stats', fechaInicio, fechaFin],
    queryFn: () => enviosService.getFlowStats(fechaInicio, fechaFin),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
