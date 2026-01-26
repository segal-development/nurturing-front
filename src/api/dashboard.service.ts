/**
 * Dashboard API Service
 * Obtiene estadísticas y datos para el dashboard
 */

import { apiClient } from './client'

// =============================================================================
// Types - Const Pattern for type safety
// =============================================================================

export interface ProspectoPorFlujo {
  flujo: string
  cantidad: number
}

export interface EnvioPorDia {
  fecha: string
  exitosos: number
  fallidos: number
}

/**
 * Estadísticas de calidad de emails
 * Cacheado en backend por 5 minutos para optimizar performance
 */
export interface CalidadEmails {
  total_prospectos: number
  con_email: number
  sin_email: number
  emails_validos: number
  emails_invalidos: number
  desuscritos: number
  tasa_validez: number
  ahorro_estimado: number
  costo_email: number
}

export interface DashboardStats {
  total_prospectos: number
  envios_hoy: number
  envios_programados: number
  ofertas_activas: number
  tasa_entrega: number
  prospectos_por_flujo: ProspectoPorFlujo[]
  envios_por_dia: EnvioPorDia[]
  calidad_emails: CalidadEmails
}

// =============================================================================
// Service
// =============================================================================

export const dashboardService = {
  /**
   * Obtiene todas las estadísticas del dashboard
   */
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/dashboard/stats')
    return response.data
  },
}
