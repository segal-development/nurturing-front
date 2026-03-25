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
export type StageExecutionState = 'pending' | 'executing' | 'completed' | 'failed' | 'paused'

/**
 * Estadísticas de envíos para una etapa
 */
export interface StageEnvios {
  pendiente: number
  enviado: number // Total envío records (backwards compat)
  prospectos_alcanzados: number // Unique prospectos that received at least one message
  fallido: number
  abierto: number
  clickeado: number
}

/**
 * Circuit breaker pause reason (matches backend's pause_reason JSON structure)
 */
export interface PauseReason {
  type: 'circuit_breaker' | 'manual' | 'rate_limit'
  service: string // 'email' | 'sms' | 'athena' etc.
  message: string
  opened_at: string // ISO datetime when the pause started
  auto_resume_at?: string // ISO datetime when it will auto-resume
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
  // Circuit breaker pause fields
  pause_reason?: PauseReason
  paused_at?: string
  auto_resume_at?: string
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
  prospectos_ids?: number[] // DEPRECATED: Backend now sends prospectos_count instead
  prospectos_count?: number
  progreso?: ExecutionProgress
  progreso_envios?: ProgresoEnvios
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
/**
 * Progreso detallado de envíos
 */
export interface ProgresoEnvios {
  total_prospectos: number
  procesados: number
  exitosos: number
  fallidos: number
  pendientes: number
  porcentaje: number
  velocidad_por_hora: number
  tiempo_restante_horas: number
  tiempo_restante_texto: string
}

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
  progreso_envios?: ProgresoEnvios
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
  prospectos_ids?: number[] // DEPRECATED: Backend now sends prospectos_count instead
  prospectos_count?: number
  error_message?: string
  // Campos de costo
  costo_estimado?: number | null
  costo_real?: number | null
  costo_emails?: number | null
  costo_sms?: number | null
  total_emails_enviados?: number | null
  total_sms_enviados?: number | null
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

/**
 * Detalle de una cohorte individual
 */
export interface CohorteDetalle {
  ejecucion_id: number
  estado: StageExecutionState
  prospectos: number
  fecha_programada?: string
  created_at: string
}

/**
 * Resumen de cohortes por nodo (para mostrar en StageNode)
 */
export interface CohorteResumenNodo {
  node_id: string
  total_cohortes: number
  cohortes_completadas: number
  cohortes_procesando: number
  cohortes_pendientes: number
  total_prospectos: number
  prospectos_procesados: number
  prospectos_pendientes: number
  detalle_cohortes: CohorteDetalle[]
}

/**
 * Información de una cohorte activa
 */
export interface CohorteActiva {
  id: number
  created_at: string
  estado: FlowExecutionMainState
  estado_legible: string
  prospectos_count: number
  progreso: number
  etapas_completadas: number
  etapas_total: number
  nodo_actual?: string
  proximo_nodo?: string
  fecha_proximo_nodo?: string
  origen: string // 'manual' | 'auto_asignar_nuevos'
}

/**
 * Último ingreso de prospectos a un flujo (para mostrar en panel)
 */
export interface UltimoIngreso {
  ejecucion_id: number
  fecha: string
  fecha_legible: string
  prospectos_count: number
  origen: string
  origen_label: string
  estado: string
}

/**
 * Nuevos prospectos del último sync de Sysgal para este flujo
 */
export interface NuevosUltimoSync {
  count: number
  fecha: string
  fecha_legible: string
  nivel_deuda: string
  origen: string
}

/**
 * Response from GET /flujos/:id/cohortes-activas
 */
export interface CohortesActivasResponse {
  error: boolean
  data: {
    total_cohortes: number
    cohortes: CohorteActiva[]
    resumen_por_nodo: Record<string, CohorteResumenNodo>
    ultimos_ingresos?: UltimoIngreso[]
    nuevos_ultimo_sync?: NuevosUltimoSync
  }
}

// ============================================================================
// Cohort Prospects Drilldown Types
// ============================================================================

/**
 * Valid envio status values for filtering
 */
export const ENVIO_ESTADO = {
  PENDIENTE: 'pendiente',
  ENVIADO: 'enviado',
  FALLIDO: 'fallido',
  ABIERTO: 'abierto',
  CLICKEADO: 'clickeado',
} as const

export type EnvioEstado = (typeof ENVIO_ESTADO)[keyof typeof ENVIO_ESTADO]

/**
 * Aggregated send statistics for a prospect
 * NOTE: Backend returns plural field names (enviados, fallidos, abiertos, clickeados)
 */
export interface EnviosResumen {
  pendientes: number
  enviados: number
  fallidos: number
  abiertos: number
  clickeados: number
}

/**
 * Most recent send information for a prospect
 */
export interface UltimoEnvio {
  estado: EnvioEstado
  fecha: string // ISO 8601
  etapa_node_id: string
}

/**
 * Individual prospect within a cohort
 */
export interface CohortProspecto {
  id: number
  nombre: string
  email: string
  telefono: string | null
  ultima_etapa_node_id: string | null
  envios_resumen: EnviosResumen
  ultimo_envio: UltimoEnvio | null
}

/**
 * Pagination metadata for cohort prospects response
 */
export interface CohortProspectosMeta {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

/**
 * Response from GET /flujos/{flujo}/ejecuciones/{ejecucion}/prospectos
 */
export interface CohortProspectosResponse {
  error: boolean
  data: CohortProspecto[]
  meta: CohortProspectosMeta
}

/**
 * Query params for cohort prospects endpoint
 */
export interface CohortProspectosParams {
  page?: number
  per_page?: number
  node_id?: string
  envio_estado?: EnvioEstado
  search?: string
}

/**
 * Filter state for cohort prospects UI
 */
export interface CohortProspectFilters {
  node_id?: string
  envio_estado?: EnvioEstado
  search?: string
}
