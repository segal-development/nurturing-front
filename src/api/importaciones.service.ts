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

    try {
      const response = await apiClient.post<any>('/importaciones', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      console.log('📥 importacionesService.importar() - Response completo:', response.data)

      const { data } = response

      // El backend puede devolver directamente ImportarResponse o envuelto en { data: ImportarResponse }
      // Case 1: { data: { mensaje, data: Importacion, resumen } }
      if (data && 'data' in data && data.data && 'resumen' in data) {
        console.log('✅ Estructura Type 1 detectada (envuelto en data)')
        return data as ImportarResponse
      }

      // Case 2: { mensaje, data: Importacion, resumen }
      if (data && 'resumen' in data && 'mensaje' in data) {
        console.log('✅ Estructura Type 2 detectada (directo ImportarResponse)')
        return data as ImportarResponse
      }

      // Fallback
      console.warn('⚠️ Estructura no reconocida, intentando usar como fallback')
      return data as ImportarResponse
    } catch (error: any) {
      console.error('❌ importacionesService.importar() - Error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      })
      throw error
    }
  },

  /**
   * Eliminar una importación
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/importaciones/${id}`)
  },
}
