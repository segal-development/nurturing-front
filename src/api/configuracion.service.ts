/**
 * Servicio de Configuraciones del Sistema
 * Maneja obtener y actualizar las configuraciones globales
 */

import { apiClient } from './client'
import type { Configuracion, ActualizarConfiguracionPayload } from '@/types/configuracion'

export const configuracionService = {
  /**
   * Obtener la configuración actual del sistema
   */
  async obtener(): Promise<Configuracion> {
    try {
      console.log('📤 configuracionService.obtener() - Solicitando configuración actual')

      const { data } = await apiClient.get<{ data: Configuracion }>('/configuracion')

      console.log('✅ configuracionService.obtener() - Configuración obtenida:', data.data)
      return data.data
    } catch (error: any) {
      console.error('❌ configuracionService.obtener() - Error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      })
      throw error
    }
  },

  /**
   * Actualizar la configuración del sistema
   */
  async actualizar(payload: ActualizarConfiguracionPayload): Promise<Configuracion> {
    try {
      console.log('📤 configuracionService.actualizar() - Actualizando configuración', payload)

      const { data } = await apiClient.put<{ data: Configuracion; mensaje: string }>(
        '/configuracion',
        payload
      )

      console.log('✅ configuracionService.actualizar() - Configuración actualizada:', data.data)
      return data.data
    } catch (error: any) {
      console.error('❌ configuracionService.actualizar() - Error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      })
      throw error
    }
  },

  /**
   * Obtener solo los precios (métodos de conveniencia)
   */
  async obtenerPrecios(): Promise<{ email_costo: number; sms_costo: number }> {
    const config = await this.obtener()
    return {
      email_costo: config.email_costo,
      sms_costo: config.sms_costo,
    }
  },

  /**
   * Actualizar solo los precios
   */
  async actualizarPrecios(email_costo: number, sms_costo: number): Promise<Configuracion> {
    return this.actualizar({
      email_costo,
      sms_costo,
    })
  },
}
