/**
 * Custom End Node for Flow Builder
 * Represents the end point of the nurturing flow
 */

import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import { CheckCircle2 } from 'lucide-react'

interface EndNodeData {
  label: string
}

interface EndNodeProps extends NodeProps<EndNodeData> {
  isSelected?: boolean
}

export function EndNode({ data, isSelected = false }: EndNodeProps) {
  return (
    <>
      {/* Input handles */}
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="target" position={Position.Right} id="right" />

      <div
        className={`rounded-lg border-2 p-4 min-w-[200px] bg-gradient-to-br from-segal-green/10 to-segal-green/5 shadow-md transition-all duration-200 ${
          isSelected ? 'border-segal-green ring-2 ring-segal-green/30' : 'border-segal-green/50'
        }`}
      >
        <div className="flex items-center gap-2 justify-center">
          <CheckCircle2 className="h-5 w-5 text-segal-green" />
          <h3 className="font-bold text-sm text-segal-dark">{data.label}</h3>
        </div>
        <p className="text-xs text-segal-dark/50 mt-2 text-center">
          Flujo completado
        </p>
      </div>
    </>
  )
}
