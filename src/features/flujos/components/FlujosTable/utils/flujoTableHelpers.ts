/**
 * Helper functions for FlujoTableRow component
 * Extracts small, reusable, single-purpose functions
 */

import type { FlujoNurturing } from '@/types/flujo'

/**
 * Gets the tipo_prospecto name as a string
 * Handles both string and object types
 */
export function getTipoProspectoName(
  tipoProspecto: FlujoNurturing['tipo_prospecto'],
): string {
  // Early return: already a string
  if (typeof tipoProspecto === 'string') {
    return tipoProspecto
  }

  // Return name from object or fallback
  return tipoProspecto?.nombre || '-'
}

/**
 * Calculates the number of stages from different possible sources
 * Priority: config_structure.stages > flujo_etapas > etapas
 */
export function calculateStagesCount(flujo: FlujoNurturing): number {
  return (
    flujo.config_structure?.stages?.length ||
    flujo.flujo_etapas?.length ||
    flujo.etapas?.length ||
    0
  )
}

/**
 * Gets the progress bar color based on execution state
 */
export function getProgressBarColor(estado: string): string {
  switch (estado) {
    case 'in_progress':
      return 'bg-blue-500'
    case 'paused':
      return 'bg-yellow-500'
    case 'completed':
      return 'bg-green-500'
    case 'failed':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

/**
 * Gets the status text color based on execution state
 */
export function getStatusTextColor(estado: string): string {
  switch (estado) {
    case 'in_progress':
      return 'text-blue-600'
    case 'paused':
      return 'text-yellow-600'
    case 'completed':
      return 'text-green-600'
    case 'failed':
      return 'text-red-600'
    default:
      return 'text-gray-600'
  }
}

/**
 * Gets the status label text based on execution state
 */
export function getStatusLabel(estado: string): string {
  switch (estado) {
    case 'in_progress':
      return 'En progreso'
    case 'paused':
      return 'Pausada'
    case 'completed':
      return 'Completada'
    case 'failed':
      return 'Fallida'
    default:
      return 'Desconocido'
  }
}
