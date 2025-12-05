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
