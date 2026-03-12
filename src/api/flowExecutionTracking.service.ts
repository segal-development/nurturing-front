/**
 * Flow Execution Tracking Service
 * Handles all API calls for detailed flow execution tracking by stage/node
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles Flow Execution Tracking API calls
 * - Open/Closed: Easy to extend with new endpoints
 * - Interface Segregation: Focused method contracts
 * - Dependency Inversion: Depends on HTTP client abstraction
 */

import { logger } from '@/lib/logger'
import type {
  FlowExecutionDetailResponse,
  PauseExecutionPayload,
  PauseExecutionResponse,
  ResumeExecutionResponse,
  CancelExecutionResponse,
  ActiveExecutionResponse,
  FlowExecutionsListResponse,
  CohortesActivasResponse,
} from '@/types/flowExecutionTracking'
import { apiClient } from './client'

const BASE_URL = '/flujos'

/**
 * FlowExecutionTrackingService class
 * Provides methods to track flow execution with detailed stage/node information
 */
class FlowExecutionTrackingService {
  /**
   * Get all executions of a flow
   *
   * @param flujoId - Flow ID
   * @param limit - Maximum number of executions to return
   * @returns List of executions with their stages
   *
   * @example
   * const executions = await flowExecutionTrackingService.getExecutions(1, 20)
   */
  async getExecutions(flujoId: number, limit: number = 20): Promise<FlowExecutionsListResponse> {
    const url = `${BASE_URL}/${flujoId}/ejecuciones`
    logger.log('[FlowExecutionTrackingService.getExecutions] Making request:', {
      url,
      flujoId,
      limit,
    })
    
    try {
      const response = await apiClient.get<FlowExecutionsListResponse>(url, {
        params: {
          limit,
        },
      })
      
      logger.log('[FlowExecutionTrackingService.getExecutions] Response:', {
        status: response.status,
        data: response.data,
        hasData: !!response.data?.data,
        dataLength: response.data?.data?.length,
      })
      
      return response.data
    } catch (error: any) {
      logger.error('[FlowExecutionTrackingService.getExecutions] Error:', {
        url,
        flujoId,
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })
      throw error
    }
  }

  /**
   * Check if flow has an active execution
   *
   * @param flujoId - Flow ID
   * @returns Active execution info or null
   *
   * @example
   * const activeExec = await flowExecutionTrackingService.getActiveExecution(1)
   * if (activeExec.tiene_ejecucion_activa) {
   *   console.log('Active execution:', activeExec.ejecucion)
   * }
   */
  async getActiveExecution(flujoId: number): Promise<ActiveExecutionResponse> {
    const response = await apiClient.get<ActiveExecutionResponse>(
      `${BASE_URL}/${flujoId}/ejecuciones/activa`,
    )
    return response.data
  }

  /**
   * Get detailed execution with stage/node tracking
   *
   * @param flujoId - Flow ID
   * @param ejecucionId - Execution ID
   * @returns Complete execution details with stages, jobs, and conditions
   *
   * @example
   * const execution = await flowExecutionTrackingService.getExecutionDetail(1, 123)
   * // Returns: { error: false, data: { id: 123, etapas: [...], jobs: [...] } }
   */
  async getExecutionDetail(flujoId: number, ejecucionId: number): Promise<FlowExecutionDetailResponse> {
    const response = await apiClient.get<FlowExecutionDetailResponse>(
      `${BASE_URL}/${flujoId}/ejecuciones/${ejecucionId}`,
    )
    return response.data
  }

  /**
   * Pause an ongoing execution
   *
   * @param flujoId - Flow ID
   * @param ejecucionId - Execution ID
   * @param payload - Optional pause reason
   * @returns Updated execution state
   *
   * @example
   * await flowExecutionTrackingService.pauseExecution(1, 123, { razon: 'Manual pause' })
   */
  async pauseExecution(
    flujoId: number,
    ejecucionId: number,
    payload?: PauseExecutionPayload,
  ): Promise<PauseExecutionResponse> {
    const response = await apiClient.post<PauseExecutionResponse>(
      `${BASE_URL}/${flujoId}/ejecuciones/${ejecucionId}/pausar`,
      payload || {},
    )
    return response.data
  }

  /**
   * Resume a paused execution
   *
   * @param flujoId - Flow ID
   * @param ejecucionId - Execution ID
   * @returns Updated execution state
   *
   * @example
   * await flowExecutionTrackingService.resumeExecution(1, 123)
   */
  async resumeExecution(flujoId: number, ejecucionId: number): Promise<ResumeExecutionResponse> {
    const response = await apiClient.post<ResumeExecutionResponse>(
      `${BASE_URL}/${flujoId}/ejecuciones/${ejecucionId}/reanudar`,
    )
    return response.data
  }

  /**
   * Cancel an ongoing execution
   *
   * @param flujoId - Flow ID
   * @param ejecucionId - Execution ID
   * @returns Cancellation confirmation
   *
   * @example
   * await flowExecutionTrackingService.cancelExecution(1, 123)
   */
  async cancelExecution(flujoId: number, ejecucionId: number): Promise<CancelExecutionResponse> {
    const response = await apiClient.delete<CancelExecutionResponse>(
      `${BASE_URL}/${flujoId}/ejecuciones/${ejecucionId}`,
    )
    return response.data
  }

  /**
   * Get active cohorts summary for a flow
   * Shows all active executions (cohorts) with per-node statistics
   *
   * @param flujoId - Flow ID
   * @returns Cohorts summary with per-node breakdown
   *
   * @example
   * const cohorts = await flowExecutionTrackingService.getCohortesActivas(1)
   * if (cohorts.data.total_cohortes > 1) {
   *   console.log('Multiple active cohorts')
   * }
   */
  async getCohortesActivas(flujoId: number): Promise<CohortesActivasResponse> {
    const response = await apiClient.get<CohortesActivasResponse>(
      `${BASE_URL}/${flujoId}/cohortes-activas`,
    )
    return response.data
  }

  /**
   * Get execution state for multiple flows in a single request.
   * 
   * PERFORMANCE: Reduces N*3 requests to 1 request.
   * Before: 15 flows = 45 requests (3 per flow)
   * After: 15 flows = 1 request
   *
   * @param flujoIds - Array of flow IDs
   * @returns Map of flujoId -> execution state
   *
   * @example
   * const states = await flowExecutionTrackingService.getBatchExecutionState([1, 2, 3])
   * // Returns: { 1: { tiene_ejecucion: true, ... }, 2: { ... }, ... }
   */
  async getBatchExecutionState(flujoIds: number[]): Promise<BatchExecutionStateResponse> {
    if (flujoIds.length === 0) {
      return { error: false, data: {} }
    }

    const response = await apiClient.get<BatchExecutionStateResponse>(
      `${BASE_URL}/ejecuciones-batch`,
      {
        params: {
          ids: flujoIds.join(','),
        },
      },
    )
    return response.data
  }
}

// Types for batch endpoint
export interface BatchExecutionState {
  tiene_ejecucion: boolean
  tiene_ejecucion_activa: boolean
  puede_ejecutar: boolean
  ejecucion: {
    id: number
    estado: string
    fecha_inicio_programada: string | null
    fecha_inicio_real: string | null
    fecha_fin: string | null
    prospectos_count: number
    progreso: {
      porcentaje: number
      completadas: number
      total: number
      fallidas: number
    }
    costo_estimado: number | null
    costo_real: number | null
    etapas: Array<{
      id: number
      node_id: string
      estado: string
      ejecutado: boolean
    }>
  } | null
}

export interface BatchExecutionStateResponse {
  error: boolean
  data: Record<number, BatchExecutionState>
}

export const flowExecutionTrackingService = new FlowExecutionTrackingService()
