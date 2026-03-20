/**
 * Custom End Node for Flow Builder
 * Represents the end point of the nurturing flow — compact rendering via CompactNodeWrapper.
 * Full view/edit is handled by EndNodeDetail in the NodeDetailPanel.
 */

import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import { Flag } from 'lucide-react'
import type { EndNodeData } from '../../../types/flowBuilder'
import { CompactNodeWrapper } from './CompactNodeWrapper'

export function EndNode({ id, data }: NodeProps<EndNodeData>) {
  return (
    <CompactNodeWrapper
      nodeId={id}
      icon={<Flag className="h-5 w-5" />}
      label={data.label || 'Fin'}
      iconBgColor="bg-green-500"
    >
      {/* Input handle - only left side (n8n style) */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-3 !h-3 !bg-segal-green !border-2 !border-white"
      />
    </CompactNodeWrapper>
  )
}
