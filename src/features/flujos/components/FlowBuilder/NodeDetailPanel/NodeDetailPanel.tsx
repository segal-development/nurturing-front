/**
 * NodeDetailPanel — container that reads selectedNodeId from the store,
 * finds the matching node, and renders the correct type-specific detail component.
 *
 * Lives in the existing right sidebar (w-72 = 288px).
 * Receives callbacks directly from FlowBuilder scope (NOT from node.data).
 */

import { X } from 'lucide-react'
import { useFlowBuilderStore } from '../../../stores/flowBuilderStore'
import type {
  StageNodeData,
  ConditionalNodeData,
  InitialNodeData,
  EndNodeData,
} from '../../../types/flowBuilder'
import { InitialNodeDetail } from './InitialNodeDetail'
import { EndNodeDetail } from './EndNodeDetail'
import { ConditionalNodeDetail } from './ConditionalNodeDetail'
import { StageNodeDetail } from './StageNodeDetail'

interface NodeDetailPanelProps {
  onUpdate: (nodeId: string, data: Partial<unknown>) => void
  onDelete: (nodeId: string) => void
  precios?: { email: number; sms: number }
  isReadOnly?: boolean
  /** External nodes array — when provided, bypasses the Zustand store (for viewers). */
  externalNodes?: Array<{ id: string; type?: string; data: any }>
  /** External selectedNodeId — when provided, bypasses the Zustand store (for viewers). */
  externalSelectedNodeId?: string | null
  /** External setter for selectedNodeId — when provided, bypasses the Zustand store (for viewers). */
  onClearSelection?: () => void
}

export function NodeDetailPanel({
  onUpdate,
  onDelete,
  precios,
  isReadOnly = false,
  externalNodes,
  externalSelectedNodeId,
  onClearSelection,
}: NodeDetailPanelProps) {
  // Use external state if provided (viewers), otherwise use Zustand store (FlowBuilder)
  const storeSelectedNodeId = useFlowBuilderStore((state) => state.selectedNodeId)
  const storeNodes = useFlowBuilderStore((state) => state.nodes)
  const storeSetSelectedNodeId = useFlowBuilderStore((state) => state.setSelectedNodeId)

  const selectedNodeId = externalSelectedNodeId !== undefined ? externalSelectedNodeId : storeSelectedNodeId
  const nodes = externalNodes ?? storeNodes
  const setSelectedNodeId = onClearSelection ?? storeSetSelectedNodeId

  // Find the selected node
  const selectedNode = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId)
    : null

  // Nothing selected — don't render panel
  if (!selectedNode) return null

  const handleClose = () => {
    if (onClearSelection) {
      onClearSelection()
    } else {
      storeSetSelectedNodeId(null)
    }
  }

  const handleDelete = (nodeId: string) => {
    onDelete(nodeId)
    // Selection will be cleared automatically by the store's removeNode
  }

  return (
    <div className="space-y-3">
      {/* Panel header with close button */}
      <div className="flex items-center justify-between pb-2 border-b border-segal-blue/10">
        <h3 className="text-xs font-bold uppercase tracking-wider text-segal-dark/60">
          Detalle del nodo
        </h3>
        <button
          onClick={handleClose}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
          title="Cerrar panel"
        >
          <X className="h-3.5 w-3.5 text-segal-dark/50" />
        </button>
      </div>

      {/* Type-specific detail component */}
      <div className="max-h-[calc(100vh-400px)] overflow-y-auto pr-1">
        {selectedNode.type === 'initial' && (
          <InitialNodeDetail
            nodeId={selectedNode.id}
            data={selectedNode.data as InitialNodeData}
          />
        )}

        {selectedNode.type === 'end' && (
          <EndNodeDetail
            nodeId={selectedNode.id}
            data={selectedNode.data as EndNodeData}
            onUpdate={onUpdate}
            onDelete={handleDelete}
            isReadOnly={isReadOnly}
          />
        )}

        {selectedNode.type === 'conditional' && (
          <ConditionalNodeDetail
            nodeId={selectedNode.id}
            data={selectedNode.data as ConditionalNodeData}
            onUpdate={onUpdate}
            onDelete={handleDelete}
            isReadOnly={isReadOnly}
          />
        )}

        {selectedNode.type === 'stage' && (
          <StageNodeDetail
            nodeId={selectedNode.id}
            data={selectedNode.data as StageNodeData}
            onUpdate={onUpdate}
            onDelete={handleDelete}
            precios={precios}
            isReadOnly={isReadOnly}
          />
        )}
      </div>
    </div>
  )
}
