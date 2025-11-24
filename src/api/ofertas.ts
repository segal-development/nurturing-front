import type { OfertaInfocom, OfertaFormData } from '@/types/oferta'
import { apiClient } from './client'

interface OfertaFilters {
  activa?: boolean
}

interface OfertaResponse {
  data: OfertaInfocom[]
  total: number
}

/**
 * API layer for Ofertas Infocom
 * Handles all CRUD operations for ofertas
 */
export const ofertaApi = {
  /**
   * Get all ofertas with optional filters
   */
  async getAll(filters?: OfertaFilters) {
    const params = new URLSearchParams()
    if (filters?.activa !== undefined) {
      params.append('activa', String(filters.activa))
    }

    const response = await apiClient.get<OfertaResponse>('/ofertas', { params })
    return response.data.data
  },

  /**
   * Get a single oferta by ID
   */
  async getById(id: number) {
    const response = await apiClient.get<OfertaInfocom>(`/ofertas/${id}`)
    return response.data
  },

  /**
   * Create a new oferta
   */
  async create(data: OfertaFormData) {
    const response = await apiClient.post<OfertaInfocom>('/ofertas', data)
    return response.data
  },

  /**
   * Update an existing oferta
   */
  async update(id: number, data: Partial<OfertaFormData>) {
    const response = await apiClient.put<OfertaInfocom>(`/ofertas/${id}`, data)
    return response.data
  },

  /**
   * Delete an oferta
   */
  async delete(id: number) {
    await apiClient.delete(`/ofertas/${id}`)
  },
}
