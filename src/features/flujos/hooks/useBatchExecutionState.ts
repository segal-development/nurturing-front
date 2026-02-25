/**
 * Hook for batch fetching execution state of multiple flows.
 *
 * PERFORMANCE OPTIMIZATION:
 * - Before: 15 flows = 45 requests (3 per flow: active, latest, detail)
 * - After: 15 flows = 1 request
 *
 * This hook fetches execution state for all visible flows in a single API call,
 * dramatically reducing network overhead and improving table render performance.
 */

import { useQuery } from '@tanstack/react-query';
import {
  flowExecutionTrackingService,
  type BatchExecutionState,
} from '@/api/flowExecutionTracking.service';

const POLLING_INTERVAL = 5000; // 5 seconds (less aggressive since it's batch)

/**
 * Hook to get execution state for multiple flows in one request.
 *
 * @param flujoIds - Array of flow IDs to fetch state for
 * @param enablePolling - Enable/disable auto-polling (default: true)
 * @returns Map of flujoId -> execution state
 *
 * @example
 * const flujoIds = flujos.map(f => f.id)
 * const { data, isLoading } = useBatchExecutionState(flujoIds)
 *
 * // Access individual flow state:
 * const state = data?.[flujoId]
 * if (state?.tiene_ejecucion_activa) {
 *   console.log('Flow is executing:', state.ejecucion)
 * }
 */
export function useBatchExecutionState(
  flujoIds: number[],
  enablePolling: boolean = true
) {
  return useQuery({
    queryKey: ['batchExecutionState', flujoIds.sort().join(',')],
    queryFn: async () => {
      const response = await flowExecutionTrackingService.getBatchExecutionState(flujoIds);
      return response.data;
    },
    refetchInterval: enablePolling ? POLLING_INTERVAL : false,
    staleTime: 2000,
    enabled: flujoIds.length > 0,
  });
}

/**
 * Helper to get execution state for a single flow from batch data.
 * Returns a default "no execution" state if not found.
 */
export function getFlowExecutionState(
  batchData: Record<number, BatchExecutionState> | undefined,
  flujoId: number
): BatchExecutionState {
  if (!batchData || !batchData[flujoId]) {
    return {
      tiene_ejecucion: false,
      tiene_ejecucion_activa: false,
      puede_ejecutar: true,
      ejecucion: null,
    };
  }
  return batchData[flujoId];
}

export type { BatchExecutionState };
