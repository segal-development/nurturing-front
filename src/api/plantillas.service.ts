/**
 * Servicio de Plantillas para el backend Laravel 12
 * Maneja operaciones CRUD de plantillas SMS y Email
 * 
 * IMPORTANTE: El backend guarda `componentes[].contenido` como JSON string.
 * Este servicio se encarga de:
 * - Serializar (stringify) al ENVIAR al backend
 * - Deserializar (parse) al RECIBIR del backend
 */

import { apiClient } from './client'
import type {
  AnyPlantilla,
  PlantillaSMS,
  PlantillaEmail,
  AnyEmailComponent,
  GuardarPlantillaResponse,
  PlantillasResponse,
} from '@/types/plantilla'

// ============================================================================
// UTILITY FUNCTIONS - Serialización/Deserialización de componentes
// ============================================================================

/**
 * Deserializa el contenido de componentes de email (string JSON -> objeto)
 * Se usa al LEER datos del backend
 */
function deserializeEmailComponents(componentes: AnyEmailComponent[]): AnyEmailComponent[] {
  return componentes.map((comp) => ({
    ...comp,
    contenido: typeof comp.contenido === 'string'
      ? safeJsonParse(comp.contenido, {})
      : comp.contenido,
  }))
}

/**
 * Serializa el contenido de componentes de email (objeto -> string JSON)
 * Se usa al ENVIAR datos al backend
 */
function serializeEmailComponents(componentes: AnyEmailComponent[]): AnyEmailComponent[] {
  return componentes.map((comp) => ({
    ...comp,
    contenido: typeof comp.contenido === 'string'
      ? comp.contenido
      : JSON.stringify(comp.contenido),
  })) as AnyEmailComponent[]
}

/**
 * JSON.parse seguro que retorna un valor por defecto si falla
 */
function safeJsonParse<T>(str: string, defaultValue: T): T {
  try {
    return JSON.parse(str)
  } catch {
    console.warn('⚠️ [safeJsonParse] Failed to parse:', str)
    return defaultValue
  }
}

/**
 * Deserializa una plantilla de email completa
 */
function deserializePlantillaEmail(plantilla: PlantillaEmail): PlantillaEmail {
  return {
    ...plantilla,
    componentes: deserializeEmailComponents(plantilla.componentes),
  }
}

/**
 * Deserializa cualquier plantilla (solo afecta a emails)
 */
function deserializePlantilla(plantilla: AnyPlantilla): AnyPlantilla {
  if (plantilla.tipo === 'email') {
    return deserializePlantillaEmail(plantilla as PlantillaEmail)
  }
  return plantilla
}

export const plantillasService = {
  /**
   * Obtener todas las plantillas con filtros opcionales
   * Deserializa automáticamente los componentes de email
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

      // Deserializar componentes de email
      const plantillasDeserializadas = response.data.data.map(deserializePlantilla)

      console.log('✅ plantillasService.getAll() - Plantillas cargadas:', plantillasDeserializadas.length)
      return {
        ...response.data,
        data: plantillasDeserializadas,
      }
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
   * Deserializa automáticamente los componentes de email
   */
  async getById(id: number): Promise<AnyPlantilla> {
    try {
      console.log(`📤 plantillasService.getById(${id}) - Enviando request`)
      const response = await apiClient.get<{ data: AnyPlantilla }>(`/plantillas/${id}`)

      // Deserializar componentes de email
      const plantillaDeserializada = deserializePlantilla(response.data.data)

      console.log(`✅ plantillasService.getById(${id}) - Plantilla obtenida:`, plantillaDeserializada)
      return plantillaDeserializada
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

      // Serializar componentes para el backend
      const componentesSerializados = serializeEmailComponents(plantilla.componentes)
      console.log('🔍 [crearPlantillaEmail] Componentes serializados:', componentesSerializados)

      const response = await apiClient.post<GuardarPlantillaResponse>('/plantillas/email', {
        nombre: plantilla.nombre,
        descripcion: plantilla.descripcion || '',
        asunto: plantilla.asunto,
        componentes: componentesSerializados,
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

      let data = { ...plantilla }

      // Si es email con componentes, serializar para el backend
      if (plantilla.tipo === 'email' && 'componentes' in plantilla && plantilla.componentes) {
        const componentesSerializados = serializeEmailComponents(plantilla.componentes)
        data = { ...data, componentes: componentesSerializados } as typeof data
        console.log('🔍 [actualizar] Componentes serializados:', componentesSerializados)
      }

      console.log('🔍 [actualizar] Payload que se enviará:', data)

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
      
      // Serializar componentes para el backend
      const componentesSerializados = serializeEmailComponents(plantilla.componentes)

      const response = await apiClient.post<{ preview: string }>('/plantillas/preview/email', {
        nombre: plantilla.nombre,
        descripcion: plantilla.descripcion || '',
        asunto: plantilla.asunto,
        componentes: componentesSerializados,
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
