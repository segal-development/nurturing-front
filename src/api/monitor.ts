import { apiClient } from './client'

/**
 * Monitor statistics interface
 * Aggregates data from flujos, ofertas, and envios
 */
export interface MonitorStats {
  totalProspectos: number
  flujosActivos: number
  ofertasActivas: number
  enviosProgramados: number
  enviosEnviadosHoy: number
  enviosEnviadosTotales: number
  tasaEntrega: string
  flujosPorTipo: Record<string, number>
}

/**
 * API layer for Monitor
 * Handles aggregated statistics and monitoring endpoints
 */
export const monitorApi = {
  /**
   * Get comprehensive monitor statistics
   * Aggregates data from multiple sources
   */
  async getStats(): Promise<MonitorStats> {
    const response = await apiClient.get<MonitorStats>('/monitor/stats')
    return response.data
  },
}
