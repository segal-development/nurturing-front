/**
 * Dashboard API Service
 * Obtiene estadísticas y datos para el dashboard
 */

import { apiClient } from './client'

export interface ProspectoPorFlujo {
  flujo: string
  cantidad: number
}

export interface EnvioPorDia {
  fecha: string
  exitosos: number
  fallidos: number
}

export interface DashboardStats {
  total_prospectos: number
  envios_hoy: number
  envios_programados: number
  ofertas_activas: number
  tasa_entrega: number
  prospectos_por_flujo: ProspectoPorFlujo[]
  envios_por_dia: EnvioPorDia[]
}

export const dashboardService = {
  /**
   * Obtiene todas las estadísticas del dashboard
   */
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/dashboard/stats')
    return response.data
  },
}
