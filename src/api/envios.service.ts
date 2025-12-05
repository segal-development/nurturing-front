/**
 * EnviosService
 * Handles all API calls related to shipments (emails and SMS)
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles Envios API calls
 * - Open/Closed: Easy to extend with new endpoints
 * - Interface Segregation: Focused method contracts
 * - Dependency Inversion: Depends on HTTP client abstraction
 */

import type {
  Envio,
  EnviosDailyStatsResponse,
  EnviosTodayStats,
  EnviosFlowStatsResponse,
  EnviosListResponse,
  EnviosFilters,
} from '@/types/envios'
import { apiClient } from './client'

const BASE_URL = '/api/envios'

/**
 * EnviosService class
 * Provides methods to interact with shipment endpoints
 */
class EnviosService {
  /**
   * Get daily statistics for a date range
   *
   * @param fechaInicio - Start date (YYYY-MM-DD)
   * @param fechaFin - End date (YYYY-MM-DD)
   * @returns Daily statistics grouped by date
   *
   * @example
   * const stats = await enviosService.getDailyStats('2025-01-01', '2025-01-31')
   */
  async getDailyStats(
    fechaInicio: string,
    fechaFin: string,
  ): Promise<EnviosDailyStatsResponse> {
    const response = await apiClient.get<EnviosDailyStatsResponse>(
      `${BASE_URL}/estadisticas`,
      {
        params: {
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
        },
      },
    )
    return response.data
  }

  /**
   * Get today's shipment summary
   *
   * @returns Statistics for current day with breakdown by state and channel
   *
   * @example
   * const todayStats = await enviosService.getTodayStats()
   */
  async getTodayStats(): Promise<EnviosTodayStats> {
    const response = await apiClient.get<EnviosTodayStats>(`${BASE_URL}/estadisticas/hoy`)
    return response.data
  }

  /**
   * Get shipments grouped by flow
   *
   * @param fechaInicio - Start date (YYYY-MM-DD)
   * @param fechaFin - End date (YYYY-MM-DD)
   * @returns Statistics grouped by flow
   *
   * @example
   * const flowStats = await enviosService.getFlowStats('2025-01-01', '2025-01-31')
   */
  async getFlowStats(
    fechaInicio: string,
    fechaFin: string,
  ): Promise<EnviosFlowStatsResponse> {
    const response = await apiClient.get<EnviosFlowStatsResponse>(
      `${BASE_URL}/contador-por-flujo`,
      {
        params: {
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
        },
      },
    )
    return response.data
  }

  /**
   * Get paginated list of shipments with filtering
   *
   * @param filters - Filter options (estado, canal, flujo_id, fecha_desde, fecha_hasta, pagina, por_pagina)
   * @returns Paginated list of shipments
   *
   * @example
   * const envios = await enviosService.list({
   *   estado: 'enviado',
   *   canal: 'email',
   *   flujo_id: 1,
   *   pagina: 1,
   *   por_pagina: 50
   * })
   */
  async list(filters: EnviosFilters = {}): Promise<EnviosListResponse> {
    const params = {
      pagina: filters.pagina || 1,
      por_pagina: filters.por_pagina || 50,
      ...(filters.estado && { estado: filters.estado }),
      ...(filters.canal && { canal: filters.canal }),
      ...(filters.flujo_id && { flujo_id: filters.flujo_id }),
      ...(filters.fecha_desde && { fecha_desde: filters.fecha_desde }),
      ...(filters.fecha_hasta && { fecha_hasta: filters.fecha_hasta }),
    }

    const response = await apiClient.get<EnviosListResponse>(`${BASE_URL}`, { params })
    return response.data
  }

  /**
   * Get complete details of a single shipment
   *
   * @param envioId - ID of the shipment
   * @returns Detailed shipment information including prospect and flow data
   *
   * @example
   * const envio = await enviosService.getDetail(123)
   */
  async getDetail(envioId: number): Promise<Envio> {
    const response = await apiClient.get<Envio>(`${BASE_URL}/${envioId}`)
    return response.data
  }
}

/**
 * Singleton instance of EnviosService
 * Use this throughout the application
 */
export const enviosService = new EnviosService()

export default enviosService
