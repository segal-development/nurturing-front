/**
 * FlowExecutionService
 * Handles all API calls related to flow execution monitoring
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles Flow Execution API calls
 * - Open/Closed: Easy to extend with new endpoints
 * - Interface Segregation: Focused method contracts
 * - Dependency Inversion: Depends on HTTP client abstraction
 */

import type {
  FlowExecution,
  FlowExecutionResponse,
  StartFlowExecutionPayload,
  StartFlowExecutionResponse,
  BatchingStatusResponse,
} from '@/types/flowExecution'
import { apiClient } from './client'

const BASE_URL = '/flujos'

/**
 * FlowExecutionService class
 * Provides methods to interact with flow execution endpoints
 */
class FlowExecutionService {
  /**
   * Get current execution status of a flow
   *
   * @param flujoId - Flow ID
   * @param ejecucionId - Execution ID (if monitoring an ongoing execution)
   * @returns Current execution state and metrics
   *
   * @example
   * const status = await flowExecutionService.getExecutionStatus(1)
   */
  async getExecutionStatus(flujoId: number, ejecucionId?: string): Promise<FlowExecutionResponse> {
    const response = await apiClient.get<FlowExecutionResponse>(
      `${BASE_URL}/${flujoId}/ejecucion${ejecucionId ? `/${ejecucionId}` : ''}`,
    )
    return response.data
  }

  /**
   * Start execution of a flow
   *
   * @param payload - Flow execution configuration
   * @returns Execution response with execution ID
   *
   * @example
   * const result = await flowExecutionService.startExecution({
   *   flujo_id: 1,
   *   prospecto_ids: [1, 2, 3]
   * })
   */
  async startExecution(payload: StartFlowExecutionPayload): Promise<StartFlowExecutionResponse> {
    const response = await apiClient.post<StartFlowExecutionResponse>(
      `${BASE_URL}/${payload.flujo_id}/ejecucion/iniciar`,
      payload,
    )
    return response.data
  }

  /**
   * Cancel ongoing flow execution
   *
   * @param flujoId - Flow ID
   * @param ejecucionId - Execution ID
   * @returns Updated execution state
   *
   * @example
   * await flowExecutionService.cancelExecution(1, 'exec-123')
   */
  async cancelExecution(flujoId: number, ejecucionId: string): Promise<FlowExecution> {
    const response = await apiClient.post<FlowExecution>(
      `${BASE_URL}/${flujoId}/ejecucion/${ejecucionId}/cancelar`,
    )
    return response.data
  }

  /**
   * Get execution events/timeline for a specific execution
   *
   * @param flujoId - Flow ID
   * @param ejecucionId - Execution ID
   * @param limit - Max number of events to return
   * @param offset - Pagination offset
   * @returns Paginated list of execution events
   *
   * @example
   * const events = await flowExecutionService.getExecutionEvents(1, 'exec-123', 50, 0)
   */
  async getExecutionEvents(
    flujoId: number,
    ejecucionId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{
    eventos: Array<any>
    total: number
    limit: number
    offset: number
  }> {
    const response = await apiClient.get(
      `${BASE_URL}/${flujoId}/ejecucion/${ejecucionId}/eventos`,
      {
        params: {
          limit,
          offset,
        },
      },
    )
    return response.data
  }

  /**
   * Get execution history for a flow
   *
   * @param flujoId - Flow ID
   * @param limit - Max number of executions to return
   * @returns List of past executions
   *
   * @example
   * const history = await flowExecutionService.getExecutionHistory(1, 10)
   */
  async getExecutionHistory(
    flujoId: number,
    limit: number = 20,
  ): Promise<{
    ejecuciones: FlowExecution[]
    total: number
  }> {
    const response = await apiClient.get(`${BASE_URL}/${flujoId}/ejecuciones`, {
      params: {
        limit,
      },
    })
    return response.data
  }

  /**
   * Get batching status for an execution
   *
   * @param flujoId - Flow ID
   * @param ejecucionId - Execution ID
   * @returns Batching progress information
   *
   * @example
   * const status = await flowExecutionService.getBatchingStatus(1, 'exec-123')
   */
  async getBatchingStatus(
    flujoId: number,
    ejecucionId: string,
  ): Promise<BatchingStatusResponse> {
    const response = await apiClient.get<BatchingStatusResponse>(
      `${BASE_URL}/${flujoId}/ejecuciones/${ejecucionId}/batching-status`,
    )
    return response.data
  }
}

export const flowExecutionService = new FlowExecutionService()
