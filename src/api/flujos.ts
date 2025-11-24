import type { FlujoNurturing, FlujoFormData } from '@/types/flujo'
import { apiClient } from './client'

interface FlujoFilters {
  tipoProspecto?: string
  activo?: boolean
}

interface FlujoResponse {
  data: FlujoNurturing[]
  total: number
}

/**
 * API layer for Flujos (Nurturing Flows)
 * Handles all CRUD operations for flujos
 */
export const flujoApi = {
  /**
   * Get all flujos with optional filters
   */
  async getAll(filters?: FlujoFilters) {
    const params = new URLSearchParams()
    if (filters?.tipoProspecto) {
      params.append('tipoProspecto', filters.tipoProspecto)
    }
    if (filters?.activo !== undefined) {
      params.append('activo', String(filters.activo))
    }

    const response = await apiClient.get<FlujoResponse>('/flujos', { params })
    return response.data.data
  },

  /**
   * Get a single flujo by ID
   */
  async getById(id: number) {
    const response = await apiClient.get<FlujoNurturing>(`/flujos/${id}`)
    return response.data
  },

  /**
   * Create a new flujo
   */
  async create(data: FlujoFormData) {
    const response = await apiClient.post<FlujoNurturing>('/flujos', data)
    return response.data
  },

  /**
   * Update an existing flujo
   */
  async update(id: number, data: Partial<FlujoFormData>) {
    const response = await apiClient.put<FlujoNurturing>(`/flujos/${id}`, data)
    return response.data
  },

  /**
   * Delete a flujo
   */
  async delete(id: number) {
    await apiClient.delete(`/flujos/${id}`)
  },
}
