/**
 * Servicio de Importaciones
 * 
 * @description Maneja todas las operaciones relacionadas con importaciones
 * de prospectos desde archivos Excel.
 */

import apiClient from './client'
import type {
  Importacion,
  ImportarResponse,
  ImportacionProgreso,
  ImportacionFiltros,
  ImportacionesPaginatedResponse,
  ImportacionEstado,
} from '@/types/importacion'
import { isImportacionTerminada } from '@/types/importacion'

// =============================================================================
// TIPOS INTERNOS
// =============================================================================

/** Opciones para importar un archivo */
interface ImportarOptions {
  archivo: File
  origen: string
  loteId?: number
}

/** Opciones para polling de progreso */
interface PollingOptions {
  intervalMs?: number
  maxAttempts?: number
  onProgress?: (progreso: ImportacionProgreso) => void
}

/** Respuesta envuelta del API */
interface ApiResponse<T> {
  data: T
}

// =============================================================================
// CONSTANTES
// =============================================================================

const API_ENDPOINTS = {
  BASE: '/importaciones',
  BY_ID: (id: number) => `/importaciones/${id}`,
  PROGRESO: (id: number) => `/importaciones/${id}/progreso`,
  RETRY: (id: number) => `/importaciones/${id}/retry`,
} as const

const POLLING_DEFAULTS = {
  INTERVAL_MS: 3000,
  MAX_ATTEMPTS: 200, // ~10 minutos con 3s de intervalo
} as const

// =============================================================================
// FUNCIONES AUXILIARES
// =============================================================================

/**
 * Parsea la respuesta de importación que puede venir en diferentes estructuras.
 */
function parseImportarResponse(responseData: unknown): ImportarResponse {
  const data = responseData as Record<string, unknown>

  // La respuesta siempre debería tener estos campos
  if (data && 'mensaje' in data && 'data' in data) {
    return data as ImportarResponse
  }

  // Fallback: asumir que es la estructura correcta
  console.warn('[importacionesService] Estructura de respuesta no estándar:', data)
  return data as ImportarResponse
}

/**
 * Crea el FormData para subir un archivo.
 */
function createUploadFormData({ archivo, origen, loteId }: ImportarOptions): FormData {
  const formData = new FormData()
  formData.append('archivo', archivo)
  formData.append('origen', origen)
  
  if (loteId !== undefined) {
    formData.append('lote_id', loteId.toString())
  }

  return formData
}

// =============================================================================
// SERVICIO
// =============================================================================

export const importacionesService = {
  // ===========================================================================
  // CRUD BÁSICO
  // ===========================================================================

  /**
   * Obtiene lista paginada de importaciones con filtros opcionales.
   */
  async getAll(filtros?: ImportacionFiltros): Promise<ImportacionesPaginatedResponse> {
    const { data } = await apiClient.get<ImportacionesPaginatedResponse>(
      API_ENDPOINTS.BASE,
      { params: filtros }
    )
    return data
  },

  /**
   * Obtiene una importación por ID.
   */
  async getById(id: number): Promise<Importacion> {
    const { data } = await apiClient.get<ApiResponse<Importacion>>(
      API_ENDPOINTS.BY_ID(id)
    )
    return data.data
  },

  /**
   * Elimina una importación.
   * 
   * @throws Error si la importación tiene prospectos asociados
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.BY_ID(id))
  },

  // ===========================================================================
  // IMPORTACIÓN DE ARCHIVOS
  // ===========================================================================

  /**
   * Importa un archivo Excel.
   * 
   * @param archivo - Archivo Excel (.xlsx, .xls) a importar
   * @param origen - Nombre descriptivo de la carga
   * @param loteId - ID del lote existente (opcional, si no se envía crea uno nuevo)
   * @returns Respuesta con la importación creada y el lote
   */
  async importar(archivo: File, origen: string, loteId?: number): Promise<ImportarResponse> {
    const formData = createUploadFormData({ archivo, origen, loteId })

    const response = await apiClient.post<unknown>(
      API_ENDPOINTS.BASE,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    )

    return parseImportarResponse(response.data)
  },

  // ===========================================================================
  // PROGRESO Y POLLING
  // ===========================================================================

  /**
   * Obtiene el progreso actual de una importación.
   */
  async getProgreso(id: number): Promise<ImportacionProgreso> {
    const { data } = await apiClient.get<ApiResponse<ImportacionProgreso>>(
      API_ENDPOINTS.PROGRESO(id)
    )
    return data.data
  },

  /**
   * Espera hasta que una importación termine (completado o fallido).
   * 
   * @param id - ID de la importación
   * @param options - Opciones de polling
   * @returns Estado final de la importación
   * @throws Error si se excede el tiempo máximo
   */
  async waitForCompletion(
    id: number,
    options: PollingOptions = {}
  ): Promise<ImportacionProgreso> {
    const {
      intervalMs = POLLING_DEFAULTS.INTERVAL_MS,
      maxAttempts = POLLING_DEFAULTS.MAX_ATTEMPTS,
      onProgress,
    } = options

    let attempts = 0

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          attempts++
          const progreso = await this.getProgreso(id)

          onProgress?.(progreso)

          if (isImportacionTerminada(progreso.estado)) {
            resolve(progreso)
            return
          }

          if (attempts >= maxAttempts) {
            reject(new Error(`Timeout: la importación ${id} no terminó después de ${maxAttempts} intentos`))
            return
          }

          setTimeout(poll, intervalMs)
        } catch (error) {
          reject(error)
        }
      }

      poll()
    })
  },

  // ===========================================================================
  // OPERACIONES DE RECUPERACIÓN
  // ===========================================================================

  /**
   * Reintenta una importación fallida.
   */
  async retry(id: number): Promise<{ mensaje: string; data: { importacion_id: number; checkpoint: number; estado: ImportacionEstado } }> {
    const { data } = await apiClient.post<{ mensaje: string; data: { importacion_id: number; checkpoint: number; estado: ImportacionEstado } }>(
      API_ENDPOINTS.RETRY(id)
    )
    return data
  },
}

// =============================================================================
// EXPORT TYPE PARA USO EXTERNO
// =============================================================================

export type ImportacionesService = typeof importacionesService
