/**
 * useNodeLabelMap Hook
 * 
 * Creates a map of node IDs to human-readable labels from configVisual.
 * Extracts labels from ReactFlow nodes for display in execution history and badges.
 * 
 * @module useNodeLabelMap
 */

import { useMemo } from 'react'

import type { ConfigVisual } from '@/types/flujo'

/**
 * Extracts a readable label from a node's data
 * 
 * Priority: data.label > data.nombre > formatted node ID
 */
function extractNodeLabel(nodeId: string, nodeData?: Record<string, unknown>): string {
  if (nodeData?.label && typeof nodeData.label === 'string') {
    return nodeData.label
  }
  
  if (nodeData?.nombre && typeof nodeData.nombre === 'string') {
    return nodeData.nombre
  }
  
  // Format node ID as fallback (e.g., 'stage-abc123' -> 'Etapa abc123')
  if (nodeId.startsWith('stage-')) {
    return `Etapa ${nodeId.slice(6, 14)}`
  }
  
  return nodeId
}

/**
 * Hook that creates a Map of node IDs to human-readable labels
 * 
 * @param configVisual - Flow configuration containing nodes
 * @returns Map<string, string> mapping node_id to label
 * 
 * @example
 * const nodeLabelMap = useNodeLabelMap(flujo.config_visual)
 * const label = nodeLabelMap.get('stage-abc123') // 'Día 1'
 */
export function useNodeLabelMap(configVisual: ConfigVisual | undefined): Map<string, string> {
  return useMemo(() => {
    const map = new Map<string, string>()
    
    if (!configVisual?.nodes) {
      return map
    }
    
    for (const node of configVisual.nodes) {
      const label = extractNodeLabel(node.id, node.data as Record<string, unknown> | undefined)
      map.set(node.id, label)
    }
    
    return map
  }, [configVisual?.nodes])
}

/**
 * Get a node label from a map, with fallback
 * 
 * @param nodeLabelMap - Map of node IDs to labels
 * @param nodeId - The node ID to look up
 * @returns The label or the nodeId as fallback
 */
export function getNodeLabel(nodeLabelMap: Map<string, string>, nodeId: string): string {
  return nodeLabelMap.get(nodeId) ?? nodeId
}
