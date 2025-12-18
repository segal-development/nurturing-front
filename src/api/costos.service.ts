/**
 * CostosService
 * Handles all API calls related to cost tracking and estimation
 */

import { apiClient } from './client'

/**
 * Cost breakdown by channel
 */
export interface CostoDesglose {
  costo_emails: number
  costo_sms: number
  costo_total: number
  total_emails?: number
  total_sms?: number
}

/**
 * Pricing configuration
 */
export interface Precios {
  email: number
  sms: number
}

/**
 * Estimated cost for a flow
 */
export interface CostoEstimado {
  flujo_id: number
  flujo_nombre: string
  cantidad_prospectos: number
  precios: Precios
  resumen: {
    total_etapas_email: number
    total_etapas_sms: number
    costo_emails: number
    costo_sms: number
    costo_total: number
  }
  detalle_etapas: Array<{
    etapa_id: string
    label: string
    tipo: string
    costo_unitario: number
    cantidad_envios: number
    costo_total: number
  }>
}

/**
 * Cost for an execution
 */
export interface CostoEjecucion {
  ejecucion_id: number
  flujo_id: number
  estado: string
  costo_estimado: number | null
  costo_real: number | null
  costo_emails: number | null
  costo_sms: number | null
  total_emails_enviados: number | null
  total_sms_enviados: number | null
  diferencia?: number | null
  nota?: string | null
}

/**
 * Dashboard stats
 */
export interface CostoDashboardStats {
  periodo: {
    fecha_inicio: string
    fecha_fin: string
  }
  precios_actuales: Precios
  resumen: {
    costo_total: number
    costo_emails: number
    costo_sms: number
    total_emails: number
    total_sms: number
    total_ejecuciones: number
  }
  comparacion_estimado_real: {
    total_estimado: number
    total_real: number
    diferencia_porcentaje: number
  }
  costos_por_dia: Array<{
    fecha: string
    costo_total: number
    costo_emails: number
    costo_sms: number
    ejecuciones: number
  }>
  costos_por_flujo: Array<{
    flujo_id: number
    flujo_nombre: string
    costo_total: number
    costo_emails: number
    costo_sms: number
    total_emails: number
    total_sms: number
    ejecuciones: number
  }>
}

/**
 * Costos API response wrapper
 */
interface ApiResponse<T> {
  error: boolean
  data: T
  message?: string
}

class CostosService {
  /**
   * Get current pricing configuration
   */
  async getPrecios(): Promise<Precios> {
    const response = await apiClient.get<ApiResponse<Precios>>('/costos/precios')
    return response.data.data
  }

  /**
   * Get cost for a single node/stage type
   */
  getCostoNodo(tipo: 'email' | 'sms', precios: Precios): number {
    return tipo === 'email' ? precios.email : precios.sms
  }

  /**
   * Calculate estimated cost for a flow
   * 
   * @param flujoId - Flow ID
   * @param cantidadProspectos - Number of prospects
   */
  async getCostoEstimado(flujoId: number, cantidadProspectos: number): Promise<CostoEstimado> {
    const response = await apiClient.get<ApiResponse<CostoEstimado>>(
      `/flujos/${flujoId}/costo-estimado`,
      {
        params: { cantidad_prospectos: cantidadProspectos },
      }
    )
    return response.data.data
  }

  /**
   * Get cost for a specific execution
   */
  async getCostoEjecucion(ejecucionId: number): Promise<CostoEjecucion> {
    const response = await apiClient.get<ApiResponse<CostoEjecucion>>(
      `/ejecuciones/${ejecucionId}/costo`
    )
    return response.data.data
  }

  /**
   * Recalculate cost for a completed execution
   */
  async recalcularCosto(ejecucionId: number): Promise<CostoDesglose> {
    const response = await apiClient.post<ApiResponse<CostoDesglose>>(
      `/ejecuciones/${ejecucionId}/recalcular-costo`
    )
    return response.data.data
  }

  /**
   * Get cost dashboard statistics
   */
  async getDashboard(fechaInicio?: string, fechaFin?: string): Promise<CostoDashboardStats> {
    const response = await apiClient.get<ApiResponse<CostoDashboardStats>>('/costos/dashboard', {
      params: {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      },
    })
    return response.data.data
  }

  /**
   * Format currency value for display
   */
  formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-'
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  /**
   * Format currency with decimals
   */
  formatCurrencyDecimal(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-'
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }
}

export const costosService = new CostosService()
export default costosService
