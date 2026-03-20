/**
 * InitialNodeDetail — read-only detail view for the Initial node.
 * Shows origin info, prospect count, and execution state.
 * No edit mode — InitialNode is not user-editable.
 */

import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  Loader2,
  Play,
  Users,
} from 'lucide-react'
import type { InitialNodeData } from '../../../types/flowBuilder'

interface InitialNodeDetailProps {
  nodeId: string
  data: InitialNodeData
}

function getExecutionStateLabel(state?: string): string {
  switch (state) {
    case 'executing':
      return 'Ejecutando'
    case 'completed':
      return 'Completado'
    case 'failed':
      return 'Fallido'
    case 'pending':
      return 'Pendiente'
    default:
      return 'Sin ejecucion'
  }
}

function getExecutionStateIcon(state?: string) {
  switch (state) {
    case 'executing':
      return <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    case 'failed':
      return <AlertCircle className="h-4 w-4 text-red-600" />
    case 'pending':
      return <Clock className="h-4 w-4 text-gray-400" />
    default:
      return null
  }
}

export function InitialNodeDetail({ data }: InitialNodeDetailProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-white">
          <Play className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-segal-dark truncate">
            {data.label || 'Inicio'}
          </h3>
          <p className="text-xs text-segal-dark/50">Nodo inicial</p>
        </div>
      </div>

      {/* Origin info */}
      {data.origen_id && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-segal-dark">Origen</p>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-indigo-50 border border-indigo-200">
            <Database className="h-4 w-4 text-indigo-600 shrink-0" />
            <span className="text-xs font-medium text-indigo-800">
              {data.origen_nombre || data.origen_id}
            </span>
          </div>
        </div>
      )}

      {/* Prospect count */}
      {data.prospectos_count !== undefined && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-200">
          <Users className="h-4 w-4 text-blue-600 shrink-0" />
          <div>
            <span className="text-sm font-bold text-blue-700">{data.prospectos_count.toLocaleString()}</span>
            <span className="text-xs text-blue-600 ml-1">prospectos</span>
          </div>
        </div>
      )}

      {/* Execution state */}
      {data.executionState && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-segal-dark">Estado de ejecucion</p>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-200">
            {getExecutionStateIcon(data.executionState)}
            <span className="text-xs font-medium text-segal-dark">
              {getExecutionStateLabel(data.executionState)}
            </span>
          </div>
        </div>
      )}

      {/* Info text */}
      <p className="text-xs text-segal-dark/50 italic pt-2 border-t border-gray-100">
        El nodo inicial define el origen y prospectos del flujo. No es editable.
      </p>
    </div>
  )
}
