/**
 * Servicio de Flujos para el backend Laravel 12
 * Maneja todas las operaciones CRUD de flujos de nurturing
 */

import { apiClient } from './client'
import type { FlujoNurturing, FlujoFormData, EjecucionFlujo } from '@/types/flujo'

/**
 * Estructura de un origen de flujos
 */
export interface OrigenFlujo {
  id: string
  nombre: string
  total_flujos: number
}

/**
 * Estructura de opciones para filtrado de flujos
 */
export interface OpcionesFlujos {
  origenes: OrigenFlujo[]
  tipos_deudor: Array<{ value: string; label: string }>
}

/**
 * Respuesta paginada del backend
 */
interface FlujoResponse {
  data: FlujoNurturing[]
  meta: {
    total: number
    per_page: number
    current_page: number
    last_page: number
  }
}

export const flujosService = {
  /**
   * Obtener opciones para filtrado de flujos (orígenes y tipos de deudor)
   */
  async getOpciones(): Promise<OpcionesFlujos> {
    try {
      console.log('📤 flujosService.getOpciones() - Enviando request a GET /flujos/opciones-filtrado')
      const response = await apiClient.get<{ data: any }>('/flujos/opciones-filtrado')

      console.log('📥 flujosService.getOpciones() - response.status:', response.status)
      console.log('📥 flujosService.getOpciones() - response.data (completo):', JSON.stringify(response.data, null, 2))

      // El backend devuelve { data: { origenes, tipos_deudor, ... } }
      const backendData = response.data.data || response.data

      console.log('📥 flujosService.getOpciones() - backendData:', backendData)
      console.log('📥 flujosService.getOpciones() - backendData.origenes:', backendData.origenes)
      console.log('📥 flujosService.getOpciones() - backendData.tipos_deudor:', backendData.tipos_deudor)

      // Transformar orígenes: si son strings, convertir a objetos con id y nombre
      let origenes: OrigenFlujo[] = []
      if (Array.isArray(backendData.origenes)) {
        origenes = backendData.origenes.map((origen: any) => {
          // Si es un objeto con id y nombre, usarlo directamente
          if (typeof origen === 'object' && origen.id && origen.nombre) {
            return {
              id: String(origen.id),
              nombre: origen.nombre,
              total_flujos: origen.total_flujos || 0,
            }
          }
          // Si es un string, convertirlo en un objeto
          if (typeof origen === 'string') {
            return {
              id: origen,
              nombre: origen,
              total_flujos: 0,
            }
          }
          return origen
        })
      }

      // Transformar tipos de deudor
      let tiposDeudor: Array<{ value: string; label: string }> = []
      if (Array.isArray(backendData.tipos_deudor)) {
        tiposDeudor = backendData.tipos_deudor.map((tipo: any) => {
          if (typeof tipo === 'string') {
            return {
              value: tipo,
              label: tipo.charAt(0).toUpperCase() + tipo.slice(1),
            }
          }
          if (typeof tipo === 'object' && tipo.value && tipo.label) {
            return tipo
          }
          return { value: '', label: '' }
        }).filter((t: { value: string; label: string }) => t.value) // Filtrar vacíos
      }

      const opciones: OpcionesFlujos = {
        origenes,
        tipos_deudor: tiposDeudor,
      }

      console.log('✅ flujosService.getOpciones() - Opciones finales transformadas:', JSON.stringify(opciones, null, 2))
      console.log('✅ flujosService.getOpciones() - origenes count:', opciones.origenes.length)
      console.log('✅ flujosService.getOpciones() - tipos_deudor count:', opciones.tipos_deudor.length)
      return opciones
    } catch (error: any) {
      console.error('🔴 flujosService.getOpciones() - Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.message || error.message,
        fullError: error,
      })
      throw error
    }
  },

  /**
   * Obtener lista paginada de flujos
   */
  async getAll(params?: {
    origen_id?: string
    tipo_deudor?: string
    page?: number
    per_page?: number
  }): Promise<FlujoResponse> {
    try {
      console.log('📤 flujosService.getAll() - Enviando request a GET /flujos')
      console.log('   Params:', JSON.stringify(params, null, 2))

      const response = await apiClient.get<FlujoResponse>('/flujos', {
        params,
      })

      console.log('📥 flujosService.getAll() - Response recibido:')
      console.log('   Status:', response.status)
      console.log('   Data:', response.data)
      console.log('   Data.data length:', response.data.data?.length || 0)
      console.log('   Data.meta:', response.data.meta)

      // Log detallado del primer flujo para ver su estructura
      if (response.data.data && response.data.data.length > 0) {
        console.log('📋 Estructura del primer flujo:', JSON.stringify(response.data.data[0], null, 2))
      }

      return response.data
    } catch (error: any) {
      console.error('🔴 flujosService.getAll() - Error:', {
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
   * Obtener un flujo específico
   */
  async getById(id: number): Promise<FlujoNurturing> {
    try {
      console.log(`📤 flujosService.getById(${id}) - Enviando request a GET /flujos/${id}`)
      const { data } = await apiClient.get<{ data: FlujoNurturing }>(`/flujos/${id}`)

      console.log(`📥 flujosService.getById(${id}) - Response completo:`, JSON.stringify(data.data, null, 2))
      console.log(`📥 Claves del flujo:`, Object.keys(data.data))
      console.log(`📥 etapas:`, data.data.etapas)
      console.log(`📥 flujo_etapas:`, data.data.flujo_etapas)
      console.log(`📥 flujo_condiciones:`, data.data.flujo_condiciones)
      console.log(`📥 flujo_ramificaciones:`, data.data.flujo_ramificaciones)
      console.log(`📥 flujo_nodos_finales:`, data.data.flujo_nodos_finales)

      return data.data
    } catch (error: any) {
      console.error(`❌ flujosService.getById(${id}) - Error:`, {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      })
      throw error
    }
  },

  /**
   * Crear un nuevo flujo con prospectos e información de distribución
   * @param payload Objeto completo con flujo, prospectos, distribución y costos
   */
  async createWithProspectos(payload: any): Promise<FlujoNurturing> {
    try {
      console.log('📤 flujosService.createWithProspectos() - Enviando payload a POST /flujos/crear-con-prospectos')
      const { data } = await apiClient.post<{ data: FlujoNurturing; mensaje: string }>(
        '/flujos/crear-con-prospectos',
        payload
      )
      console.log('✅ flujosService.createWithProspectos() - Flujo creado:', data.data)
      return data.data
    } catch (error: any) {
      console.error('❌ flujosService.createWithProspectos() - Error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      })
      throw error
    }
  },

  /**
   * Crear un nuevo flujo (método antiguo - solo datos básicos)
   */
  async create(flujo: FlujoFormData): Promise<FlujoNurturing> {
    const { data } = await apiClient.post<{ data: FlujoNurturing; mensaje: string }>(
      '/flujos',
      flujo
    )
    return data.data
  },

  /**
   * Actualizar un flujo
   */
  async update(id: number, flujo: Partial<FlujoFormData>): Promise<FlujoNurturing> {
    const { data } = await apiClient.put<{ data: FlujoNurturing; mensaje: string }>(
      `/flujos/${id}`,
      flujo
    )
    return data.data
  },

  /**
   * Eliminar un flujo
   */
  async delete(id: number): Promise<{ mensaje: string; detalles: any }> {
    try {
      console.log('📤 flujosService.delete() - Enviando request a DELETE /flujos/' + id)
      const { data } = await apiClient.delete<{ mensaje: string; detalles: any }>(
        `/flujos/${id}`
      )
      console.log('✅ flujosService.delete() - Flujo eliminado:', data)
      return data
    } catch (error: any) {
      console.error('❌ flujosService.delete() - Error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      })
      throw error
    }
  },

  /**
   * Ejecutar un flujo (iniciar envío de mensajes)
   * @param flujoId ID del flujo a ejecutar
   * @param config Configuración de ejecución (prospectos, fecha inicio)
   */
  async ejecutarFlujo(
    flujoId: number,
    config: {
      prospectos_ids: number[]
      fecha_inicio_programada?: string
    }
  ): Promise<{ id: number; estado: string; fecha_inicio_programada: string; mensaje: string }> {
    try {
      console.log('📤 flujosService.ejecutarFlujo() - Iniciando ejecución del flujo:', flujoId)
      console.log('   Config:', config)

      const { data } = await apiClient.post<{
        id: number
        estado: string
        fecha_inicio_programada: string
        mensaje: string
      }>(`/flujos/${flujoId}/ejecutar`, config)

      console.log('✅ flujosService.ejecutarFlujo() - Flujo ejecutado:', data)
      return data
    } catch (error: any) {
      console.error('❌ flujosService.ejecutarFlujo() - Error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      })
      throw error
    }
  },

  /**
   * Ejecutar un flujo (versión antigua - mantener por compatibilidad)
   * @param flujoId ID del flujo a ejecutar
   * @param prospecto_ids IDs específicos de prospectos (opcional, si no se envía, usa todos)
   */
  async ejecutar(flujoId: number, prospecto_ids?: number[]): Promise<EjecucionFlujo> {
    try {
      console.log('📤 flujosService.ejecutar() - Iniciando ejecución del flujo:', flujoId)
      const payload = {
        flujo_id: flujoId,
        ...(prospecto_ids && { prospecto_ids }),
      }

      const { data } = await apiClient.post<{ data: EjecucionFlujo; mensaje: string }>(
        `/flujos/${flujoId}/ejecutar`,
        payload
      )

      console.log('✅ flujosService.ejecutar() - Flujo ejecutado:', data.data)
      return data.data
    } catch (error: any) {
      console.error('❌ flujosService.ejecutar() - Error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      })
      throw error
    }
  },

  /**
   * Obtener el progreso de una ejecución de flujo
   * @param ejecucionId ID de la ejecución
   */
  async obtenerProgreso(ejecucionId: number): Promise<EjecucionFlujo> {
    try {
      console.log('📤 flujosService.obtenerProgreso() - Obteniendo progreso de ejecución:', ejecucionId)

      const { data } = await apiClient.get<{ data: EjecucionFlujo }>(
        `/flujos/ejecuciones/${ejecucionId}`
      )

      console.log('✅ flujosService.obtenerProgreso() - Progreso obtenido:', data.data)
      return data.data
    } catch (error: any) {
      console.error('❌ flujosService.obtenerProgreso() - Error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      })
      throw error
    }
  },

  /**
   * Obtener historial de ejecuciones de un flujo
   * @param flujoId ID del flujo
   */
  async obtenerHistorialEjecuciones(flujoId: number): Promise<{ data: EjecucionFlujo[] }> {
    try {
      console.log('📤 flujosService.obtenerHistorialEjecuciones() - Obteniendo historial del flujo:', flujoId)

      const { data } = await apiClient.get<{ data: EjecucionFlujo[] }>(
        `/flujos/${flujoId}/ejecuciones`
      )

      console.log('✅ flujosService.obtenerHistorialEjecuciones() - Historial obtenido:', data.data)
      return data
    } catch (error: any) {
      console.error('❌ flujosService.obtenerHistorialEjecuciones() - Error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      })
      throw error
    }
  },
}
