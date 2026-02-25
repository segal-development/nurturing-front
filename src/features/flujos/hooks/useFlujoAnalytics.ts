/**
 * Hook for fetching comprehensive flujo analytics.
 * 
 * Returns funnel metrics, conversion rates, costs, and per-stage breakdown.
 */

import { useQuery } from '@tanstack/react-query'
import { flujosService, type FlujoAnalytics } from '@/api/flujos.service'

/**
 * Fetch comprehensive analytics for a flujo.
 * 
 * @param flujoId - ID of the flujo
 * @param enabled - Whether to enable the query (default: true)
 * @returns Query result with analytics data
 * 
 * @example
 * const { data: analytics, isLoading } = useFlujoAnalytics(flujoId)
 * console.log(analytics?.resumen.tasa_apertura) // 45.2
 * console.log(analytics?.funnel.conversiones) // 12
 */
export function useFlujoAnalytics(flujoId: number | undefined, enabled = true) {
  return useQuery({
    queryKey: ['flujoAnalytics', flujoId],
    queryFn: async () => {
      if (!flujoId) throw new Error('flujoId is required')
      return flujosService.getAnalytics(flujoId)
    },
    enabled: enabled && !!flujoId,
    staleTime: 60000, // 1 minute - analytics don't change frequently
  })
}

export type { FlujoAnalytics }
