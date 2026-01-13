/**
 * Servicio de Flujos para el backend Laravel 12
 * Maneja todas las operaciones CRUD de flujos de nurturing
 */

import { apiClient, getApiErrorMessage } from './client'
import type { FlujoNurturing, FlujoFormData, EjecucionFlujo, ConfigVisual, ConfigStructure } from '@/types/flujo'
import type { FlujoProgresoResponse, FlujoCreacionResponse } from '@/types/flujoAsignacion'

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

      // Transformar orígenes
      let origenes: OrigenFlujo[] = []
      if (Array.isArray(backendData.origenes)) {
        console.log('📋 Origen RAW del backend:', JSON.stringify(backendData.origenes, null, 2))
        origenes = backendData.origenes.map((origen: any) => {
          console.log('🔄 Transformando origen:', origen, 'tipo:', typeof origen)

          // Si es un objeto con id y nombre
          if (typeof origen === 'object' && origen.id && origen.nombre) {
            const transformed = {
              id: String(origen.id),
              nombre: origen.nombre,
              total_flujos: typeof origen.total_flujos === 'number' ? origen.total_flujos : 0,
            }
            console.log('✅ Origen transformado:', transformed)
            return transformed
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
    } catch (error) {
      console.error('🔴 flujosService.getOpciones() - Error:', getApiErrorMessage(error))
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
    } catch (error) {
      console.error('🔴 flujosService.getAll() - Error:', getApiErrorMessage(error))
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
    } catch (error) {
      console.error(`❌ flujosService.getById(${id}) - Error:`, getApiErrorMessage(error))
      throw error
    }
  },

  /**
   * Payload para crear flujo con prospectos
   */
  /**
   * Crear un nuevo flujo con prospectos e información de distribución
   * @param payload Objeto completo con flujo, prospectos, distribución y costos
   * 
   * Acepta dos formatos de payload:
   * 1. Formato FlowBuilder: { flujo: {...}, prospectos: {...}, visual: {...}, structure: {...} }
   * 2. Formato legacy: { nombre, tipo_prospecto_id, prospectos_ids, ... }
   */
  async createWithProspectos(payload: {
    // Formato FlowBuilder
    flujo?: {
      nombre: string;
      descripcion?: string;
      tipo_prospecto?: number | string | null;
      activo?: boolean;
    };
    origen_id?: string | null;
    origen_nombre?: string | null;
    prospectos?: {
      total_seleccionados: number;
      ids_seleccionados: number[];
      total_disponibles: number;
      tipo_prospecto_id?: number | null;
    };
    visual?: ConfigVisual;
    structure?: ConfigStructure;
    stages?: unknown;
    metadata?: Record<string, unknown>;
    // Formato legacy (para compatibilidad)
    nombre?: string;
    descripcion?: string;
    tipo_prospecto_id?: number;
    prospectos_ids?: number[];
    config_visual?: ConfigVisual;
    config_structure?: ConfigStructure;
  }): Promise<FlujoNurturing> {
    try {
      console.log('📤 flujosService.createWithProspectos() - Enviando payload a POST /flujos/crear-con-prospectos')
      const { data } = await apiClient.post<{ data: FlujoNurturing; mensaje: string }>(
        '/flujos/crear-con-prospectos',
        payload
      )
      console.log('✅ flujosService.createWithProspectos() - Flujo creado:', data.data)
      return data.data
    } catch (error) {
      console.error('❌ flujosService.createWithProspectos() - Error:', getApiErrorMessage(error))
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
   * Actualizar configuración visual y estructura de un flujo (para el flow builder)
   */
  async updateFlowConfiguration(
    id: number,
    payload: {
      nombre?: string
      descripcion?: string
      activo?: boolean
      config_visual?: ConfigVisual
      config_structure?: ConfigStructure
    }
  ): Promise<FlujoNurturing> {
    try {
      console.log(`📤 flujosService.updateFlowConfiguration(${id}) - Enviando datos actualizados`)
      console.log('   Payload:', JSON.stringify(payload, null, 2))

      const { data } = await apiClient.put<{ data: FlujoNurturing; mensaje: string }>(
        `/flujos/${id}`,
        payload
      )

      console.log(`✅ flujosService.updateFlowConfiguration(${id}) - Flujo actualizado:`, data.data)
      return data.data
    } catch (error) {
      console.error(`❌ flujosService.updateFlowConfiguration(${id}) - Error:`, getApiErrorMessage(error))
      throw error
    }
  },

  /**
   * Eliminar un flujo
   */
  async delete(id: number): Promise<{ mensaje: string; detalles: { etapas_eliminadas?: number; prospectos_desvinculados?: number } }> {
    try {
      console.log('📤 flujosService.delete() - Enviando request a DELETE /flujos/' + id)
      const { data } = await apiClient.delete<{ mensaje: string; detalles: any }>(
        `/flujos/${id}`
      )
      console.log('✅ flujosService.delete() - Flujo eliminado:', data)
      return data
    } catch (error) {
      console.error('❌ flujosService.delete() - Error:', getApiErrorMessage(error))
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
      origen_id?: string
      fecha_inicio_programada?: string
    }
  ): Promise<{ ejecucion_id: number; estado: string; fecha_inicio_programada: string; prospectos_count: number }> {
    try {
      console.log('📤 flujosService.ejecutarFlujo() - Iniciando ejecución del flujo:', flujoId)
      console.log('   Config:', config)

      const response = await apiClient.post<{
        error: boolean
        mensaje: string
        data: {
          ejecucion_id: number
          estado: string
          fecha_inicio_programada: string
          prospectos_count: number
          primera_etapa?: {
            id: number
            fecha_programada: string
          }
        }
      }>(`/flujos/${flujoId}/ejecutar`, config)

      console.log('✅ flujosService.ejecutarFlujo() - Flujo ejecutado:', response.data.data)
      return response.data.data
    } catch (error) {
      console.error('❌ flujosService.ejecutarFlujo() - Error:', getApiErrorMessage(error))
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
    } catch (error) {
      console.error('❌ flujosService.ejecutar() - Error:', getApiErrorMessage(error))
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
    } catch (error) {
      console.error('❌ flujosService.obtenerProgreso() - Error:', getApiErrorMessage(error))
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
    } catch (error) {
      console.error('❌ flujosService.obtenerHistorialEjecuciones() - Error:', getApiErrorMessage(error))
      throw error
    }
  },

  // ============================================================================
  // Progreso de Asignación de Prospectos
  // ============================================================================

  /**
   * Obtiene el progreso de asignación de prospectos a un flujo.
   *
   * Usado para polling cuando se crean flujos con >100 prospectos
   * y el backend procesa la asignación en background.
   *
   * @param flujoId - ID del flujo
   * @returns Progreso actual de la asignación
   *
   * @example
   * const progreso = await flujosService.getProgresoAsignacion(123)
   * if (progreso.data.completado) {
   *   console.log('Asignación completada!')
   * }
   */
  async getProgresoAsignacion(flujoId: number): Promise<FlujoProgresoResponse> {
    try {
      const response = await apiClient.get<FlujoProgresoResponse>(`/flujos/${flujoId}/progreso`)
      return response.data
    } catch (error) {
      console.error(`❌ flujosService.getProgresoAsignacion(${flujoId}) - Error:`, getApiErrorMessage(error))
      throw error
    }
  },

  /**
   * Crear flujo con prospectos y recibir info de procesamiento async.
   *
   * @param payload - Datos del flujo y prospectos
   * @returns Response con info de si el procesamiento es async
   *
   * @example
   * const response = await flujosService.createWithProspectosAsync(payload)
   * if (response.resumen.procesamiento_async) {
   *   // Iniciar polling de progreso
   *   startPolling(response.data.id)
   * }
   */
  async createWithProspectosAsync(payload: {
    flujo: {
      nombre: string
      descripcion?: string
      tipo_prospecto?: number | string | null
      activo?: boolean
    }
    origen_id?: string | null
    origen_nombre?: string | null
    prospectos: {
      total_seleccionados: number
      ids_seleccionados: number[]
      total_disponibles: number
      tipo_prospecto_id?: number | null
      select_all_from_origin?: boolean
    }
    visual?: ConfigVisual
    structure?: ConfigStructure
    stages?: unknown
    metadata?: Record<string, unknown>
  }): Promise<FlujoCreacionResponse> {
    try {
      console.log('📤 flujosService.createWithProspectosAsync() - Creando flujo con payload')

      const { data } = await apiClient.post<FlujoCreacionResponse>(
        '/flujos/crear-con-prospectos',
        payload
      )

      const isAsync = data.resumen?.procesamiento_async ?? false
      console.log(`✅ Flujo creado (async: ${isAsync}):`, data.data.id)

      return data
    } catch (error) {
      console.error('❌ flujosService.createWithProspectosAsync() - Error:', getApiErrorMessage(error))
      throw error
    }
  },
}
