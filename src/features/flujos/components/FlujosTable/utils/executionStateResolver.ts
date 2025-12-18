/**
 * Utility functions for resolving execution state
 * Implements Strategy Pattern - different strategies for determining execution to display
 */

import type { ActiveExecutionInfo } from '@/types/flowExecutionTracking'
import type { ExecutionProgress } from './executionProgressCalculator'

export interface SimpleExecution {
  id: number
  flujo_id: number
  estado: string
  fecha_inicio?: string
  fecha_fin?: string
  created_at?: string
  proximo_nodo?: string | null
  nodo_actual?: string | null
  etapas?: Array<{ estado: string; [key: string]: any }>
  // Cost fields
  costo_estimado?: number | null
  costo_real?: number | null
  costo_emails?: number | null
  costo_sms?: number | null
}

export interface DisplayExecution {
  id: number
  estado: string
  progreso: ExecutionProgress
  // Cost fields
  costo_estimado?: number | null
  costo_real?: number | null
}

/**
 * Checks if execution is actively running (in_progress or paused)
 */
function isExecutionActive(execution: ActiveExecutionInfo | null): boolean {
  if (!execution) return false
  return execution.estado === 'in_progress' || execution.estado === 'paused'
}

/**
 * Checks if execution has backend-provided progress data
 */
function hasBackendProgress(execution: ActiveExecutionInfo | null): boolean {
  return !!execution?.progreso
}

/**
 * Creates display execution from active execution (from backend active endpoint)
 */
function createDisplayFromActive(
  activeExecution: ActiveExecutionInfo,
): DisplayExecution | null {
  // Early return: no progress data
  if (!hasBackendProgress(activeExecution)) return null

  // Cast to access cost fields
  const execWithCosts = activeExecution as any

  return {
    id: activeExecution.id,
    estado: activeExecution.estado,
    progreso: activeExecution.progreso!,
    costo_estimado: execWithCosts.costo_estimado ?? null,
    costo_real: execWithCosts.costo_real ?? null,
  }
}

/**
 * Creates display execution from latest execution with calculated progress
 */
function createDisplayFromLatest(
  latestExecution: SimpleExecution,
  calculatedProgress: ExecutionProgress,
): DisplayExecution {
  return {
    id: latestExecution.id,
    estado: latestExecution.estado,
    progreso: calculatedProgress,
    costo_estimado: latestExecution.costo_estimado ?? null,
    costo_real: latestExecution.costo_real ?? null,
  }
}

/**
 * Determines which execution to display with priority logic:
 * 1. Active execution (in_progress/paused) from backend - highest priority
 * 2. Latest execution with calculated progress - fallback for scheduled executions
 * 3. null - no execution to display
 */
export function resolveDisplayExecution(
  activeExecution: ActiveExecutionInfo | null,
  latestExecution: SimpleExecution | null | undefined,
  calculatedProgress: ExecutionProgress | null,
): DisplayExecution | null {
  // Priority 1: Active execution with backend progress
  if (isExecutionActive(activeExecution)) {
    const display = createDisplayFromActive(activeExecution!)
    if (display) return display
  }

  // Priority 2: Latest execution with calculated progress
  // Only show if at least one stage is completed
  if (latestExecution && calculatedProgress && calculatedProgress.completadas > 0) {
    return createDisplayFromLatest(latestExecution, calculatedProgress)
  }

  // No execution to display
  return null
}

/**
 * Checks if a flow can be executed
 * A flow cannot be executed if it has an active execution (in_progress or paused)
 * OR if it has a scheduled next node (proximo_nodo)
 */
export function canExecuteFlow(
  activeExecution: ActiveExecutionInfo | null,
  latestExecution: SimpleExecution | null | undefined,
): boolean {
  // Cannot execute if actively running
  if (isExecutionActive(activeExecution)) {
    console.log('❌ Cannot execute: Active execution exists')
    return false
  }

  // Cannot execute if latest execution is in_progress (waiting for scheduled node)
  if (latestExecution?.estado === 'in_progress') {
    console.log('❌ Cannot execute: Latest execution in_progress')
    return false
  }

  // Cannot execute if there's a scheduled next node (even if estado is 'completed')
  // This happens when backend marks execution as 'completed' but has pending stages
  const latestExecWithNext = latestExecution as any
  if (latestExecWithNext?.proximo_nodo) {
    console.log('❌ Cannot execute: Has proximo_nodo scheduled:', latestExecWithNext.proximo_nodo)
    return false
  }

  // Check if there are pending stages
  const latestExecWithStages = latestExecution as SimpleExecution | undefined
  if (latestExecWithStages?.etapas) {
    const hasPendingStages = latestExecWithStages.etapas.some(
      etapa => etapa.estado === 'pending' || etapa.estado === 'executing'
    )
    if (hasPendingStages) {
      console.log('❌ Cannot execute: Has pending/executing stages')
      return false
    }
  }

  console.log('✅ Can execute: No active execution')
  return true
}
