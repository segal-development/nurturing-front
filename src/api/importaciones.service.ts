/**
 * Servicio de Importaciones para el backend Laravel 12
 */

import apiClient from './client'
import type { Importacion, ImportarResponse, PaginatedResponse } from '@/types/importacion'

export const importacionesService = {
  /**
   * Obtener lista paginada de importaciones
   */
  async getAll(params?: {
    origen?: string
    estado?: 'procesando' | 'completado' | 'fallido'
    fecha_desde?: string
    fecha_hasta?: string
    page?: number
  }): Promise<PaginatedResponse<Importacion>> {
    const { data } = await apiClient.get<PaginatedResponse<Importacion>>('/importaciones', {
      params,
    })
    return data
  },

  /**
   * Obtener una importación específica
   */
  async getById(id: number): Promise<Importacion> {
    const { data } = await apiClient.get<{ data: Importacion }>(`/importaciones/${id}`)
    return data.data
  },

  /**
   * Importar archivo Excel
   */
  async importar(archivo: File, origen: string): Promise<ImportarResponse> {
    const formData = new FormData()
    formData.append('archivo', archivo)
    formData.append('origen', origen)

    const { data } = await apiClient.post<ImportarResponse>('/importaciones', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data
  },

  /**
   * Eliminar una importación
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/importaciones/${id}`)
  },
}
