/**
 * Types for Flow Execution Monitoring
 * Real-time tracking of flow execution status and events
 */

/**
 * Estado de ejecución del flujo
 */
export type FlowExecutionState = 'pendiente' | 'en_progreso' | 'completado' | 'cancelado' | 'error'

/**
 * Tipo de evento durante la ejecución
 */
export type ExecutionEventType =
  | 'inicio'
  | 'etapa_iniciada'
  | 'envio_iniciado'
  | 'envio_completado'
  | 'envio_fallido'
  | 'etapa_completada'
  | 'completado'
  | 'cancelado'
  | 'error'

/**
 * Un evento individual durante la ejecución
 */
export interface ExecutionEvent {
  id: string
  flujo_id: number
  tipo: ExecutionEventType
  timestamp: string
  mensaje: string
  datos?: {
    envio_id?: number
    prospecto_id?: number
    etapa_id?: number
    error?: string
    [key: string]: any
  }
}

/**
 * Métricas actuales de la ejecución
 */
export interface ExecutionMetrics {
  total_prospectos: number
  total_enviados: number
  total_fallidos: number
  total_pendientes: number
  tasa_exito: number // porcentaje
  tiempo_promedio_ms: number
  tiempo_estimado_restante_ms: number
}

/**
 * Estado completo de la ejecución de un flujo
 */
export interface FlowExecution {
  id: string
  flujo_id: number
  estado: FlowExecutionState
  fecha_inicio: string
  fecha_fin?: string
  metricas: ExecutionMetrics
  eventos: ExecutionEvent[]
  cancelado_por?: string // user ID que canceló
  error_mensaje?: string
}

/**
 * Respuesta del API para estado de ejecución
 */
export interface FlowExecutionResponse {
  ejecucion: FlowExecution
  proxima_actualizacion_ms: number // cuando consultar de nuevo
}

/**
 * Payload para iniciar ejecución de flujo
 */
export interface StartFlowExecutionPayload {
  flujo_id: number
  prospecto_ids?: number[] // si no se proporciona, usa todos los prospects del flujo
  modo_simulacion?: boolean
}

/**
 * Respuesta al iniciar ejecución
 */
export interface StartFlowExecutionResponse {
  ejecucion_id: string
  flujo_id: number
  estado: FlowExecutionState
  timestamp: string
}

// ============================================================================
// BATCHING TYPES
// ============================================================================

/**
 * Estado del batching
 */
export type BatchingStatus = 'in_progress' | 'completed' | 'failed' | 'partial_failure'

/**
 * Información de un lote individual
 */
export interface BatchInfo {
  batch_number: number
  prospectos_count: number
  completed_at: string | null
  failed_at: string | null
  error: string | null
  response: {
    exitosos: number
    errores: number
  } | null
  status: 'pending' | 'completed' | 'failed'
}

/**
 * Progreso de batching para una etapa
 */
export interface EtapaBatchingInfo {
  etapa_id: number
  node_id: string
  estado_etapa: string
  has_batching: boolean
  status?: BatchingStatus
  progress?: {
    total_batches: number
    batches_completed: number
    batches_pending: number
    percentage: number
  }
  prospectos?: {
    total: number
    enviados: number
    pendientes: number
  }
  timing?: {
    started_at: string | null
    completed_at: string | null
    estimated_completion: string | null
  }
  batches?: BatchInfo[]
}

/**
 * Resumen de batching para la ejecución completa
 */
export interface BatchingSummary {
  total_etapas_con_batching: number
  status: BatchingStatus | 'none'
  batches?: {
    total: number
    completed: number
    pending: number
    percentage: number
  }
  prospectos?: {
    total: number
    enviados: number
    pendientes: number
  }
}

/**
 * Respuesta del endpoint de batching status
 */
export interface BatchingStatusResponse {
  error: boolean
  data: {
    has_batching: boolean
    mensaje?: string
    resumen?: BatchingSummary
    etapas?: EtapaBatchingInfo[]
  }
}
