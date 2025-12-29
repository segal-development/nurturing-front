/**
 * Hooks for real-time flow execution monitoring
 *
 * Features:
 * - useFlowExecution: Auto-polling status updates
 * - useExecutionEvents: Stream of execution events
 * - useExecutionMetrics: Current execution metrics
 * - useStartFlowExecution: Mutation for starting execution
 * - useCancelFlowExecution: Mutation for canceling execution
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { ExecutionEvent, ExecutionMetrics, StartFlowExecutionPayload } from '@/types/flowExecution'
import { flowExecutionService } from '@/api/flowExecution.service'

const POLLING_INTERVAL = 2000 // 2 segundos

/**
 * Hook to monitor flow execution status with auto-polling
 *
 * @param flujoId - Flow ID to monitor
 * @param ejecucionId - Optional execution ID if monitoring specific execution
 * @param enabled - Enable/disable polling
 * @returns Execution status, refetch function, and loading states
 *
 * @example
 * const { data, isLoading, isError } = useFlowExecution(1, 'exec-123')
 * // Updates every 2 seconds automatically
 */
export function useFlowExecution(flujoId: number, ejecucionId?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['flowExecution', flujoId, ejecucionId],
    queryFn: () => flowExecutionService.getExecutionStatus(flujoId, ejecucionId),
    refetchInterval: enabled ? POLLING_INTERVAL : false,
    staleTime: 1000, // 1 segundo
    enabled: enabled && !!flujoId,
  })
}

/**
 * Hook to get execution events with pagination
 *
 * @param flujoId - Flow ID
 * @param ejecucionId - Execution ID
 * @param limit - Number of events per page
 * @returns Paginated events with refetch
 *
 * @example
 * const { data: eventos, isLoading } = useExecutionEvents(1, 'exec-123', 50)
 */
export function useExecutionEvents(flujoId: number, ejecucionId: string, limit: number = 50) {
  return useQuery({
    queryKey: ['flowExecution', flujoId, 'eventos', ejecucionId, limit],
    queryFn: () => flowExecutionService.getExecutionEvents(flujoId, ejecucionId, limit, 0),
    refetchInterval: POLLING_INTERVAL,
    staleTime: 1000,
    enabled: !!flujoId && !!ejecucionId,
  })
}

/**
 * Hook to get current execution metrics
 *
 * @param flujoId - Flow ID
 * @param ejecucionId - Execution ID
 * @returns Current metrics (enviados, fallidos, pendientes, etc)
 *
 * @example
 * const metrics = useExecutionMetrics(1, 'exec-123')
 */
export function useExecutionMetrics(flujoId: number, ejecucionId?: string) {
  const { data, ...query } = useFlowExecution(flujoId, ejecucionId)

  const metricas = useMemo<ExecutionMetrics | undefined>(() => {
    return data?.ejecucion?.metricas
  }, [data?.ejecucion?.metricas])

  return {
    data: metricas,
    ...query,
  }
}

/**
 * Hook to get execution status as simplified state
 *
 * @param flujoId - Flow ID
 * @param ejecucionId - Execution ID
 * @returns Status ('en_progreso' | 'completado' | 'error' | 'cancelado')
 *
 * @example
 * const estado = useExecutionStatus(1, 'exec-123')
 */
export function useExecutionStatus(flujoId: number, ejecucionId?: string) {
  const { data, ...query } = useFlowExecution(flujoId, ejecucionId)

  const status = useMemo(() => {
    return data?.ejecucion?.estado
  }, [data?.ejecucion?.estado])

  return {
    data: status,
    ...query,
  }
}

/**
 * Hook to check if execution is ongoing
 *
 * @param flujoId - Flow ID
 * @param ejecucionId - Execution ID
 * @returns Boolean indicating if execution is in progress
 *
 * @example
 * if (useIsExecutionInProgress(1, 'exec-123')) {
 *   // Show monitoring UI
 * }
 */
export function useIsExecutionInProgress(flujoId: number, ejecucionId?: string) {
  const { data: estado } = useExecutionStatus(flujoId, ejecucionId)
  return estado === 'en_progreso'
}

/**
 * Hook to get execution events
 *
 * @param flujoId - Flow ID
 * @param ejecucionId - Execution ID
 * @returns List of execution events
 *
 * @example
 * const eventos = useGetExecutionEvents(1, 'exec-123')
 */
export function useGetExecutionEvents(flujoId: number, ejecucionId: string) {
  const { data: ejecucion } = useFlowExecution(flujoId, ejecucionId)

  const eventos = useMemo<ExecutionEvent[]>(() => {
    return ejecucion?.ejecucion?.eventos || []
  }, [ejecucion?.ejecucion?.eventos])

  return eventos
}

/**
 * Mutation hook to start flow execution
 *
 * @returns Mutation object with mutate function and states
 *
 * @example
 * const { mutate: startExecution, isPending } = useStartFlowExecution()
 * startExecution({
 *   flujo_id: 1,
 *   prospecto_ids: [1, 2, 3]
 * })
 */
export function useStartFlowExecution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: StartFlowExecutionPayload) => flowExecutionService.startExecution(payload),
    onSuccess: (data) => {
      // Invalidate execution queries to refetch
      queryClient.invalidateQueries({
        queryKey: ['flowExecution', data.flujo_id],
      })
    },
  })
}

/**
 * Mutation hook to cancel flow execution
 *
 * @returns Mutation object with mutate function and states
 *
 * @example
 * const { mutate: cancelExecution, isPending } = useCancelFlowExecution()
 * cancelExecution({ flujoId: 1, ejecucionId: 'exec-123' })
 */
export function useCancelFlowExecution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ flujoId, ejecucionId }: { flujoId: number; ejecucionId: string }) =>
      flowExecutionService.cancelExecution(flujoId, ejecucionId),
    onSuccess: (data) => {
      // Invalidate to refetch new state
      queryClient.invalidateQueries({
        queryKey: ['flowExecution', data.flujo_id],
      })
    },
  })
}

/**
 * Mutation hook to get execution history
 *
 * @returns Query object for execution history
 *
 * @example
 * const { data: history } = useExecutionHistory(1)
 */
export function useExecutionHistory(flujoId: number) {
  return useQuery({
    queryKey: ['flowExecution', flujoId, 'history'],
    queryFn: () => flowExecutionService.getExecutionHistory(flujoId, 20),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!flujoId,
  })
}

/**
 * Hook to monitor batching status for an execution
 *
 * @param flujoId - Flow ID
 * @param ejecucionId - Execution ID
 * @param enabled - Enable/disable polling (default: true)
 * @returns Batching status with auto-refresh every 5 seconds
 *
 * @example
 * const { data, isLoading } = useBatchingStatus(1, 'exec-123')
 * if (data?.data.has_batching) {
 *   // Show batching progress UI
 * }
 */
export function useBatchingStatus(flujoId: number, ejecucionId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['flowExecution', flujoId, ejecucionId, 'batching-status'],
    queryFn: () => flowExecutionService.getBatchingStatus(flujoId, ejecucionId),
    refetchInterval: enabled ? 5000 : false, // 5 segundos - batching es más lento
    staleTime: 2000,
    enabled: enabled && !!flujoId && !!ejecucionId,
  })
}
