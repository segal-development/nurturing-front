/**
 * Servicio de Flujos para el backend Laravel 12
 * Maneja todas las operaciones CRUD de flujos de nurturing
 */

import { apiClient, getApiErrorMessage } from './client'
import { logger } from '@/lib/logger'
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
 * Estadísticas de envíos por nodo
 */
export interface NodeStats {
  node_id: string
  tipo_mensaje: 'email' | 'sms' | 'ambos'
  label: string
  total_pendiente: number
  total_enviado: number
  total_fallido: number
  /** Solo para email/ambos */
  total_abierto: number | null
  /** Solo para email/ambos */
  total_clickeado: number | null
}

/**
 * Estadísticas completas del flujo para analytics
 */
export interface FlujoAnalytics {
  resumen: {
    tasa_apertura: number
    tasa_click: number
    tasa_fallo: number
    costo_total: number
    costo_por_conversion: number
    emails_enviados: number
    sms_enviados: number
  }
  funnel: {
    prospectos: number
    enviados: number
    abiertos: number
    clickeados: number
    conversiones: number
    // tasa_envio removed: can exceed 100% since 1 prospect receives N messages (1 per stage)
    tasa_apertura: number
    tasa_click_sobre_abiertos: number
    tasa_conversion: number
  }
  etapas: Array<{
    node_id: string
    label: string
    tipo_mensaje: 'email' | 'sms' | 'ambos'
    orden: number
    enviados: number
    fallidos: number
    abiertos: number | null
    clickeados: number | null
    tasa_apertura: number | null
    tasa_click: number | null
  }>
  totales: {
    envios: {
      total: number
      enviados: number
      fallidos: number
      pendientes: number
      abiertos: number
      clickeados: number
    }
    prospectos: {
      total: number
      completados: number
      en_proceso: number
      pendientes: number
      cancelados: number
    }
  }
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
      const response = await apiClient.get<{ data: Record<string, unknown> }>('/flujos/opciones-filtrado')
      const backendData = (response.data.data || response.data) as Record<string, unknown>

      // Transform origenes from backend format
      const rawOrigenes = Array.isArray(backendData.origenes) ? backendData.origenes : []
      const origenes: OrigenFlujo[] = rawOrigenes.map((origen: unknown) => {
        if (typeof origen === 'object' && origen !== null && 'id' in origen && 'nombre' in origen) {
          const o = origen as { id: string | number; nombre: string; total_flujos?: number }
          return {
            id: String(o.id),
            nombre: o.nombre,
            total_flujos: typeof o.total_flujos === 'number' ? o.total_flujos : 0,
          }
        }
        if (typeof origen === 'string') {
          return { id: origen, nombre: origen, total_flujos: 0 }
        }
        return origen as OrigenFlujo
      })

      // Transform tipos de deudor
      const rawTipos = Array.isArray(backendData.tipos_deudor) ? backendData.tipos_deudor : []
      const tipos_deudor = rawTipos
        .map((tipo: unknown) => {
          if (typeof tipo === 'string') {
            return { value: tipo, label: tipo.charAt(0).toUpperCase() + tipo.slice(1) }
          }
          if (typeof tipo === 'object' && tipo !== null && 'value' in tipo && 'label' in tipo) {
            return tipo as { value: string; label: string }
          }
          return { value: '', label: '' }
        })
        .filter((t: { value: string; label: string }) => t.value)

      return { origenes, tipos_deudor }
    } catch (error) {
      logger.error('flujosService.getOpciones() failed:', getApiErrorMessage(error))
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
      const response = await apiClient.get<FlujoResponse>('/flujos', { params })
      return response.data
    } catch (error) {
      logger.error('flujosService.getAll() failed:', getApiErrorMessage(error))
      throw error
    }
  },

  /**
   * Obtener un flujo específico con sus estadísticas
   */
  async getById(id: number): Promise<FlujoNurturing> {
    try {
      const { data } = await apiClient.get<{ 
        data: FlujoNurturing
        estadisticas?: {
          total_prospectos: number
          prospectos_pendientes: number
          prospectos_en_proceso: number
          prospectos_completados: number
          prospectos_cancelados: number
          total_etapas: number
          total_condiciones: number
          total_ramificaciones: number
          total_nodos_finales: number
        }
      }>(`/flujos/${id}`)
      
      // Merge estadisticas into flujo object
      return {
        ...data.data,
        estadisticas: data.estadisticas,
      }
    } catch (error) {
      logger.error(`flujosService.getById(${id}) failed:`, getApiErrorMessage(error))
      throw error
    }
  },

  /**
   * Obtener estadísticas completas de un flujo para analytics
   * Incluye: funnel de conversión, tasas, costos, y rendimiento por etapa
   * 
   * @param flujoId ID del flujo
   * @returns Estadísticas completas del flujo
   */
  async getAnalytics(flujoId: number): Promise<FlujoAnalytics> {
    try {
      const { data } = await apiClient.get<{ data: FlujoAnalytics }>(
        `/flujos/${flujoId}/estadisticas-completas`
      )
      return data.data
    } catch (error) {
      logger.error(`flujosService.getAnalytics(${flujoId}) failed:`, getApiErrorMessage(error))
      throw error
    }
  },

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
      const { data } = await apiClient.post<{ data: FlujoNurturing; mensaje: string }>(
        '/flujos/crear-con-prospectos',
        payload
      )
      return data.data
    } catch (error) {
      logger.error('flujosService.createWithProspectos() failed:', getApiErrorMessage(error))
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
   * Obtener estadísticas de envíos por nodo para un flujo
   * Suma todas las ejecuciones del flujo
   * 
   * @param flujoId ID del flujo
   * @returns Array de estadísticas por nodo
   */
  async getNodeStats(flujoId: number): Promise<NodeStats[]> {
    try {
      const { data } = await apiClient.get<{ data: NodeStats[] }>(
        `/flujos/${flujoId}/estadisticas-nodos`
      )
      return data.data
    } catch (error) {
      logger.error(`flujosService.getNodeStats(${flujoId}) failed:`, getApiErrorMessage(error))
      throw error
    }
  },

  /**
   * Toggle auto-asignación de nuevos prospectos
   * Cuando está activo, los nuevos prospectos del mismo origen se agregan automáticamente al flujo
   */
  async toggleAutoAsignar(id: number, enabled: boolean): Promise<FlujoNurturing> {
    try {
      const { data } = await apiClient.put<{ data: FlujoNurturing; mensaje: string }>(
        `/flujos/${id}`,
        { auto_asignar_nuevos: enabled }
      )
      return data.data
    } catch (error) {
      logger.error(`flujosService.toggleAutoAsignar(${id}, ${enabled}) failed:`, getApiErrorMessage(error))
      throw error
    }
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
      const { data } = await apiClient.put<{ data: FlujoNurturing; mensaje: string }>(
        `/flujos/${id}`,
        payload
      )
      return data.data
    } catch (error) {
      logger.error(`flujosService.updateFlowConfiguration(${id}) failed:`, getApiErrorMessage(error))
      throw error
    }
  },

  /**
   * Eliminar un flujo
   */
  async delete(id: number): Promise<{ mensaje: string; detalles: { etapas_eliminadas?: number; prospectos_desvinculados?: number } }> {
    try {
      const { data } = await apiClient.delete<{ mensaje: string; detalles: Record<string, number> }>(
        `/flujos/${id}`
      )
      return data
    } catch (error) {
      logger.error(`flujosService.delete(${id}) failed:`, getApiErrorMessage(error))
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

      return response.data.data
    } catch (error) {
      logger.error(`flujosService.ejecutarFlujo(${flujoId}) failed:`, getApiErrorMessage(error))
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
      const payload = {
        flujo_id: flujoId,
        ...(prospecto_ids && { prospecto_ids }),
      }

      const { data } = await apiClient.post<{ data: EjecucionFlujo; mensaje: string }>(
        `/flujos/${flujoId}/ejecutar`,
        payload
      )

      return data.data
    } catch (error) {
      logger.error(`flujosService.ejecutar(${flujoId}) failed:`, getApiErrorMessage(error))
      throw error
    }
  },

  /**
   * Obtener el progreso de una ejecución de flujo
   * @param ejecucionId ID de la ejecución
   */
  async obtenerProgreso(ejecucionId: number): Promise<EjecucionFlujo> {
    try {
      const { data } = await apiClient.get<{ data: EjecucionFlujo }>(
        `/flujos/ejecuciones/${ejecucionId}`
      )
      return data.data
    } catch (error) {
      logger.error(`flujosService.obtenerProgreso(${ejecucionId}) failed:`, getApiErrorMessage(error))
      throw error
    }
  },

  /**
   * Obtener historial de ejecuciones de un flujo
   * @param flujoId ID del flujo
   */
  async obtenerHistorialEjecuciones(flujoId: number): Promise<{ data: EjecucionFlujo[] }> {
    try {
      const { data } = await apiClient.get<{ data: EjecucionFlujo[] }>(
        `/flujos/${flujoId}/ejecuciones`
      )
      return data
    } catch (error) {
      logger.error(`flujosService.obtenerHistorialEjecuciones(${flujoId}) failed:`, getApiErrorMessage(error))
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
      logger.error(`flujosService.getProgresoAsignacion(${flujoId}) failed:`, getApiErrorMessage(error))
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
      const { data } = await apiClient.post<FlujoCreacionResponse>(
        '/flujos/crear-con-prospectos',
        payload
      )
      return data
    } catch (error) {
      logger.error('flujosService.createWithProspectosAsync() failed:', getApiErrorMessage(error))
      throw error
    }
  },

  // ============================================================================
  // Agregar Prospectos a Flujo Existente
  // ============================================================================

  /**
   * Agregar prospectos a un flujo existente.
   * 
   * Supports multiple modes:
   * 1. By prospecto_ids: Specific list of prospect IDs
   * 2. By select_all_from_origin: All prospects from a given origin
   * 
   * For large volumes (>100), uses async processing.
   * 
   * @param flujoId - ID del flujo
   * @param payload - Criterios de selección de prospectos
   * @returns Resumen de prospectos agregados
   */
  async agregarProspectos(
    flujoId: number,
    payload: {
      prospecto_ids?: number[]
      origen?: string
      tipo_prospecto_id?: number | null
      select_all_from_origin?: boolean
      canal_asignado?: 'email' | 'sms'
    }
  ): Promise<{
    mensaje: string
    resumen: {
      total_encontrados?: number
      total_estimado?: number
      agregados?: number
      ya_existentes?: number
      procesamiento_async?: boolean
    }
  }> {
    try {
      const { data } = await apiClient.post<{
        mensaje: string
        resumen: {
          total_encontrados?: number
          total_estimado?: number
          agregados?: number
          ya_existentes?: number
          procesamiento_async?: boolean
        }
      }>(`/flujos/${flujoId}/agregar-prospectos`, payload)

      return data
    } catch (error) {
      logger.error(`flujosService.agregarProspectos(${flujoId}) failed:`, getApiErrorMessage(error))
      throw error
    }
  },
}
