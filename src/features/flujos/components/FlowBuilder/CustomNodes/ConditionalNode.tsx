/**
 * Custom Conditional Node for Flow Builder
 * Represents branching logic (e.g., "Did user open email?")
 * Creates two outgoing paths: yes/true and no/false — compact rendering via CompactNodeWrapper.
 * Full view/edit is handled by ConditionalNodeDetail in the NodeDetailPanel.
 *
 * CRITICAL: Handle IDs remain identical (`${id}-yes`, `${id}-no`)
 * to preserve backward compatibility with saved flows.
 * Handles repositioned to 25%/75% for compact node height.
 */

import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import { GitBranch } from 'lucide-react'
import type { ConditionalNodeData } from '../../../types/flowBuilder'
import { CompactNodeWrapper } from './CompactNodeWrapper'

export function ConditionalNode({ id, data }: NodeProps<ConditionalNodeData>) {
  return (
    <CompactNodeWrapper
      nodeId={id}
      icon={<GitBranch className="h-5 w-5" />}
      label={data.label || 'Condicion'}
      iconBgColor="bg-amber-500"
      executionState={data.executionState}
      cohorteResumen={data.cohorteResumen}
      showProspectIndicators={data.showProspectIndicators}
    >
      {/* Input handle - only left side (n8n style) */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-3 !h-3 !bg-segal-blue !border-2 !border-white"
      />

      {/* YES handle - Green, right side top — repositioned to 25% for compact */}
      <Handle
        type="source"
        position={Position.Right}
        id={`${id}-yes`}
        style={{
          top: '25%',
          width: '12px',
          height: '12px',
          background: '#059669',
          border: '2px solid #ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          cursor: 'crosshair',
        }}
        title="Conexion para SI (condicion verdadera)"
      />

      {/* NO handle - Red, right side bottom — repositioned to 75% for compact */}
      <Handle
        type="source"
        position={Position.Right}
        id={`${id}-no`}
        style={{
          top: '75%',
          width: '12px',
          height: '12px',
          background: '#dc2626',
          border: '2px solid #ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          cursor: 'crosshair',
        }}
        title="Conexion para NO (condicion falsa)"
      />

      {/* Visual labels for the handles */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          right: '-20px',
          fontSize: '8px',
          fontWeight: 700,
          color: '#059669',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}
      >
        Si
      </div>

      <div
        style={{
          position: 'absolute',
          top: '68%',
          right: '-20px',
          fontSize: '8px',
          fontWeight: 700,
          color: '#dc2626',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}
      >
        No
      </div>
    </CompactNodeWrapper>
  )
}
