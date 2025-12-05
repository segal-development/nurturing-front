/**
 * Hooks for Flow Execution Tracking
 * Real-time tracking of execution progress by stage/node
 *
 * Features:
 * - useFlowExecutionDetail: Get detailed execution with stage tracking
 * - useStageProgressStats: Calculate progress statistics
 * - useStageExecutionState: Get state of a specific stage
 * - usePauseExecution: Pause execution mutation
 * - useResumeExecution: Resume execution mutation
 * - useCancelExecution: Cancel execution mutation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { StageProgressStats, StageExecutionState } from '@/types/flowExecutionTracking'
import { flowExecutionTrackingService } from '@/api/flowExecutionTracking.service'

const POLLING_INTERVAL = 2000 // 2 segundos

/**
 * Hook to get detailed execution with stage tracking
 *
 * @param flujoId - Flow ID
 * @param ejecucionId - Execution ID
 * @param enabled - Enable/disable auto-polling
 * @returns Execution detail with stages, jobs, and conditions
 *
 * @example
 * const { data, isLoading } = useFlowExecutionDetail(1, 123)
 * // Updates every 2 seconds automatically
 */
export function useFlowExecutionDetail(
  flujoId: number,
  ejecucionId: number,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: ['flowExecutionTracking', flujoId, ejecucionId],
    queryFn: () => flowExecutionTrackingService.getExecutionDetail(flujoId, ejecucionId),
    refetchInterval: enabled ? POLLING_INTERVAL : false,
    staleTime: 1000,
    enabled: enabled && !!flujoId && !!ejecucionId,
  })
}

/**
 * Hook to calculate stage progress statistics
 *
 * @param flujoId - Flow ID
 * @param ejecucionId - Execution ID
 * @returns Progress statistics (total, completed, executing, pending, failed)
 *
 * @example
 * const stats = useStageProgressStats(1, 123)
 * // Returns: { total_etapas: 10, etapas_completadas: 5, ... }
 */
export function useStageProgressStats(
  flujoId: number,
  ejecucionId: number,
): StageProgressStats | undefined {
  const { data } = useFlowExecutionDetail(flujoId, ejecucionId)

  return useMemo(() => {
    if (!data?.data?.etapas) return undefined

    const etapas = data.data.etapas
    const total = etapas.length
    const completadas = etapas.filter(e => e.estado === 'completed').length
    const ejecutando = etapas.filter(e => e.estado === 'executing').length
    const pendientes = etapas.filter(e => e.estado === 'pending').length
    const fallidas = etapas.filter(e => e.estado === 'failed').length

    return {
      total_etapas: total,
      etapas_completadas: completadas,
      etapas_ejecutando: ejecutando,
      etapas_pendientes: pendientes,
      etapas_fallidas: fallidas,
      porcentaje_completado: total > 0 ? Math.round((completadas / total) * 100) : 0,
    }
  }, [data?.data?.etapas])
}

/**
 * Hook to get state of a specific stage
 *
 * @param flujoId - Flow ID
 * @param ejecucionId - Execution ID
 * @param nodeId - Node ID to get state for
 * @returns Stage execution state
 *
 * @example
 * const state = useStageExecutionState(1, 123, 'node_456')
 * // Returns: 'completed' | 'executing' | 'pending' | 'failed'
 */
export function useStageExecutionState(
  flujoId: number,
  ejecucionId: number,
  nodeId: string,
): StageExecutionState | undefined {
  const { data } = useFlowExecutionDetail(flujoId, ejecucionId)

  return useMemo(() => {
    if (!data?.data?.etapas) return undefined
    const stage = data.data.etapas.find(e => e.node_id === nodeId)
    return stage?.estado
  }, [data?.data?.etapas, nodeId])
}

/**
 * Hook to check if execution is running
 *
 * @param flujoId - Flow ID
 * @param ejecucionId - Execution ID
 * @returns Boolean indicating if execution is in progress
 *
 * @example
 * const isRunning = useIsExecutionRunning(1, 123)
 */
export function useIsExecutionRunning(flujoId: number, ejecucionId: number): boolean {
  const { data } = useFlowExecutionDetail(flujoId, ejecucionId)
  return data?.data?.estado === 'in_progress' || false
}

/**
 * Hook to check if execution is paused
 *
 * @param flujoId - Flow ID
 * @param ejecucionId - Execution ID
 * @returns Boolean indicating if execution is paused
 *
 * @example
 * const isPaused = useIsExecutionPaused(1, 123)
 */
export function useIsExecutionPaused(flujoId: number, ejecucionId: number): boolean {
  const { data } = useFlowExecutionDetail(flujoId, ejecucionId)
  return data?.data?.estado === 'paused' || false
}

/**
 * Mutation hook to pause execution
 *
 * @returns Mutation object with mutate function
 *
 * @example
 * const { mutate: pauseExecution } = usePauseExecution()
 * pauseExecution({ flujoId: 1, ejecucionId: 123 })
 */
export function usePauseExecution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ flujoId, ejecucionId }: { flujoId: number; ejecucionId: number }) =>
      flowExecutionTrackingService.pauseExecution(flujoId, ejecucionId),
    onSuccess: (_, { flujoId, ejecucionId }) => {
      queryClient.invalidateQueries({
        queryKey: ['flowExecutionTracking', flujoId, ejecucionId],
      })
    },
  })
}

/**
 * Mutation hook to resume execution
 *
 * @returns Mutation object with mutate function
 *
 * @example
 * const { mutate: resumeExecution } = useResumeExecution()
 * resumeExecution({ flujoId: 1, ejecucionId: 123 })
 */
export function useResumeExecution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ flujoId, ejecucionId }: { flujoId: number; ejecucionId: number }) =>
      flowExecutionTrackingService.resumeExecution(flujoId, ejecucionId),
    onSuccess: (_, { flujoId, ejecucionId }) => {
      queryClient.invalidateQueries({
        queryKey: ['flowExecutionTracking', flujoId, ejecucionId],
      })
    },
  })
}

/**
 * Mutation hook to cancel execution
 *
 * @returns Mutation object with mutate function
 *
 * @example
 * const { mutate: cancelExecution } = useCancelExecution()
 * cancelExecution({ flujoId: 1, ejecucionId: 123 })
 */
export function useCancelExecution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ flujoId, ejecucionId }: { flujoId: number; ejecucionId: number }) =>
      flowExecutionTrackingService.cancelExecution(flujoId, ejecucionId),
    onSuccess: (_, { flujoId, ejecucionId }) => {
      queryClient.invalidateQueries({
        queryKey: ['flowExecutionTracking', flujoId, ejecucionId],
      })
    },
  })
}

/**
 * Convenience hook that returns all state and mutations
 *
 * @param flujoId - Flow ID
 * @param ejecucionId - Execution ID
 * @returns Complete execution tracking state and mutations
 *
 * @example
 * const { execution, stats, pause, resume, cancel } = useCompleteExecutionTracking(1, 123)
 */
export function useCompleteExecutionTracking(flujoId: number, ejecucionId: number) {
  const execution = useFlowExecutionDetail(flujoId, ejecucionId)
  const stats = useStageProgressStats(flujoId, ejecucionId)
  const isRunning = useIsExecutionRunning(flujoId, ejecucionId)
  const isPaused = useIsExecutionPaused(flujoId, ejecucionId)
  const pauseMutation = usePauseExecution()
  const resumeMutation = useResumeExecution()
  const cancelMutation = useCancelExecution()

  return {
    execution: execution.data,
    isLoading: execution.isLoading,
    isError: execution.isError,
    error: execution.error,
    stats,
    isRunning,
    isPaused,
    pause: pauseMutation.mutate,
    resume: resumeMutation.mutate,
    cancel: cancelMutation.mutate,
    isPauseLoading: pauseMutation.isPending,
    isResumeLoading: resumeMutation.isPending,
    isCancelLoading: cancelMutation.isPending,
  }
}
