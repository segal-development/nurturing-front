/**
 * Types for Flow Execution Tracking by Stage/Node
 * Detailed tracking of execution progress at the node level
 */

/**
 * Estado de la ejecución principal del flujo
 */
export type FlowExecutionMainState = 'pending' | 'in_progress' | 'paused' | 'completed' | 'failed' | 'cancelled'

/**
 * Estado de una etapa/nodo individual
 */
export type StageExecutionState = 'pending' | 'executing' | 'completed' | 'failed'

/**
 * Estadísticas de envíos para una etapa
 */
export interface StageEnvios {
  pendiente: number
  enviado: number
  fallido: number
  abierto: number
  clickeado: number
}

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
  envios?: StageEnvios
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
 * Progreso de ejecución del flujo
 */
export interface ExecutionProgress {
  total_etapas: number
  completadas: number
  fallidas: number
  en_ejecucion: number
  pendientes: number
  porcentaje: number
}

/**
 * Timeline de ejecución de un nodo (para mostrar cuándo se ejecutó)
 */
export interface ExecutionTimeline {
  node_id: string
  stage_id: number
  estado: 'pending' | 'executing' | 'completed' | 'failed'
  fecha_programada: string
  fecha_inicio?: string
  fecha_fin?: string
  duracion_segundos?: number
  orden_ejecucion: number // 1, 2, 3... para saber el orden
}

/**
 * Información de condición evaluada en ejecución
 */
export interface ExecutionConditionEvaluation {
  node_id: string
  condicion_id?: number
  resultado: boolean // true = siguió por el camino "sí", false = por el "no"
  fecha_evaluacion: string
  proxima_etapa_node_id?: string // El nodo que se ejecutará después
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
  error_message?: string
  prospectos_ids?: number[]
  progreso?: ExecutionProgress
  etapas: StageExecution[]
  jobs: ExecutionJob[]
  condiciones: EvaluatedCondition[]
  prospecto_ids?: number[]
  total_prospectos?: number
  error_mensaje?: string
  created_at?: string
  updated_at?: string
  // Timeline y evaluación de condiciones (nuevos)
  timeline?: ExecutionTimeline[]
  condiciones_evaluadas?: ExecutionConditionEvaluation[]
  nodo_actual?: string // ID del nodo que se está ejecutando ahora
  proximo_nodo?: string // ID del nodo que se ejecutará después
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

/**
 * Información resumida de una ejecución activa
 */
export interface ActiveExecutionInfo {
  id: number
  estado: FlowExecutionMainState
  nodo_actual?: string
  proximo_nodo?: string
  fecha_proximo_nodo?: string
  fecha_inicio: string
  progreso?: {
    porcentaje: number
    completadas: number
    total: number
    en_ejecucion: number
    pendientes: number
    fallidas: number
  }
}

/**
 * Respuesta al verificar si hay ejecución activa
 */
export interface ActiveExecutionResponse {
  tiene_ejecucion_activa: boolean
  ejecucion: ActiveExecutionInfo | null
}

/**
 * Etapa de una ejecución en el listado (viene con el GET /flujos/:id/ejecuciones)
 */
export interface ExecutionStageItem {
  id: number
  node_id: string
  estado: StageExecutionState
  ejecutado: boolean
  fecha_programada: string
  fecha_ejecucion?: string
  error_mensaje?: string
  created_at?: string
  updated_at?: string
}

/**
 * Ejecución en el listado (viene con el GET /flujos/:id/ejecuciones)
 */
export interface ExecutionListItem {
  id: number
  flujo_id: number
  estado: FlowExecutionMainState
  fecha_inicio_programada?: string
  fecha_inicio_real?: string
  fecha_fin?: string
  created_at?: string
  updated_at?: string
  etapas?: ExecutionStageItem[]
  // Campos adicionales que puede traer el backend
  origen_id?: string
  prospectos_ids?: number[]
  error_message?: string
}

/**
 * Response from GET /flujos/:id/ejecuciones
 * Returns list of all executions with their stages
 */
export interface FlowExecutionsListResponse {
  error: boolean
  data: ExecutionListItem[]
  mensaje?: string
}
