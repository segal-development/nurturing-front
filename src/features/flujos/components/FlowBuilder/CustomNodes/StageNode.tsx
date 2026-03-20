/**
 * Custom Stage Node for Flow Builder
 * Represents a nurturing stage/etapa in the flow — compact rendering via CompactNodeWrapper.
 * Full view/edit is handled by StageNodeDetail in the NodeDetailPanel.
 */

import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import { Mail, MessageSquare, Zap } from 'lucide-react'
import type { StageNodeData } from '../../../types/flowBuilder'
import { CompactNodeWrapper } from './CompactNodeWrapper'

function getStageIcon(tipoMensaje?: string) {
  switch (tipoMensaje) {
    case 'email':
      return <Mail className="h-5 w-5" />
    case 'sms':
      return <MessageSquare className="h-5 w-5" />
    case 'ambos':
      return (
        <div className="flex gap-0.5">
          <Mail className="h-4 w-4" />
          <MessageSquare className="h-4 w-4" />
        </div>
      )
    default:
      return <Zap className="h-5 w-5" />
  }
}

function getNodeNumber(id: string): string {
  return id.split('-')[1]?.substring(0, 1) || '1'
}

export function StageNode({ id, data }: NodeProps<StageNodeData>) {
  const nodeNumber = getNodeNumber(id)

  return (
    <CompactNodeWrapper
      nodeId={id}
      icon={getStageIcon(data.tipo_mensaje)}
      label={data.label || 'Etapa'}
      iconBgColor="bg-blue-500"
      executionState={data.executionState}
      isActive={data.activo !== false}
      badge={
        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-segal-blue text-[8px] font-bold text-white shadow-sm">
          {nodeNumber}
        </div>
      }
    >
      {/* Input handle - only left side (n8n style) */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-3 !h-3 !bg-segal-blue !border-2 !border-white"
      />

      {/* Output handle - only right side (n8n style) */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-3 !h-3 !bg-segal-blue !border-2 !border-white"
      />
    </CompactNodeWrapper>
  )
}
