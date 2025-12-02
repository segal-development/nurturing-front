/**
 * Servicio de Plantillas para el backend Laravel 12
 * Maneja operaciones CRUD de plantillas SMS y Email
 */

import { apiClient } from './client'
import type {
  AnyPlantilla,
  PlantillaSMS,
  PlantillaEmail,
  GuardarPlantillaResponse,
  PlantillasResponse,
} from '@/types/plantilla'

export const plantillasService = {
  /**
   * Obtener todas las plantillas con filtros opcionales
   */
  async getAll(params?: {
    tipo?: 'sms' | 'email'
    activo?: boolean
    pagina?: number
    por_pagina?: number
  }): Promise<PlantillasResponse> {
    try {
      console.log('📤 plantillasService.getAll() - Enviando request')
      const response = await apiClient.get<PlantillasResponse>('/plantillas', {
        params: {
          ...params,
          pagina: params?.pagina || 1,
          por_pagina: params?.por_pagina || 10,
        },
      })

      console.log('✅ plantillasService.getAll() - Plantillas cargadas:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ plantillasService.getAll() - Error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      })
      throw error
    }
  },

  /**
   * Obtener una plantilla por ID
   */
  async getById(id: number): Promise<AnyPlantilla> {
    try {
      console.log(`📤 plantillasService.getById(${id}) - Enviando request`)
      const response = await apiClient.get<{ data: AnyPlantilla }>(`/plantillas/${id}`)

      console.log(`✅ plantillasService.getById(${id}) - Plantilla obtenida:`, response.data.data)
      return response.data.data
    } catch (error: any) {
      console.error(`❌ plantillasService.getById(${id}) - Error:`, {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      })
      throw error
    }
  },

  /**
   * Crear una nueva plantilla SMS
   * POST /api/plantillas/sms
   */
  async crearPlantillaSMS(plantilla: Omit<PlantillaSMS, 'id'>): Promise<GuardarPlantillaResponse> {
    try {
      console.log('📤 plantillasService.crearPlantillaSMS() - Enviando plantilla SMS')
      console.log('   Datos:', {
        nombre: plantilla.nombre,
        tipo: plantilla.tipo,
        contenidoLength: plantilla.contenido.length,
      })

      const response = await apiClient.post<GuardarPlantillaResponse>('/plantillas/sms', {
        nombre: plantilla.nombre,
        descripcion: plantilla.descripcion || '',
        contenido: plantilla.contenido,
        activo: plantilla.activo !== false,
      })

      console.log('✅ plantillasService.crearPlantillaSMS() - Plantilla creada:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ plantillasService.crearPlantillaSMS() - Error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        errores: error.response?.data?.errores,
      })
      throw error
    }
  },

  /**
   * Crear una nueva plantilla Email
   * POST /api/plantillas/email
   */
  async crearPlantillaEmail(
    plantilla: Omit<PlantillaEmail, 'id'>
  ): Promise<GuardarPlantillaResponse> {
    try {
      console.log('📤 plantillasService.crearPlantillaEmail() - Enviando plantilla Email')
      console.log('   Datos:', {
        nombre: plantilla.nombre,
        tipo: plantilla.tipo,
        componentes: plantilla.componentes.length,
      })

      const response = await apiClient.post<GuardarPlantillaResponse>('/plantillas/email', {
        nombre: plantilla.nombre,
        descripcion: plantilla.descripcion || '',
        asunto: plantilla.asunto,
        componentes: plantilla.componentes,
        activo: plantilla.activo !== false,
      })

      console.log('✅ plantillasService.crearPlantillaEmail() - Plantilla creada:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ plantillasService.crearPlantillaEmail() - Error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        errores: error.response?.data?.errores,
      })
      throw error
    }
  },

  /**
   * Actualizar una plantilla existente
   */
  async actualizar(id: number, plantilla: Partial<AnyPlantilla>): Promise<GuardarPlantillaResponse> {
    try {
      console.log(`📤 plantillasService.actualizar(${id}) - Enviando actualización`)

      const data = {
        ...plantilla,
        ...(plantilla.tipo === 'email' &&
          'componentes' in plantilla && {
            componentes: JSON.stringify(plantilla.componentes),
          }),
      }

      const response = await apiClient.put<GuardarPlantillaResponse>(`/plantillas/${id}`, data)

      console.log(`✅ plantillasService.actualizar(${id}) - Plantilla actualizada:`, response.data)
      return response.data
    } catch (error: any) {
      console.error(`❌ plantillasService.actualizar(${id}) - Error:`, {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      })
      throw error
    }
  },

  /**
   * Eliminar una plantilla
   */
  async eliminar(id: number): Promise<{ mensaje: string }> {
    try {
      console.log(`📤 plantillasService.eliminar(${id}) - Enviando eliminación`)
      const response = await apiClient.delete<{ mensaje: string }>(`/plantillas/${id}`)

      console.log(`✅ plantillasService.eliminar(${id}) - Plantilla eliminada:`, response.data)
      return response.data
    } catch (error: any) {
      console.error(`❌ plantillasService.eliminar(${id}) - Error:`, {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      })
      throw error
    }
  },

  /**
   * Generar preview HTML de una plantilla Email
   * POST /api/plantillas/preview/email
   */
  async generarPreviewEmail(plantilla: Omit<PlantillaEmail, 'id'>): Promise<string> {
    try {
      console.log('📤 plantillasService.generarPreviewEmail() - Generando preview')
      const response = await apiClient.post<{ preview: string }>('/plantillas/preview/email', {
        nombre: plantilla.nombre,
        descripcion: plantilla.descripcion || '',
        asunto: plantilla.asunto,
        componentes: plantilla.componentes,
        activo: plantilla.activo !== false,
      })

      console.log('✅ plantillasService.generarPreviewEmail() - Preview generado')
      return response.data.preview
    } catch (error: any) {
      console.error('❌ plantillasService.generarPreviewEmail() - Error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      })
      throw error
    }
  },

  /**
   * Validar una plantilla SMS
   * POST /api/plantillas/validar/sms
   */
  async validarSMS(contenido: string): Promise<{ valido: boolean; caracteresValidos: number; advertencias?: string[] }> {
    try {
      console.log('📤 plantillasService.validarSMS() - Validando SMS')
      const response = await apiClient.post<{ valido: boolean; caracteresValidos: number; advertencias?: string[] }>('/plantillas/validar/sms', {
        contenido,
      })

      console.log('✅ plantillasService.validarSMS() - SMS validado:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ plantillasService.validarSMS() - Error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      })
      throw error
    }
  },
}
