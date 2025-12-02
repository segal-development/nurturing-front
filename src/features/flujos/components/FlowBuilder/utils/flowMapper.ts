/**
 * Funciones para mapear nodos/edges de ReactFlow a estructura del backend
 * Principio de Responsabilidad Única: solo mapear/transformar datos
 */

import type { Node as ReactFlowNode } from 'reactflow'
import type { CustomEdge } from '../../../types/flowBuilder'

/**
 * Estructura de una etapa para el backend
 */
export interface StageData {
  id: string
  orden: number
  label: string
  dia_envio: number
  tipo_mensaje: string
  plantilla_mensaje?: string
  plantilla_id?: number
  plantilla_id_email?: number
  plantilla_type?: 'reference' | 'inline'
  fecha_inicio_personalizada: string | null
  activo: boolean
}

/**
 * Estructura de una condición para el backend
 */
export interface ConditionData {
  id: string
  label: string
  description: string
  condition_type: string
  condition_label: string
  yes_label: string
  no_label: string
}

/**
 * Estructura de una rama para el backend
 */
export interface BranchData {
  edge_id: string
  source_node_id: string
  target_node_id: string
  source_handle: string | null
  target_handle: string | null
  condition_branch: 'yes' | 'no'
}

/**
 * Estructura de nodo para visualización
 */
export interface VisualNodeData {
  id: string
  type: string | undefined
  position: { x: number; y: number }
  data: any
}

/**
 * Estructura de edge para visualización
 */
export interface VisualEdgeData {
  id: string
  source: string
  target: string
  sourceHandle: string | null
  targetHandle: string | null
  type: string
}

/**
 * Mapea nodos de tipo "stage" a la estructura del backend
 */
export function mapStagesToBackend(storeNodes: ReactFlowNode[]): StageData[] {
  return storeNodes
    .filter((n) => n.type === 'stage')
    .map((n, index) => {
      const data = n.data as any

      return {
        id: n.id,
        orden: index,
        label: data.label || `Stage ${index + 1}`,
        dia_envio: data.dia_envio || 1,
        tipo_mensaje: data.tipo_mensaje || 'email',
        plantilla_mensaje: data.plantilla_mensaje,
        plantilla_id: data.plantilla_id,
        plantilla_id_email: data.plantilla_id_email,
        plantilla_type: data.plantilla_type,
        fecha_inicio_personalizada: data.fecha_inicio_personalizada || null,
        activo: data.activo !== false,
      }
    })
}

/**
 * Mapea nodos de tipo "conditional" a la estructura del backend
 */
export function mapConditionsToBackend(storeNodes: ReactFlowNode[]): ConditionData[] {
  return storeNodes
    .filter((n) => n.type === 'conditional')
    .map((n) => {
      const data = n.data as any

      return {
        id: n.id,
        label: data.label || 'Condition',
        description: data.description || '',
        condition_type: data.condition?.type || 'email_opened',
        condition_label: data.condition?.label || '',
        yes_label: data.yesLabel || 'Sí',
        no_label: data.noLabel || 'No',
      }
    })
}

/**
 * Mapea edges a estructura de ramas del backend
 */
export function mapBranchesToBackend(
  storeEdges: CustomEdge[],
  storeNodes: ReactFlowNode[]
): BranchData[] {
  return storeEdges
    .filter((e) => {
      const sourceNode = storeNodes.find((n) => n.id === e.source)
      return sourceNode?.type === 'conditional'
    })
    .map((e) => ({
      edge_id: e.id,
      source_node_id: e.source,
      target_node_id: e.target,
      source_handle: e.sourceHandle || null,
      target_handle: e.targetHandle || null,
      condition_branch: e.sourceHandle?.includes('yes') ? 'yes' : 'no',
    }))
}

/**
 * Mapea nodos a estructura visual
 */
export function mapNodesToVisual(storeNodes: ReactFlowNode[]): VisualNodeData[] {
  return storeNodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: n.data,
  }))
}

/**
 * Mapea edges a estructura visual
 */
export function mapEdgesToVisual(storeEdges: CustomEdge[]): VisualEdgeData[] {
  return storeEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle || null,
    targetHandle: e.targetHandle || null,
    type: e.type || 'animated',
  }))
}

/**
 * Obtiene el nodo inicial (si existe)
 */
export function getInitialNode(storeNodes: ReactFlowNode[]): ReactFlowNode | null {
  return storeNodes.find((n) => n.type === 'initial') || null
}

/**
 * Obtiene todos los nodos finales
 */
export function getEndNodes(storeNodes: ReactFlowNode[]): ReactFlowNode[] {
  return storeNodes.filter((n) => n.type === 'end')
}
