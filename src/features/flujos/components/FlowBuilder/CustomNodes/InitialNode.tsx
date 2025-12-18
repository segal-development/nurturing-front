/**
 * Custom Initial Node for Flow Builder
 * Represents the starting point of the nurturing flow
 * Shows origin and prospect selection summary
 */

import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import { Users, Database, CheckCircle2, AlertCircle, Loader2, Clock } from 'lucide-react'
import type { InitialNodeData } from '../../../types/flowBuilder'

interface InitialNodeProps extends NodeProps<InitialNodeData> {
  isSelected?: boolean
}

export function InitialNode({ data, isSelected = false }: InitialNodeProps) {
  return (
    <>
      <div
        className={`rounded-lg border-2 p-4 min-w-60 bg-linear-to-br from-segal-blue/10 to-segal-turquoise/10 shadow-md transition-all duration-200 ${
          // Estado de ejecución tiene prioridad
          data.executionState === 'executing'
            ? 'border-amber-500 ring-2 ring-amber-400/30'
            : data.executionState === 'completed'
              ? 'border-green-500 ring-2 ring-green-400/20'
              : data.executionState === 'failed'
                ? 'border-red-500 ring-2 ring-red-400/20'
                : data.executionState === 'pending'
                  ? 'border-gray-400 opacity-60'
                  : isSelected
                    ? 'border-segal-blue ring-2 ring-segal-blue/30'
                    : 'border-segal-blue/50'
        }`}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-segal-blue text-white">
                <Database className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-sm text-segal-dark">{data.label}</h3>
            </div>
            {/* Execution State Icon */}
            {data.executionState && (
              <>
                {data.executionState === 'executing' && (
                  <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
                )}
                {data.executionState === 'completed' && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                {data.executionState === 'failed' && (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                {data.executionState === 'pending' && (
                  <Clock className="h-5 w-5 text-gray-400" />
                )}
              </>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2 text-xs text-segal-dark/70">
            {data.origen_id && (
              <div className="flex items-center gap-2 p-2 rounded bg-white/50 border border-segal-blue/10">
                <span className="text-2xs">📍</span>
                <span className="font-medium">{data.origen_id}</span>
              </div>
            )}

            {data.prospectos_count !== undefined && (
              <div className="flex items-center gap-2 p-2 rounded bg-white/50 border border-segal-blue/10">
                <Users className="h-3 w-3 text-segal-blue" />
                <span>
                  <span className="font-bold text-segal-blue">{data.prospectos_count}</span>{' '}
                  prospectos
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-segal-dark/50 italic">
            Selecciona origen y prospectos para comenzar
          </p>
        </div>
      </div>

      {/* Output handle - only right side (n8n style) */}
      <Handle 
        type="source" 
        position={Position.Right} 
        id="right"
        className="!w-3 !h-3 !bg-segal-blue !border-2 !border-white"
      />
    </>
  )
}
