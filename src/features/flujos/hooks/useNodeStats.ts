/**
 * Hook for fetching node statistics for a flujo.
 * 
 * Returns aggregated send statistics (sent, opened, clicked, failed)
 * across all executions for each node in the flow.
 */

import { useQuery } from '@tanstack/react-query'
import { flujosService, type NodeStats } from '@/api/flujos.service'

/**
 * Fetch node statistics for a flujo.
 * 
 * @param flujoId - ID of the flujo
 * @param enabled - Whether to enable the query (default: true)
 * @returns Query result with node stats mapped by node_id
 * 
 * @example
 * const { data: nodeStats, isLoading } = useNodeStats(flujoId)
 * const stats = nodeStats?.['stage-1']
 * console.log(stats?.total_enviado, stats?.total_abierto)
 */
export function useNodeStats(flujoId: number | undefined, enabled = true) {
  return useQuery({
    queryKey: ['nodeStats', flujoId],
    queryFn: async () => {
      if (!flujoId) return {}
      const stats = await flujosService.getNodeStats(flujoId)
      // Convert array to map for easy access by node_id
      return stats.reduce((acc, stat) => {
        acc[stat.node_id] = stat
        return acc
      }, {} as Record<string, NodeStats>)
    },
    enabled: enabled && !!flujoId,
    staleTime: 30000, // 30 seconds - stats don't change frequently
  })
}

export type { NodeStats }
