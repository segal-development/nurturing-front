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
  esPerpetuo?: boolean
}

/**
 * Renders the progress bar with percentage
 * When `esPerpetuo` is true, forces purple color regardless of estado.
 */
function ProgressBar({
  estado,
  porcentaje,
  esPerpetuo,
}: {
  estado: string
  porcentaje: number
  esPerpetuo: boolean
}) {
  const barColor = esPerpetuo ? 'bg-purple-500' : getProgressBarColor(estado)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-segal-dark/70 min-w-[35px]">{porcentaje}%</span>
    </div>
  )
}

/**
 * Builds the perpetuo-aware status label with ♾️ prefix
 */
function getPerpetuoLabel(estado: string): string {
  switch (estado) {
    case 'in_progress':
      return '♾️ Perpetuo · procesando'
    case 'waiting':
      return '♾️ Perpetuo · esperando nuevos'
    case 'paused':
      return '♾️ Perpetuo · pausado'
    case 'completed':
      return '♾️ Perpetuo · batch completado'
    case 'failed':
      return '♾️ Perpetuo · con errores'
    default:
      return '♾️ Perpetuo'
  }
}

/**
 * Renders the status text with icon for in_progress state
 */
function StatusText({
  estado,
  completadas,
  total,
  esPerpetuo,
}: {
  estado: string
  completadas: number
  total: number
  esPerpetuo: boolean
}) {
  const statusLabel = esPerpetuo ? getPerpetuoLabel(estado) : getStatusLabel(estado)
  const textColor = esPerpetuo ? 'text-purple-600' : getStatusTextColor(estado)
  const showSpinner = estado === 'in_progress'

  return (
    <div className="flex items-center gap-1">
      {showSpinner && (
        <Loader2 className={`h-3 w-3 animate-spin ${esPerpetuo ? 'text-purple-500' : 'text-blue-500'}`} />
      )}
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
export function ProgressDisplay({ estado, progreso, esPerpetuo = false }: ProgressDisplayProps) {
  return (
    <div className="space-y-1">
      <ProgressBar estado={estado} porcentaje={progreso.porcentaje} esPerpetuo={esPerpetuo} />
      <StatusText
        estado={estado}
        completadas={progreso.completadas}
        total={progreso.total}
        esPerpetuo={esPerpetuo}
      />
    </div>
  )
}

/**
 * Empty state when no execution is available
 */
export function NoExecutionDisplay() {
  return <span className="text-xs text-segal-dark/40">Sin ejecución</span>
}
