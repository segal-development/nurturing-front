/**
 * Types for Flow Builder visual editor
 * Defines node types, edges, and state management for ReactFlow
 */

import type { Node, Edge } from 'reactflow'
import type { TipoMensaje } from '@/types/flujo'
import type { StageEnvios } from '@/types/flowExecutionTracking'

/**
 * Base execution state data for all nodes during flow execution
 */
export interface ExecutionStateData {
  executionState?: 'pending' | 'executing' | 'completed' | 'failed'
  executionDate?: string
  errorMessage?: string
  envios?: StageEnvios
  stageId?: number
}

/**
 * Condition for branching logic in flows
 * 
 * Supported check_param values from AthenaCampaign API:
 * - Views: Number of email opens
 * - Clicks: Number of link clicks  
 * - Bounces: Number of bounced emails
 * - Unsubscribes: Number of unsubscribes (requires custom tracking)
 */
export interface FlowCondition {
  id: string
  label: string // e.g., "Vieron el email", "Hicieron click"
  type: 'email_opened' | 'link_clicked' | 'email_bounced' | 'unsubscribed' | 'custom'
  value?: string
  check_param?: 'Views' | 'Clicks' | 'Bounces' | 'Unsubscribes' | string // Metric to check
  check_operator?: '>' | '>=' | '==' | '!=' | '<' | '<=' | 'in' | 'not_in' // Comparison operator
  check_value?: string // '0', '1', '0,1,2' - Expected value(s)
}

/**
 * Custom node data for different stage types
 */
export interface StageNodeData extends ExecutionStateData {
  label: string
  tipo_mensaje?: TipoMensaje
  dia_envio?: number // Days after flow start (deprecated, use tiempo_espera)
  tiempo_espera?: number // Days to wait before executing this stage (from NOW when previous stage completes)
  tiempo_verificacion_condicion?: number // Hours to wait before checking condition (default: 24)
  fecha_inicio_personalizada?: string // Optional custom start date (ISO format)
  // Plantilla support: can use either reference (ID) or inline text
  plantilla_id?: number // Reference to saved plantilla (SMS or Email)
  plantilla_id_email?: number // For tipo_mensaje='ambos': Email plantilla ID
  plantilla_mensaje?: string // Fallback: inline template content
  plantilla_type?: 'reference' | 'inline' // Which type is being used
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

export interface InitialNodeData extends ExecutionStateData {
  label: string
  origen_id?: string
  origen_nombre?: string
  prospectos_count?: number
}

/**
 * Conditional node for branching logic (e.g., "Did user open email?")
 * Creates multiple outgoing edges with different conditions
 */
export interface ConditionalNodeData extends ExecutionStateData {
  label: string
  description?: string
  condition: FlowCondition
  yesLabel?: string // Label for "true" edge (e.g., "Abierto")
  noLabel?: string // Label for "false" edge (e.g., "No abierto")
}

/**
 * End node to mark flow completion
 */
export interface EndNodeData extends ExecutionStateData {
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
  // Plantilla: either ID reference or inline content
  plantilla_id?: number // Reference to saved plantilla
  plantilla_id_email?: number // For tipo_mensaje='ambos': Email plantilla ID
  plantilla_mensaje?: string // Inline template content (fallback)
  plantilla_type?: 'reference' | 'inline' // Which type is being used
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
