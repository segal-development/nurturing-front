/**
 * Servicio de Prospectos para el backend Laravel 12
 */

import apiClient from './client'
import { logger } from '@/lib/logger'
import type {
  Prospecto,
  ProspectoFormData,
  ProspectoEstadisticas,
  ConteoPorTipoResponse,
} from '@/types/prospecto'
import type { PaginatedResponse } from '@/types'

interface Importacion {
  id: number
  nombre_archivo: string
  origen: string
  total_prospectos: number
  fecha_importacion: string
}

interface LoteOpcion {
  id: number
  nombre: string
  estado: 'abierto' | 'procesando' | 'completado' | 'fallido'
  total_archivos: number
  total_prospectos: number
  total_registros: number
  registros_exitosos: number
  created_at: string
  importaciones: Array<{
    id: number
    nombre_archivo: string
    estado: string
    total_prospectos: number
  }>
}

interface OpcionesFiltrado {
  lotes: LoteOpcion[]
  importaciones?: Importacion[]
  estados: Array<{ value: string; label: string }>
  tipos_prospecto: Array<{ id: number; nombre: string }>
}

export const prospectosService = {
  /**
   * Obtener opciones para filtrado de prospectos
   */
  async getOpciones(): Promise<OpcionesFiltrado> {
    try {
      const response = await apiClient.get<{ data: OpcionesFiltrado }>('/prospectos/opciones-filtrado')
      const backendData = response.data.data || response.data

      return {
        lotes: backendData.lotes || [],
        importaciones: backendData.importaciones || [],
        estados: backendData.estados?.map((estado: string) => ({
          value: estado,
          label: estado.charAt(0).toUpperCase() + estado.slice(1),
        })) || [],
        tipos_prospecto: backendData.tipos_prospecto || [],
      }
    } catch (error) {
      logger.error('prospectosService.getOpciones() failed:', error)
      throw error
    }
  },

  /**
   * Obtener lista paginada de prospectos
   */
  async getAll(params?: {
    lote_id?: number
    lote_ids?: number[] // Multiple lote filtering
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
      // Transform lote_ids array to the format Laravel expects: lote_ids[]=1&lote_ids[]=2
      const queryParams = { ...params }
      if (params?.lote_ids && params.lote_ids.length > 0) {
        // Axios handles array params with brackets automatically
        // We keep it as-is and it will serialize correctly
      }
      const response = await apiClient.get<PaginatedResponse<Prospecto>>('/prospectos', {
        params: queryParams,
      })
      return response.data
    } catch (error) {
      logger.error('prospectosService.getAll() failed:', error)
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

  /**
   * Obtener el conteo total de prospectos que coinciden con los filtros (sin cargar los datos)
   */
  async getCount(params?: {
    lote_id?: number
    lote_ids?: number[] // Multiple lote filtering
    importacion_id?: number
    estado?: string
    tipo_prospecto_id?: number
    origen?: string
    search?: string
  }): Promise<number> {
    const { data } = await apiClient.get<{ data: { total: number } }>('/prospectos/count', {
      params,
    })
    return data.data.total
  },

  /**
   * Obtener conteo de prospectos agrupados por tipo de deuda
   * Devuelve el total y el desglose por cada categoría de deuda
   */
  async getConteoPorTipo(params?: {
    lote_id?: number
    lote_ids?: number[] // Multiple lote filtering
    importacion_id?: number
    estado?: string
    origen?: string
    search?: string
  }): Promise<ConteoPorTipoResponse> {
    const { data } = await apiClient.get<{ data: ConteoPorTipoResponse }>(
      '/prospectos/conteo-por-tipo',
      { params }
    )
    return data.data
  },

  /**
   * Eliminar un lote y todos sus datos relacionados
   */
  async deleteLote(loteId: number): Promise<{ mensaje: string; prospectos_eliminados: number }> {
    const { data } = await apiClient.delete<{ mensaje: string; prospectos_eliminados: number }>(
      `/lotes/${loteId}`
    )
    return data
  },
}
