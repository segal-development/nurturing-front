/**
 * Types for Flow Builder visual editor
 * Defines node types, edges, and state management for ReactFlow
 */

import type { Node, Edge } from 'reactflow'
import type { TipoMensaje } from '@/types/flujo'

/**
 * Condition for branching logic in flows
 */
export interface FlowCondition {
  id: string
  label: string // e.g., "Vieron el email", "Hicieron click"
  type: 'email_opened' | 'link_clicked' | 'custom'
  value?: string
}

/**
 * Custom node data for different stage types
 */
export interface StageNodeData {
  label: string
  tipo_mensaje?: TipoMensaje
  dia_envio?: number // Days after flow start
  fecha_inicio_personalizada?: string // Optional custom start date (ISO format)
  plantilla_mensaje?: string
  oferta_infocom_id?: number
  oferta?: {
    id: number
    titulo: string
  }
  activo?: boolean
}

export interface OfferNodeData {
  label: string
  titulo: string
  descuento: number
  fecha_inicio: string
  fecha_fin: string
}

export interface InitialNodeData {
  label: string
  origen_id?: string
  origen_nombre?: string
  prospectos_count?: number
}

/**
 * Conditional node for branching logic (e.g., "Did user open email?")
 * Creates multiple outgoing edges with different conditions
 */
export interface ConditionalNodeData {
  label: string
  description?: string
  condition: FlowCondition
  yesLabel?: string // Label for "true" edge (e.g., "Abierto")
  noLabel?: string // Label for "false" edge (e.g., "No abierto")
}

/**
 * End node to mark flow completion
 */
export interface EndNodeData {
  label: string
  description?: string
}

/**
 * Flow node types in the visual editor
 */
export type NodeType = 'initial' | 'stage' | 'offer' | 'conditional' | 'end'

/**
 * Custom node definition
 */
export type CustomNode = Node<
  StageNodeData | OfferNodeData | InitialNodeData | ConditionalNodeData | EndNodeData,
  NodeType
>

/**
 * Custom edge definition with optional condition metadata
 */
export interface CustomEdgeData {
  label?: string
  condition?: FlowCondition
  conditionType?: 'yes' | 'no' // For conditional branching
}

export type CustomEdge = Edge<CustomEdgeData>

/**
 * Flow Builder state - represents the entire flow configuration
 */
export interface FlowBuilderState {
  nodes: CustomNode[]
  edges: CustomEdge[]
  flowName: string
  flowDescription: string
  tipoDeudor: string
  selectedOriginId: string | null
  selectedProspectos: Set<number>
  distributionConfig: {
    tipoMensaje: TipoMensaje
    emailPercentage: number
    costEmail: number
    costSms: number
  }
}

/**
 * Pending flow action for useOptimistic
 */
export interface PendingFlowAction {
  type: 'addNode' | 'removeNode' | 'updateNode' | 'addEdge' | 'removeEdge' | 'saveFlow'
  payload: any
  timestamp: number
}

/**
 * Flow validation result
 */
export interface FlowValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Serialized stage from visual builder to backend format
 * This is what the backend expects to create EtapaFlujo records
 */
export interface SerializedStage {
  id: string // Temporal ID from node
  label: string
  dia_envio: number
  tipo_mensaje: TipoMensaje
  plantilla_mensaje: string
  oferta_infocom_id?: number
  activo: boolean
  fecha_inicio_personalizada?: string // Custom date override
}

/**
 * Serialized conditional branch
 */
export interface SerializedConditionalBranch {
  conditionNodeId: string
  condition: FlowCondition
  trueStageIds: string[] // Stages that execute on "yes"
  falseStageIds: string[] // Stages that execute on "no"
}

/**
 * Complete flow configuration serialized for backend
 * This represents the visual flow in a format the backend can interpret
 */
export interface SerializedFlowConfig {
  nombre: string
  descripcion?: string
  stages: SerializedStage[] // Linear order of stages
  branches?: SerializedConditionalBranch[] // Optional conditional logic
  nodeMap: {
    // Map to help backend understand the visual layout
    [nodeId: string]: {
      type: NodeType
      nextNodeIds: string[] // IDs of nodes this connects to
    }
  }
}

/**
 * Flow execution configuration
 */
export interface FlowExecutionConfig {
  flowId?: number
  flowName: string
  flowDescription?: string
  tipoDeudor: string
  selectedProspectos: number[]
  stages: SerializedStage[]
  branches?: SerializedConditionalBranch[]
  totalCost: number
  estimatedTime: string // "3 days" format
}
