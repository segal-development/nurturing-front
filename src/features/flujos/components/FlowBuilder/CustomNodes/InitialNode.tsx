/**
 * Custom Initial Node for Flow Builder
 * Represents the starting point of the nurturing flow — compact rendering via CompactNodeWrapper.
 * Full read-only detail is handled by InitialNodeDetail in the NodeDetailPanel.
 */

import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import { Play } from 'lucide-react'
import type { InitialNodeData } from '../../../types/flowBuilder'
import { CompactNodeWrapper } from './CompactNodeWrapper'

export function InitialNode({ id, data }: NodeProps<InitialNodeData>) {
  return (
    <CompactNodeWrapper
      nodeId={id}
      icon={<Play className="h-3.5 w-3.5" />}
      label={data.label || 'Inicio'}
      iconBgColor="bg-indigo-500"
      executionState={data.executionState}
    >
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
