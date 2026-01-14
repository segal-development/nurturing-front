/**
 * Tests for FlowExecutionService
 *
 * Coverage target:
 * - Core functions: 100%
 * - Edge cases: 80%
 * - Infrastructure: 0% (mocked)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flowExecutionService } from '../flowExecution.service'
import { apiClient } from '../client'
import type {
  FlowExecutionResponse,
  StartFlowExecutionPayload,
  StartFlowExecutionResponse,
  BatchingStatusResponse,
} from '@/types/flowExecution'

// Mock the API client
vi.mock('../client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('FlowExecutionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  // ============================================
  // getExecutionStatus tests
  // ============================================
  describe('getExecutionStatus', () => {
    it('should fetch execution status without ejecucionId', async () => {
      const mockResponse: FlowExecutionResponse = {
        error: false,
        data: {
          id: 1,
          flujo_id: 1,
          estado: 'in_progress',
          progreso: { porcentaje: 50 },
          fecha_inicio: '2024-01-01T00:00:00Z',
          fecha_fin: null,
        },
      }

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse })

      const result = await flowExecutionService.getExecutionStatus(1)

      expect(apiClient.get).toHaveBeenCalledWith('/flujos/1/ejecucion')
      expect(result).toEqual(mockResponse)
    })

    it('should fetch execution status with ejecucionId', async () => {
      const mockResponse: FlowExecutionResponse = {
        error: false,
        data: {
          id: 123,
          flujo_id: 1,
          estado: 'completed',
          progreso: { porcentaje: 100 },
          fecha_inicio: '2024-01-01T00:00:00Z',
          fecha_fin: '2024-01-01T01:00:00Z',
        },
      }

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse })

      const result = await flowExecutionService.getExecutionStatus(1, '123')

      expect(apiClient.get).toHaveBeenCalledWith('/flujos/1/ejecucion/123')
      expect(result).toEqual(mockResponse)
    })

    it('should handle API errors gracefully', async () => {
      const apiError = new Error('Network error')
      vi.mocked(apiClient.get).mockRejectedValue(apiError)

      await expect(flowExecutionService.getExecutionStatus(1)).rejects.toThrow('Network error')
    })
  })

  // ============================================
  // startExecution tests
  // ============================================
  describe('startExecution', () => {
    it('should start execution with minimal payload', async () => {
      const payload: StartFlowExecutionPayload = {
        flujo_id: 1,
        prospecto_ids: [1, 2, 3],
      }

      const mockResponse: StartFlowExecutionResponse = {
        error: false,
        data: {
          ejecucion_id: 456,
          mensaje: 'Ejecución iniciada correctamente',
        },
      }

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse })

      const result = await flowExecutionService.startExecution(payload)

      expect(apiClient.post).toHaveBeenCalledWith('/flujos/1/ejecucion/iniciar', payload)
      expect(result).toEqual(mockResponse)
    })

    it('should start execution with simulation mode', async () => {
      const payload: StartFlowExecutionPayload = {
        flujo_id: 1,
        prospecto_ids: [1, 2, 3],
        modo_simulacion: true,
      }

      const mockResponse: StartFlowExecutionResponse = {
        error: false,
        data: {
          ejecucion_id: 789,
          mensaje: 'Simulación iniciada',
        },
      }

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse })

      const result = await flowExecutionService.startExecution(payload)

      expect(apiClient.post).toHaveBeenCalledWith('/flujos/1/ejecucion/iniciar', payload)
      expect(result.data.ejecucion_id).toBe(789)
    })

    it('should handle empty prospecto_ids array', async () => {
      const payload: StartFlowExecutionPayload = {
        flujo_id: 1,
        prospecto_ids: [],
      }

      const mockResponse: StartFlowExecutionResponse = {
        error: true,
        data: {
          ejecucion_id: 0,
          mensaje: 'No hay prospectos para procesar',
        },
      }

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse })

      const result = await flowExecutionService.startExecution(payload)

      expect(result.error).toBe(true)
    })

    it('should handle large prospecto_ids array (20k+)', async () => {
      const largeArray = Array.from({ length: 20000 }, (_, i) => i + 1)
      const payload: StartFlowExecutionPayload = {
        flujo_id: 1,
        prospecto_ids: largeArray,
      }

      const mockResponse: StartFlowExecutionResponse = {
        error: false,
        data: {
          ejecucion_id: 999,
          mensaje: 'Ejecución iniciada para 20000 prospectos',
        },
      }

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse })

      const result = await flowExecutionService.startExecution(payload)

      expect(apiClient.post).toHaveBeenCalledWith('/flujos/1/ejecucion/iniciar', payload)
      expect(result.error).toBe(false)
    })
  })

  // ============================================
  // cancelExecution tests
  // ============================================
  describe('cancelExecution', () => {
    it('should cancel ongoing execution', async () => {
      const mockResponse = {
        id: 123,
        flujo_id: 1,
        estado: 'cancelled',
        fecha_fin: '2024-01-01T00:30:00Z',
      }

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse })

      const result = await flowExecutionService.cancelExecution(1, '123')

      expect(apiClient.post).toHaveBeenCalledWith('/flujos/1/ejecucion/123/cancelar')
      expect(result.estado).toBe('cancelled')
    })

    it('should handle cancellation of already completed execution', async () => {
      const apiError = new Error('Cannot cancel completed execution')
      vi.mocked(apiClient.post).mockRejectedValue(apiError)

      await expect(flowExecutionService.cancelExecution(1, '123')).rejects.toThrow(
        'Cannot cancel completed execution',
      )
    })
  })

  // ============================================
  // getExecutionEvents tests
  // ============================================
  describe('getExecutionEvents', () => {
    it('should fetch events with default pagination', async () => {
      const mockResponse = {
        eventos: [
          { id: 1, tipo: 'stage_started', timestamp: '2024-01-01T00:00:00Z' },
          { id: 2, tipo: 'email_sent', timestamp: '2024-01-01T00:01:00Z' },
        ],
        total: 100,
        limit: 50,
        offset: 0,
      }

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse })

      const result = await flowExecutionService.getExecutionEvents(1, '123')

      expect(apiClient.get).toHaveBeenCalledWith('/flujos/1/ejecucion/123/eventos', {
        params: { limit: 50, offset: 0 },
      })
      expect(result.eventos).toHaveLength(2)
      expect(result.total).toBe(100)
    })

    it('should fetch events with custom pagination', async () => {
      const mockResponse = {
        eventos: [],
        total: 1000,
        limit: 100,
        offset: 500,
      }

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse })

      const result = await flowExecutionService.getExecutionEvents(1, '123', 100, 500)

      expect(apiClient.get).toHaveBeenCalledWith('/flujos/1/ejecucion/123/eventos', {
        params: { limit: 100, offset: 500 },
      })
    })
  })

  // ============================================
  // getExecutionHistory tests
  // ============================================
  describe('getExecutionHistory', () => {
    it('should fetch execution history with default limit', async () => {
      const mockResponse = {
        ejecuciones: [
          { id: 1, estado: 'completed', fecha_inicio: '2024-01-01' },
          { id: 2, estado: 'failed', fecha_inicio: '2024-01-02' },
        ],
        total: 50,
      }

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse })

      const result = await flowExecutionService.getExecutionHistory(1)

      expect(apiClient.get).toHaveBeenCalledWith('/flujos/1/ejecuciones', {
        params: { limit: 20 },
      })
      expect(result.ejecuciones).toHaveLength(2)
    })

    it('should fetch execution history with custom limit', async () => {
      const mockResponse = {
        ejecuciones: [],
        total: 0,
      }

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse })

      await flowExecutionService.getExecutionHistory(1, 100)

      expect(apiClient.get).toHaveBeenCalledWith('/flujos/1/ejecuciones', {
        params: { limit: 100 },
      })
    })
  })

  // ============================================
  // getBatchingStatus tests
  // ============================================
  describe('getBatchingStatus', () => {
    it('should fetch batching status when batching is active', async () => {
      const mockResponse: BatchingStatusResponse = {
        error: false,
        data: {
          has_batching: true,
          resumen: {
            total_etapas_con_batching: 3,
            status: 'in_progress',
            batches: {
              total: 200,
              completed: 150,
              pending: 50,
              percentage: 75,
            },
            prospectos: {
              total: 20000,
              enviados: 15000,
              pendientes: 5000,
            },
          },
        },
      }

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse })

      const result = await flowExecutionService.getBatchingStatus(1, '123')

      expect(apiClient.get).toHaveBeenCalledWith('/flujos/1/ejecuciones/123/batching-status')
      expect(result.data.has_batching).toBe(true)
      expect(result.data.resumen?.batches?.percentage).toBe(75)
    })

    it('should fetch batching status when no batching', async () => {
      const mockResponse: BatchingStatusResponse = {
        error: false,
        data: {
          has_batching: false,
          mensaje: 'No hay batching activo para esta ejecución',
        },
      }

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse })

      const result = await flowExecutionService.getBatchingStatus(1, '123')

      expect(result.data.has_batching).toBe(false)
    })

    it('should handle completed batching status', async () => {
      const mockResponse: BatchingStatusResponse = {
        error: false,
        data: {
          has_batching: true,
          resumen: {
            total_etapas_con_batching: 5,
            status: 'completed',
            batches: {
              total: 350,
              completed: 350,
              pending: 0,
              percentage: 100,
            },
            prospectos: {
              total: 35000,
              enviados: 35000,
              pendientes: 0,
            },
          },
        },
      }

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse })

      const result = await flowExecutionService.getBatchingStatus(1, '123')

      expect(result.data.resumen?.status).toBe('completed')
      expect(result.data.resumen?.batches?.percentage).toBe(100)
      expect(result.data.resumen?.prospectos?.pendientes).toBe(0)
    })

    it('should handle partial failure batching status', async () => {
      const mockResponse: BatchingStatusResponse = {
        error: false,
        data: {
          has_batching: true,
          resumen: {
            total_etapas_con_batching: 2,
            status: 'partial_failure',
            batches: {
              total: 100,
              completed: 95,
              pending: 0,
              percentage: 95,
            },
            prospectos: {
              total: 10000,
              enviados: 9500,
              pendientes: 0,
            },
          },
          etapas: [
            {
              etapa_id: 1,
              node_id: 'stage_1',
              estado_etapa: 'completed',
              has_batching: true,
              status: 'completed',
            },
            {
              etapa_id: 2,
              node_id: 'stage_2',
              estado_etapa: 'partial_failure',
              has_batching: true,
              status: 'partial_failure',
            },
          ],
        },
      }

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse })

      const result = await flowExecutionService.getBatchingStatus(1, '123')

      expect(result.data.resumen?.status).toBe('partial_failure')
      expect(result.data.etapas).toHaveLength(2)
    })
  })

  // ============================================
  // Edge cases
  // ============================================
  describe('Edge Cases', () => {
    it('should handle null flujoId gracefully', async () => {
      // @ts-expect-error Testing null input
      await expect(flowExecutionService.getExecutionStatus(null)).rejects.toThrow()
    })

    it('should handle undefined ejecucionId', async () => {
      const mockResponse = { error: false, data: {} }
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse })

      await flowExecutionService.getExecutionStatus(1, undefined)

      expect(apiClient.get).toHaveBeenCalledWith('/flujos/1/ejecucion')
    })

    it('should handle empty string ejecucionId', async () => {
      const mockResponse = { error: false, data: {} }
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse })

      await flowExecutionService.getExecutionStatus(1, '')

      // Empty string is falsy, so should not append to URL
      expect(apiClient.get).toHaveBeenCalledWith('/flujos/1/ejecucion')
    })
  })
})
