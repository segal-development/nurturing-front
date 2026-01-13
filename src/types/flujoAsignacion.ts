/**
 * Types para el tracking de asignación de prospectos a flujos.
 *
 * Cuando se crean flujos con >100 prospectos, el backend procesa
 * la asignación en background y expone un endpoint de progreso.
 *
 * @see Backend: AsignarProspectosAFlujoJob
 * @see Endpoint: GET /flujos/{flujo}/progreso
 */

// ============================================================================
// Estados de Procesamiento
// ============================================================================

/**
 * Estados posibles del procesamiento de asignación de prospectos.
 * Sincronizado con el campo `estado_procesamiento` del modelo Flujo en backend.
 */
export type EstadoProcesamientoFlujo =
  | 'pendiente'    // Esperando inicio
  | 'procesando'   // En progreso
  | 'completado'   // Finalizado exitosamente
  | 'fallido'      // Error durante procesamiento

/**
 * Configuración de UI para cada estado de procesamiento.
 */
export interface EstadoProcesamientoConfig {
  readonly estado: EstadoProcesamientoFlujo
  readonly label: string
  readonly description: string
  readonly colorClass: string
  readonly bgClass: string
  readonly icon: 'clock' | 'loader' | 'check' | 'x'
  readonly animate: boolean
}

/**
 * Mapa inmutable de configuración para cada estado.
 */
export const ESTADO_PROCESAMIENTO_CONFIG: Readonly<Record<EstadoProcesamientoFlujo, EstadoProcesamientoConfig>> = {
  pendiente: {
    estado: 'pendiente',
    label: 'En cola',
    description: 'Esperando inicio del procesamiento',
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-50 border-amber-200',
    icon: 'clock',
    animate: false,
  },
  procesando: {
    estado: 'procesando',
    label: 'Procesando',
    description: 'Asignando prospectos al flujo',
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-50 border-blue-200',
    icon: 'loader',
    animate: true,
  },
  completado: {
    estado: 'completado',
    label: 'Completado',
    description: 'Todos los prospectos fueron asignados',
    colorClass: 'text-green-600',
    bgClass: 'bg-green-50 border-green-200',
    icon: 'check',
    animate: false,
  },
  fallido: {
    estado: 'fallido',
    label: 'Error',
    description: 'Falló la asignación de prospectos',
    colorClass: 'text-red-600',
    bgClass: 'bg-red-50 border-red-200',
    icon: 'x',
    animate: false,
  },
} as const

// ============================================================================
// Progreso de Asignación
// ============================================================================

/**
 * Detalles del progreso de asignación de prospectos.
 * Refleja la estructura de `metadata.progreso` en el modelo Flujo.
 */
export interface ProgresoAsignacion {
  /** Cantidad de prospectos ya asignados */
  readonly procesados: number

  /** Total de prospectos a asignar */
  readonly total: number

  /** Porcentaje completado (0-100) */
  readonly porcentaje: number

  /** Chunk actual siendo procesado */
  readonly chunk_actual: number

  /** Total de chunks a procesar */
  readonly total_chunks: number

  /** Prospectos procesados por segundo */
  readonly velocidad_por_segundo: number

  /** Segundos transcurridos desde inicio */
  readonly segundos_transcurridos: number

  /** Segundos estimados hasta completar (null si no calculable) */
  readonly segundos_restantes_estimados: number | null

  /** Timestamp de inicio (ISO 8601) */
  readonly inicio: string | null

  /** Timestamp de fin (ISO 8601, null si no completado) */
  readonly fin: string | null

  /** Última actualización del progreso (ISO 8601) */
  readonly ultima_actualizacion: string | null
}

/**
 * Valores por defecto para progreso vacío.
 */
export const PROGRESO_ASIGNACION_VACIO: Readonly<ProgresoAsignacion> = {
  procesados: 0,
  total: 0,
  porcentaje: 0,
  chunk_actual: 0,
  total_chunks: 0,
  velocidad_por_segundo: 0,
  segundos_transcurridos: 0,
  segundos_restantes_estimados: null,
  inicio: null,
  fin: null,
  ultima_actualizacion: null,
} as const

// ============================================================================
// Response del Endpoint
// ============================================================================

/**
 * Response del endpoint GET /flujos/{flujo}/progreso
 */
export interface FlujoProgresoResponse {
  readonly data: {
    /** ID del flujo */
    readonly flujo_id: number

    /** Estado actual del procesamiento */
    readonly estado: EstadoProcesamientoFlujo

    /** ¿Está activamente procesando? */
    readonly en_proceso: boolean

    /** ¿Finalizó exitosamente? */
    readonly completado: boolean

    /** ¿Falló el procesamiento? */
    readonly fallido?: boolean

    /** Detalles del progreso */
    readonly progreso: ProgresoAsignacion

    /** Mensaje human-readable del estado actual */
    readonly mensaje: string
  }
}

// ============================================================================
// Response de Creación con Async
// ============================================================================

/**
 * Response extendido cuando se crea un flujo con procesamiento async.
 * El campo `procesamiento_async` indica si el frontend debe hacer polling.
 */
export interface FlujoCreacionResponse {
  readonly mensaje: string
  readonly data: {
    readonly id: number
    readonly nombre: string
    readonly estado_procesamiento?: EstadoProcesamientoFlujo
    // ... otros campos del flujo
  }
  readonly resumen: {
    readonly total_prospectos: number
    readonly prospectos_email: number
    readonly prospectos_sms: number
    /** TRUE = backend procesa en background, hacer polling */
    readonly procesamiento_async: boolean
  }
  readonly costos: {
    readonly email_costo_unitario: number
    readonly sms_costo_unitario: number
    readonly costo_total_email: number
    readonly costo_total_sms: number
    readonly costo_total: number
  }
}

// ============================================================================
// Helpers / Type Guards
// ============================================================================

/**
 * Verifica si un estado indica procesamiento activo.
 */
export function isProcesamientoActivo(estado: EstadoProcesamientoFlujo): boolean {
  return estado === 'pendiente' || estado === 'procesando'
}

/**
 * Verifica si un estado indica procesamiento terminado.
 */
export function isProcesamientoTerminado(estado: EstadoProcesamientoFlujo): boolean {
  return estado === 'completado' || estado === 'fallido'
}

/**
 * Verifica si el procesamiento fue exitoso.
 */
export function isProcesamientoExitoso(estado: EstadoProcesamientoFlujo): boolean {
  return estado === 'completado'
}

/**
 * Obtiene la configuración de UI para un estado.
 */
export function getEstadoProcesamientoConfig(
  estado: EstadoProcesamientoFlujo | undefined
): EstadoProcesamientoConfig {
  if (!estado) return ESTADO_PROCESAMIENTO_CONFIG.pendiente
  return ESTADO_PROCESAMIENTO_CONFIG[estado] ?? ESTADO_PROCESAMIENTO_CONFIG.pendiente
}

/**
 * Formatea el tiempo restante en formato legible.
 * @param segundos - Segundos restantes
 * @returns String formateado (ej: "2m 30s", "45s")
 */
export function formatTiempoRestante(segundos: number | null): string {
  if (segundos === null || segundos <= 0) return ''

  if (segundos < 60) {
    return `${Math.round(segundos)}s`
  }

  const minutos = Math.floor(segundos / 60)
  const segs = Math.round(segundos % 60)

  if (minutos < 60) {
    return segs > 0 ? `${minutos}m ${segs}s` : `${minutos}m`
  }

  const horas = Math.floor(minutos / 60)
  const mins = minutos % 60
  return mins > 0 ? `${horas}h ${mins}m` : `${horas}h`
}

/**
 * Formatea la velocidad de procesamiento.
 * @param velocidad - Prospectos por segundo
 * @returns String formateado (ej: "5,000/s")
 */
export function formatVelocidadProcesamiento(velocidad: number): string {
  if (velocidad <= 0) return '---'
  return `${velocidad.toLocaleString('es-CL')}/s`
}
