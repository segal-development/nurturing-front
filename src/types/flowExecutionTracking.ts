/**
 * Types for Flow Execution Tracking by Stage/Node
 * Detailed tracking of execution progress at the node level
 */

/**
 * Estado de la ejecución principal del flujo
 */
export type FlowExecutionMainState = 'pending' | 'in_progress' | 'paused' | 'completed' | 'failed'

/**
 * Estado de una etapa/nodo individual
 */
export type StageExecutionState = 'pending' | 'executing' | 'completed' | 'failed'

/**
 * Información de ejecución de una etapa/nodo individual
 */
export interface StageExecution {
  id: number
  node_id: string
  estado: StageExecutionState
  fecha_programada: string
  fecha_ejecucion?: string
  message_id?: number
  response_athenacampaign?: any
  error_mensaje?: string
}

/**
 * Información de un job en la ejecución
 */
export interface ExecutionJob {
  id: number
  ejecucion_id: number
  tipo: 'email' | 'sms' | 'condition' | 'branch'
  estado: 'pending' | 'processing' | 'completed' | 'failed'
  fecha_creacion: string
  fecha_procesamiento?: string
  data: any
  resultado?: any
}

/**
 * Información de una condición evaluada
 */
export interface EvaluatedCondition {
  id: number
  condicion_id: number
  resultado: boolean
  fecha_evaluacion: string
  detalles?: any
}

/**
 * Detalles completos de una ejecución de flujo con tracking por etapa
 */
export interface FlowExecutionDetail {
  id: number
  flujo_id: number
  estado: FlowExecutionMainState
  fecha_inicio_programada: string
  fecha_inicio_real?: string
  fecha_fin?: string
  etapas: StageExecution[]
  jobs: ExecutionJob[]
  condiciones: EvaluatedCondition[]
  prospecto_ids?: number[]
  total_prospectos?: number
  error_mensaje?: string
}

/**
 * Respuesta del API para obtener ejecución con tracking
 */
export interface FlowExecutionDetailResponse {
  error: boolean
  data: FlowExecutionDetail
  message?: string
}

/**
 * Payload para pausar ejecución
 */
export interface PauseExecutionPayload {
  razon?: string
}

/**
 * Respuesta al pausar ejecución
 */
export interface PauseExecutionResponse {
  error: boolean
  data: {
    estado: 'paused'
    fecha_pausa: string
  }
  message?: string
}

/**
 * Respuesta al reanudar ejecución
 */
export interface ResumeExecutionResponse {
  error: boolean
  data: {
    estado: 'in_progress'
    fecha_reanudacion: string
  }
  message?: string
}

/**
 * Respuesta al cancelar ejecución
 */
export interface CancelExecutionResponse {
  error: boolean
  data: {
    estado: 'cancelled'
    fecha_cancelacion: string
  }
  message?: string
}

/**
 * Estadísticas de progreso por etapa
 */
export interface StageProgressStats {
  total_etapas: number
  etapas_completadas: number
  etapas_ejecutando: number
  etapas_pendientes: number
  etapas_fallidas: number
  porcentaje_completado: number
}

/**
 * Información del nodo del flujo (para visualización)
 */
export interface FlowNodeInfo {
  id: string
  label: string
  tipo: 'email' | 'sms' | 'condition' | 'branch' | 'end'
  posicion?: {
    x: number
    y: number
  }
}

/**
 * Visualización de ejecución con info del flujo
 */
export interface FlowExecutionVisualization {
  execution: FlowExecutionDetail
  nodes: FlowNodeInfo[]
  nodeStates: Record<string, StageExecutionState>
  stats: StageProgressStats
}
