/**
 * Utility functions for calculating flow execution progress
 * Follows Single Responsibility Principle - each function has one clear purpose
 */

import type { FlowExecutionDetail } from '@/types/flowExecutionTracking'

export interface ExecutionProgress {
  porcentaje: number
  completadas: number
  total: number
  en_ejecucion: number
  pendientes: number
  fallidas: number
}

/**
 * Checks if a stage is considered "completed"
 * A stage is only completed when its estado is 'completed'
 */
function isStageCompleted(estado: string): boolean {
  return estado === 'completed'
}

/**
 * Checks if a stage is currently executing
 */
function isStageExecuting(estado: string): boolean {
  return estado === 'executing'
}

/**
 * Checks if a stage is pending
 */
function isStagePending(estado: string): boolean {
  return estado === 'pending'
}

/**
 * Checks if a stage has failed
 */
function isStageFailed(estado: string): boolean {
  return estado === 'failed'
}

/**
 * Calculates the completion percentage based on completed stages
 * Uses integer rounding for display purposes
 */
function calculateCompletionPercentage(completed: number, total: number): number {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

/**
 * Stage interface for calculation (minimal required fields)
 */
interface StageForCalculation {
  estado: string
}

/**
 * Calculates execution progress from FlowExecutionDetail
 * Returns null if no stages are available
 *
 * IMPORTANT: Only counts stages with estado='completed' as completed
 * A flow with 1/3 stages completed should show 33%, not 100%
 */
export function calculateExecutionProgress(
  executionDetail: FlowExecutionDetail | null | undefined,
): ExecutionProgress | null {
  // Early return: no execution detail or no stages
  if (!executionDetail?.etapas) return null

  const stages = executionDetail.etapas

  // Early return: no stages to calculate
  if (stages.length === 0) return null

  const total = stages.length
  const completadas = stages.filter((stage: StageForCalculation) => isStageCompleted(stage.estado)).length
  const en_ejecucion = stages.filter((stage: StageForCalculation) => isStageExecuting(stage.estado)).length
  const pendientes = stages.filter((stage: StageForCalculation) => isStagePending(stage.estado)).length
  const fallidas = stages.filter((stage: StageForCalculation) => isStageFailed(stage.estado)).length

  return {
    porcentaje: calculateCompletionPercentage(completadas, total),
    completadas,
    total,
    en_ejecucion,
    pendientes,
    fallidas,
  }
}

/**
 * Calculates execution progress from stages array directly
 * Used when execution data already contains stages without needing detail endpoint
 *
 * IMPORTANT: Only counts stages with estado='completed' as completed
 */
export function calculateProgressFromStages(
  stages: StageForCalculation[] | null | undefined,
): ExecutionProgress | null {
  // Early return: no stages
  if (!stages || stages.length === 0) return null

  const total = stages.length
  const completadas = stages.filter(stage => isStageCompleted(stage.estado)).length
  const en_ejecucion = stages.filter(stage => isStageExecuting(stage.estado)).length
  const pendientes = stages.filter(stage => isStagePending(stage.estado)).length
  const fallidas = stages.filter(stage => isStageFailed(stage.estado)).length

  return {
    porcentaje: calculateCompletionPercentage(completadas, total),
    completadas,
    total,
    en_ejecucion,
    pendientes,
    fallidas,
  }
}

/**
 * Determines if progress should be shown for an execution
 * Progress is shown only if at least one stage has been completed
 */
export function shouldShowProgress(progress: ExecutionProgress | null): boolean {
  if (!progress) return false
  return progress.completadas > 0
}
