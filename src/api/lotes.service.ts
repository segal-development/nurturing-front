/**
 * Servicio de Lotes para agrupar importaciones
 */

import apiClient from './client'
import type { Lote, LoteProgreso, CrearLoteResponse } from '@/types/lote'

export const lotesService = {
  /**
   * Obtener todos los lotes
   */
  async getAll(): Promise<{ data: Lote[] }> {
    const { data } = await apiClient.get<{ data: Lote[] }>('/lotes')
    return data
  },

  /**
   * Obtener lotes abiertos (donde se pueden agregar más archivos)
   */
  async getAbiertos(): Promise<{ data: Lote[] }> {
    const { data } = await apiClient.get<{ data: Lote[] }>('/lotes/abiertos')
    return data
  },

  /**
   * Crear un nuevo lote
   */
  async crear(nombre: string): Promise<CrearLoteResponse> {
    const { data } = await apiClient.post<CrearLoteResponse>('/lotes', { nombre })
    return data
  },

  /**
   * Obtener un lote específico
   */
  async getById(id: number): Promise<{ data: Lote }> {
    const { data } = await apiClient.get<{ data: Lote }>(`/lotes/${id}`)
    return data
  },

  /**
   * Obtener progreso de un lote
   */
  async getProgreso(id: number): Promise<{ data: LoteProgreso }> {
    const { data } = await apiClient.get<{ data: LoteProgreso }>(`/lotes/${id}/progreso`)
    return data
  },

  /**
   * Cerrar/Finalizar un lote
   */
  async cerrar(id: number): Promise<{ mensaje: string; data: Lote }> {
    const { data } = await apiClient.post<{ mensaje: string; data: Lote }>(`/lotes/${id}/cerrar`)
    return data
  },
}
