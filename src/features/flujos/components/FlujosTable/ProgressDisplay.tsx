/**
 * ProgressDisplay Component
 * Pure presentational component for displaying execution progress
 * Follows Single Responsibility Principle - only renders UI
 */

import { Loader2 } from 'lucide-react'
import type { ExecutionProgress } from './utils/executionProgressCalculator'
import {
  getProgressBarColor,
  getStatusTextColor,
  getStatusLabel,
} from './utils/flujoTableHelpers'

interface ProgressDisplayProps {
  estado: string
  progreso: ExecutionProgress
}

/**
 * Renders the progress bar with percentage
 */
function ProgressBar({ estado, porcentaje }: { estado: string; porcentaje: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(estado)}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-segal-dark/70 min-w-[35px]">{porcentaje}%</span>
    </div>
  )
}

/**
 * Renders the status text with icon for in_progress state
 */
function StatusText({
  estado,
  completadas,
  total,
}: {
  estado: string
  completadas: number
  total: number
}) {
  const statusLabel = getStatusLabel(estado)
  const textColor = getStatusTextColor(estado)
  const showSpinner = estado === 'in_progress'

  return (
    <div className="flex items-center gap-1">
      {showSpinner && <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />}
      <span className={`text-xs ${textColor}`}>
        {statusLabel} ({completadas}/{total} etapas)
      </span>
    </div>
  )
}

/**
 * Main ProgressDisplay component
 * Displays execution progress with bar and status text
 */
export function ProgressDisplay({ estado, progreso }: ProgressDisplayProps) {
  return (
    <div className="space-y-1">
      <ProgressBar estado={estado} porcentaje={progreso.porcentaje} />
      <StatusText estado={estado} completadas={progreso.completadas} total={progreso.total} />
    </div>
  )
}

/**
 * Empty state when no execution is available
 */
export function NoExecutionDisplay() {
  return <span className="text-xs text-segal-dark/40">Sin ejecución</span>
}
