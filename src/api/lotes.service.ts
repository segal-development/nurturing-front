/**
 * Servicio de Lotes
 * 
 * @description Maneja todas las operaciones relacionadas con lotes.
 * Un lote agrupa múltiples importaciones que el usuario sube en una sesión.
 */

import apiClient from './client'
import type {
  Lote,
  LoteProgreso,
  CrearLoteResponse,
  CerrarLoteResponse,
  ListarLotesResponse,
  LoteProgresoResponse,
} from '@/types/lote'
import { isLoteTerminado } from '@/types/lote'

// =============================================================================
// TIPOS INTERNOS
// =============================================================================

/** Opciones para polling de progreso de lote */
interface LotePollingOptions {
  intervalMs?: number
  maxAttempts?: number
  onProgress?: (progreso: LoteProgreso) => void
}

// =============================================================================
// CONSTANTES
// =============================================================================

const API_ENDPOINTS = {
  BASE: '/lotes',
  ABIERTOS: '/lotes/abiertos',
  BY_ID: (id: number) => `/lotes/${id}`,
  PROGRESO: (id: number) => `/lotes/${id}/progreso`,
  CERRAR: (id: number) => `/lotes/${id}/cerrar`,
} as const

const POLLING_DEFAULTS = {
  INTERVAL_MS: 3000,
  MAX_ATTEMPTS: 200, // ~10 minutos
} as const

// =============================================================================
// SERVICIO
// =============================================================================

export const lotesService = {
  // ===========================================================================
  // CRUD BÁSICO
  // ===========================================================================

  /**
   * Obtiene todos los lotes.
   */
  async getAll(): Promise<Lote[]> {
    const { data } = await apiClient.get<ListarLotesResponse>(API_ENDPOINTS.BASE)
    return data.data
  },

  /**
   * Obtiene lotes que aceptan más archivos (abiertos o procesando).
   */
  async getAbiertos(): Promise<Lote[]> {
    const { data } = await apiClient.get<ListarLotesResponse>(API_ENDPOINTS.ABIERTOS)
    return data.data
  },

  /**
   * Obtiene un lote por ID.
   */
  async getById(id: number): Promise<Lote> {
    const { data } = await apiClient.get<{ data: Lote }>(API_ENDPOINTS.BY_ID(id))
    return data.data
  },

  /**
   * Crea un nuevo lote.
   * 
   * @param nombre - Nombre descriptivo del lote
   */
  async crear(nombre: string): Promise<CrearLoteResponse> {
    const { data } = await apiClient.post<CrearLoteResponse>(
      API_ENDPOINTS.BASE,
      { nombre }
    )
    return data
  },

  // ===========================================================================
  // PROGRESO Y POLLING
  // ===========================================================================

  /**
   * Obtiene el progreso actual de un lote.
   */
  async getProgreso(id: number): Promise<LoteProgreso> {
    const { data } = await apiClient.get<LoteProgresoResponse>(
      API_ENDPOINTS.PROGRESO(id)
    )
    return data.data
  },

  /**
   * Espera hasta que un lote termine todas sus importaciones.
   * 
   * @param id - ID del lote
   * @param options - Opciones de polling
   * @returns Progreso final del lote
   */
  async waitForCompletion(
    id: number,
    options: LotePollingOptions = {}
  ): Promise<LoteProgreso> {
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

          if (isLoteTerminado(progreso.estado)) {
            resolve(progreso)
            return
          }

          if (attempts >= maxAttempts) {
            reject(new Error(`Timeout: el lote ${id} no terminó después de ${maxAttempts} intentos`))
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
  // OPERACIONES DE CIERRE
  // ===========================================================================

  /**
   * Cierra un lote manualmente.
   * 
   * Una vez cerrado, no se pueden agregar más archivos.
   * Solo se puede cerrar si no hay importaciones procesando.
   * 
   * @throws Error si hay importaciones en proceso
   */
  async cerrar(id: number): Promise<CerrarLoteResponse> {
    const { data } = await apiClient.post<CerrarLoteResponse>(
      API_ENDPOINTS.CERRAR(id)
    )
    return data
  },
}

// =============================================================================
// EXPORT TYPE PARA USO EXTERNO
// =============================================================================

export type LotesService = typeof lotesService
