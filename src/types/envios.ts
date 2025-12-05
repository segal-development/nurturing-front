/**
 * Types for Envios (Shipments) feature
 * Represents emails and SMS sent to prospects through flows
 */

import type { Prospecto } from './prospecto'
import type { FlujoNurturing, EtapaFlujo } from './flujo'

/**
 * State of an individual shipment
 */
export type EnvioEstado = 'pendiente' | 'enviado' | 'fallido'

/**
 * Communication channel used
 */
export type EnvioCanal = 'email' | 'sms'

/**
 * Main Envio (Shipment) entity
 * Represents a single email or SMS sent to a prospect
 */
export interface Envio {
  id: number
  flujo_id: number
  prospecto_id: number
  estado: EnvioEstado
  canal: EnvioCanal
  fecha_creacion: string
  fecha_enviado?: string
  contenido: string
  metadata: {
    error?: string
    destinatario: string
    asunto?: string
    [key: string]: any
  }
  prospecto?: Prospecto
  flujo?: FlujoNurturing
  etapa?: EtapaFlujo
}

/**
 * Daily statistics for a specific date
 */
export interface EnviosStats {
  fecha: string
  total: number
  exitosos: number
  fallidos: number
  pendientes: number
  email_count: number
  sms_count: number
}

/**
 * Statistics for a date range period
 */
export interface PeriodStats {
  fecha_inicio: string
  fecha_fin: string
  estadisticas: EnviosStats[]
  total_periodo: number
  total_exitosos: number
  total_fallidos: number
  total_pendientes: number
  email_total: number
  sms_total: number
}

/**
 * Statistics grouped by flow
 */
export interface EnviosFlowStats {
  flujo_id: number
  flujo_nombre: string
  total: number
  exitosos: number
  fallidos: number
  pendientes: number
  email_count: number
  sms_count: number
}

/**
 * Today's statistics summary
 */
export interface EnviosTodayStats {
  total: number
  pendiente: number
  enviado: number
  fallido: number
  email_count: number
  sms_count: number
}

/**
 * Paginated list response
 */
export interface EnviosListResponse {
  data: Envio[]
  meta: {
    total: number
    pagina: number
    por_pagina: number
    total_paginas: number
  }
}

/**
 * Filter options for envios list
 */
export interface EnviosFilters {
  estado?: EnvioEstado
  canal?: EnvioCanal
  flujo_id?: number
  fecha_desde?: string
  fecha_hasta?: string
  pagina?: number
  por_pagina?: number
}

/**
 * Query response for statistics by day
 */
export interface EnviosDailyStatsResponse {
  periodo: {
    fecha_inicio: string
    fecha_fin: string
  }
  estadisticas: EnviosStats[]
  resumen: {
    total: number
    exitosos: number
    fallidos: number
    pendientes: number
  }
}

/**
 * Response for flow statistics
 */
export interface EnviosFlowStatsResponse {
  periodo: {
    fecha_inicio: string
    fecha_fin: string
  }
  estadisticas: EnviosFlowStats[]
  resumen: {
    total_flujos: number
    total_envios: number
    total_exitosos: number
    total_fallidos: number
  }
}
