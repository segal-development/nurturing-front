/**
 * Funciones para manejar cambios de estado en ReactFlow
 * Principio de Responsabilidad Única: procesar cambios de nodos/edges
 */

import type { NodeChange, EdgeChange } from 'reactflow'

/**
 * Tipo de cambio de posición
 */
export interface PositionChange {
  nodeId: string
  position: { x: number; y: number }
}

/**
 * Tipo de cambio de edge
 */
export interface EdgeRemovalChange {
  edgeId: string
}

/**
 * Tipo de cambio de eliminación de nodo
 */
export interface NodeRemovalChange {
  nodeId: string
}

/**
 * Extrae cambios de posición de los cambios de nodos
 */
export function extractPositionChanges(changes: NodeChange[]): PositionChange[] {
  return changes
    .filter((change) => change.type === 'position' && 'position' in change)
    .map((change) => ({
      nodeId: (change as any).id,
      position: (change as any).position,
    }))
}

/**
 * Extrae cambios de eliminación de nodos
 */
export function extractNodeRemovals(changes: NodeChange[]): NodeRemovalChange[] {
  return changes
    .filter((change) => change.type === 'remove')
    .map((change) => ({
      nodeId: (change as any).id,
    }))
}

/**
 * Extrae cambios de eliminación de edges
 */
export function extractEdgeRemovals(changes: EdgeChange[]): EdgeRemovalChange[] {
  return changes
    .filter((change) => change.type === 'remove')
    .map((change) => ({
      edgeId: (change as any).id,
    }))
}

/**
 * Verifica si hay cambios de posición en el array
 */
export function hasPositionChanges(changes: NodeChange[]): boolean {
  return changes.some((change) => change.type === 'position')
}

/**
 * Verifica si hay cambios de eliminación en el array
 */
export function hasEdgeRemovals(changes: EdgeChange[]): boolean {
  return changes.some((change) => change.type === 'remove')
}
