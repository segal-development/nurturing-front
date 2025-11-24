/**
 * Servicio de Prospectos para el backend Laravel 12
 */

import apiClient from './client'
import type {
  Prospecto,
  PaginatedResponse,
  ProspectoFormData,
  ProspectoEstadisticas,
} from '@/types/prospecto'

interface Importacion {
  id: number
  nombre_archivo: string
  origen: string
  total_prospectos: number
  fecha_importacion: string
}

interface OpcionesFiltrado {
  importaciones: Importacion[]
  estados: Array<{ value: string; label: string }>
  tipos_prospecto: Array<{ id: number; nombre: string }>
}

export const prospectosService = {
  /**
   * Obtener opciones para filtrado de prospectos
   */
  async getOpciones(): Promise<OpcionesFiltrado> {
    try {
      console.log('📤 prospectosService.getOpciones() - Enviando request a GET /prospectos/opciones-filtrado')
      const response = await apiClient.get<any>('/prospectos/opciones-filtrado')

      console.log('📥 prospectosService.getOpciones() - response.status:', response.status)
      console.log('📥 prospectosService.getOpciones() - response.data (completo):', JSON.stringify(response.data, null, 2))

      // El backend devuelve { data: { importaciones, origenes, estados, tipos_prospecto } }
      // response.data ya es lo que Axios extrajo, así que es { data: {...} }
      const backendData = response.data.data || response.data

      console.log('📥 prospectosService.getOpciones() - backendData:', backendData)
      console.log('📥 prospectosService.getOpciones() - backendData.importaciones:', backendData.importaciones)
      console.log('📥 prospectosService.getOpciones() - backendData.estados:', backendData.estados)

      const opciones: OpcionesFiltrado = {
        importaciones: backendData.importaciones || [],
        estados: backendData.estados?.map((estado: string) => ({
          value: estado,
          label: estado.charAt(0).toUpperCase() + estado.slice(1),
        })) || [],
        tipos_prospecto: backendData.tipos_prospecto || [],
      }

      console.log('✅ prospectosService.getOpciones() - Opciones finales transformadas:', JSON.stringify(opciones, null, 2))
      console.log('✅ prospectosService.getOpciones() - importaciones count:', opciones.importaciones.length)
      return opciones
    } catch (error: any) {
      console.error('🔴 prospectosService.getOpciones() - Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.message || error.message,
        fullError: error
      })
      throw error
    }
  },

  /**
   * Obtener lista paginada de prospectos
   */
  async getAll(params?: {
    importacion_id?: number
    estado?: string
    tipo_prospecto_id?: number
    origen?: string
    search?: string
    sort_by?: 'created_at' | 'monto_deuda' | 'nombre'
    sort_direction?: 'asc' | 'desc'
    page?: number
    per_page?: number
  }): Promise<PaginatedResponse<Prospecto>> {
    try {
      console.log('📤 prospectosService.getAll() - Enviando request a GET /prospectos')
      console.log('   Params:', JSON.stringify(params, null, 2))

      const response = await apiClient.get<PaginatedResponse<Prospecto>>('/prospectos', {
        params,
      })

      console.log('📥 prospectosService.getAll() - Response recibido:')
      console.log('   Status:', response.status)
      console.log('   Data:', response.data)
      console.log('   Data.data length:', response.data.data?.length || 0)
      console.log('   Data.meta:', response.data.meta)

      return response.data
    } catch (error: any) {
      console.error('🔴 prospectosService.getAll() - Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.message || error.message,
        responseData: error.response?.data,
        config: error.config,
      })
      throw error
    }
  },

  /**
   * Obtener un prospecto específico
   */
  async getById(id: number): Promise<Prospecto> {
    const { data } = await apiClient.get<{ data: Prospecto }>(`/prospectos/${id}`)
    return data.data
  },

  /**
   * Crear un nuevo prospecto
   */
  async create(prospecto: ProspectoFormData): Promise<Prospecto> {
    const { data } = await apiClient.post<{ data: Prospecto; mensaje: string }>(
      '/prospectos',
      prospecto
    )
    return data.data
  },

  /**
   * Actualizar un prospecto
   */
  async update(id: number, prospecto: Partial<ProspectoFormData>): Promise<Prospecto> {
    const { data } = await apiClient.put<{ data: Prospecto; mensaje: string }>(
      `/prospectos/${id}`,
      prospecto
    )
    return data.data
  },

  /**
   * Eliminar un prospecto
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/prospectos/${id}`)
  },

  /**
   * Obtener estadísticas de prospectos
   */
  async getEstadisticas(): Promise<ProspectoEstadisticas> {
    const { data } = await apiClient.get<{ data: ProspectoEstadisticas }>(
      '/prospectos/estadisticas'
    )
    return data.data
  },
}
