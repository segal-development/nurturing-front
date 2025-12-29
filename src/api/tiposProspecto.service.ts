/**
 * Tipos de Prospecto Service
 * Handles fetching prospect types (debt categories) from the backend
 */

import { apiClient } from './client'

// ============================================================================
// TYPES
// ============================================================================

export interface TipoProspecto {
  id: number
  nombre: string
  descripcion: string | null
  monto_min: number | null
  monto_max: number | null
  orden: number
}

export interface TiposProspectoResponse {
  data: TipoProspecto[]
}

// ============================================================================
// SERVICE
// ============================================================================

export const tiposProspectoService = {
  /**
   * Get all active tipos de prospecto
   * These are used to categorize prospects by debt amount
   */
  async getAll(): Promise<TipoProspecto[]> {
    const response = await apiClient.get<TiposProspectoResponse>('/tipos-prospecto')
    return response.data.data
  },
}
