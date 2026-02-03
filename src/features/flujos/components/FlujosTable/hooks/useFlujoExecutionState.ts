/**
 * Custom hook for managing flow execution state
 * Encapsulates all data fetching and state logic
 * Follows Single Responsibility and Dependency Inversion principles
 */


import { logger } from '@/lib/logger'
import {
  useActiveExecution,
  useLatestExecution,
  useFlowExecutionDetail,
} from '../../../hooks/useFlowExecutionTracking'
import {
  calculateExecutionProgress,
  calculateProgressFromStages,
  type ExecutionProgress,
} from '../utils/executionProgressCalculator'
import {
  resolveDisplayExecution,
  canExecuteFlow,
  type DisplayExecution,
  type SimpleExecution,
} from '../utils/executionStateResolver'

export interface FlujoExecutionState {
  displayExecution: DisplayExecution | null
  canExecute: boolean
  isLoading: boolean
}

/**
 * Hook to get complete execution state for a flow
 * Handles all data fetching and state resolution logic
 *
 * @param flujoId - The flow ID to get execution state for
 * @returns Object with displayExecution, canExecute flag, and loading state
 */
export function useFlujoExecutionState(flujoId: number): FlujoExecutionState {
  // Fetch active execution (in_progress or paused)
  const { data: activeExecutionData, isLoading: isLoadingActive } = useActiveExecution(
    flujoId,
    true,
  )

  // Fetch latest execution (any state) as fallback
  const { data: latestExecutionData, isLoading: isLoadingLatest } = useLatestExecution(
    flujoId,
    true,
  )

  // Extract execution data
  const hasActiveExecution = activeExecutionData?.tiene_ejecucion_activa || false
  const activeExecution = activeExecutionData?.ejecucion || null
  const latestExecution = latestExecutionData?.data?.[0]

  // Get execution ID for detail query
  const latestExecutionId = latestExecution?.id

  // Fetch execution details only if no active execution
  const shouldFetchDetails = !hasActiveExecution && !!latestExecutionId
  const { data: latestExecutionDetail, isLoading: isLoadingDetail } = useFlowExecutionDetail(
    flujoId,
    latestExecutionId || 0,
    shouldFetchDetails,
  )

  // Calculate progress from latest execution
  const calculatedProgress: ExecutionProgress | null = (() => {
    // Early return: no need to calculate if active execution has progress
    if (hasActiveExecution && activeExecution?.progreso) {
      logger.log('Using BACKEND progress from active execution:', activeExecution.progreso)

      // Backend bug: If total is 0, don't use backend progress
      if (activeExecution.progreso.total === 0) {
        logger.warn('Backend returned progreso.total = 0, falling back to calculation')
      } else {
        return null // Use backend progress
      }
    }

    // Priority 1: Calculate from execution details (if available)
    if (latestExecutionDetail?.data) {
      const progress = calculateExecutionProgress(latestExecutionDetail.data)
      logger.log('Calculated progress from DETAIL:', {
        etapas: latestExecutionDetail.data.etapas,
        progress,
      })
      return progress
    }

    // Priority 2: Calculate from latest execution stages directly
    const latestExecWithStages = latestExecution as SimpleExecution | undefined
    if (latestExecWithStages?.etapas && latestExecWithStages.etapas.length > 0) {
      const progress = calculateProgressFromStages(latestExecWithStages.etapas)
      logger.log('Calculated progress from STAGES:', {
        flujoId,
        etapas: latestExecWithStages.etapas,
        etapasCount: latestExecWithStages.etapas.length,
        etapasStates: latestExecWithStages.etapas.map(e => e.estado),
        progress,
      })
      return progress
    }

    logger.log('NO progress data available for flujo:', flujoId)
    return null
  })()

  // Resolve which execution to display
  const displayExecution: DisplayExecution | null = resolveDisplayExecution(activeExecution, latestExecution, calculatedProgress)

  // Determine if flow can be executed
  const canExecute: boolean = canExecuteFlow(activeExecution, latestExecution)

  // Aggregate loading state
  const isLoading = isLoadingActive || isLoadingLatest || isLoadingDetail

  return {
    displayExecution,
    canExecute,
    isLoading,
  }
}
