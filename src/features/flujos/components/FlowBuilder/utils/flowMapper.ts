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
  tiempo_espera: number // Days to wait since previous stage (0 for first stage)
  tipo_mensaje: string
  type: string // Backend expects this field for validation
  plantilla_mensaje?: string
  plantilla_id?: number
  plantilla_id_email?: number
  plantilla_type?: 'reference' | 'inline'
  fecha_inicio_personalizada: string | null
  activo: boolean
}

/**
 * Estructura de una condición para el backend
 * IMPORTANTE: Incluye los campos de evaluación (check_*) que usa VerificarCondicionJob
 */
export interface ConditionData {
  id: string
  type: string // Backend expects this field for validation (should be 'condition')
  label: string
  description: string
  condition_type: string // 'email_opened' | 'link_clicked' | 'email_bounced' | 'unsubscribed' | 'custom'
  condition_label: string
  yes_label: string
  no_label: string
  // Campos de evaluación - CRÍTICOS para VerificarCondicionJob
  check_param: string // 'Views' | 'Clicks' | 'Bounces' | 'Unsubscribes'
  check_operator: string // '>' | '>=' | '==' | '!=' | '<' | '<='
  check_value: string // Valor a comparar (ej: '0', '1')
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
        tiempo_espera: data.dia_envio || 0, // Backend expects tiempo_espera (days to wait)
        tipo_mensaje: data.tipo_mensaje || 'email',
        type: data.tipo_mensaje || 'email', // Backend expects this field
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
 * IMPORTANTE: Incluye check_param, check_operator, check_value para VerificarCondicionJob
 */
export function mapConditionsToBackend(storeNodes: ReactFlowNode[]): ConditionData[] {
  return storeNodes
    .filter((n) => n.type === 'conditional')
    .map((n) => {
      const data = n.data as any
      const condition = data.condition || {}

      // Inferir check_param según condition_type si no está definido
      const conditionType = condition.type || 'email_opened'
      const defaultCheckParam = getDefaultCheckParamForConditionType(conditionType)

      return {
        id: n.id,
        type: 'condition', // Backend expects this field
        label: data.label || 'Condition',
        description: data.description || '',
        condition_type: conditionType,
        condition_label: condition.label || '',
        yes_label: data.yesLabel || 'Sí',
        no_label: data.noLabel || 'No',
        // Campos de evaluación - CRÍTICOS para VerificarCondicionJob
        check_param: condition.check_param || defaultCheckParam,
        check_operator: condition.check_operator || '>',
        check_value: condition.check_value ?? '0',
      }
    })
}

/**
 * Obtiene el check_param por defecto según el tipo de condición
 */
function getDefaultCheckParamForConditionType(conditionType: string): string {
  switch (conditionType) {
    case 'email_opened':
      return 'Views'
    case 'link_clicked':
      return 'Clicks'
    case 'email_bounced':
      return 'Bounces'
    case 'unsubscribed':
      return 'Unsubscribes'
    default:
      return 'Views'
  }
}

/**
 * Mapea edges a estructura de ramas del backend
 * IMPORTANTE: Guarda TODAS las conexiones, no solo las de nodos condicionales
 */
export function mapBranchesToBackend(
  storeEdges: CustomEdge[],
  storeNodes: ReactFlowNode[]
): BranchData[] {
  return storeEdges.map((e) => {
    const sourceNode = storeNodes.find((n) => n.id === e.source)
    const isConditional = sourceNode?.type === 'conditional'

    return {
      edge_id: e.id,
      source_node_id: e.source,
      target_node_id: e.target,
      source_handle: e.sourceHandle || null,
      target_handle: e.targetHandle || null,
      // Solo marcar condition_branch si es de un nodo condicional
      condition_branch: isConditional && e.sourceHandle?.includes('yes') ? 'yes' : 'no',
    }
  })
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

/**
 * Estructura de un nodo final para el backend
 */
export interface EndNodeData {
  node_id: string
  label: string
  description: string | null
}

/**
 * Mapea nodos finales a la estructura que espera el backend
 * El backend necesita node_id, label y description - no solo el ID
 */
export function mapEndNodesToBackend(storeNodes: ReactFlowNode[]): EndNodeData[] {
  return storeNodes
    .filter((n) => n.type === 'end')
    .map((n) => {
      const data = n.data as { label?: string; description?: string }
      return {
        node_id: n.id,
        label: data.label || 'Fin',
        description: data.description || null,
      }
    })
}
