/**
 * Tests for FlowExecution types and type guards
 *
 * These tests validate the structure and behavior of batching-related types
 * to ensure proper handling of large volume executions (20k+ prospects)
 */

import { describe, it, expect } from 'vitest'
import type {
  BatchingStatus,
  BatchInfo,
  EtapaBatchingInfo,
  BatchingSummary,
  BatchingStatusResponse,
  FlowExecution,
  ExecutionState,
} from '../flowExecution'

describe('FlowExecution Types', () => {
  // ============================================
  // BatchingStatus type tests
  // ============================================
  describe('BatchingStatus', () => {
    it('should accept valid batching status values', () => {
      const validStatuses: BatchingStatus[] = ['in_progress', 'completed', 'failed', 'partial_failure']

      validStatuses.forEach((status) => {
        expect(['in_progress', 'completed', 'failed', 'partial_failure']).toContain(status)
      })
    })
  })

  // ============================================
  // ExecutionState type tests
  // ============================================
  describe('ExecutionState', () => {
    it('should accept valid execution state values', () => {
      const validStates: ExecutionState[] = [
        'pending',
        'in_progress',
        'paused',
        'completed',
        'failed',
        'cancelled',
      ]

      validStates.forEach((state) => {
        expect(['pending', 'in_progress', 'paused', 'completed', 'failed', 'cancelled']).toContain(
          state,
        )
      })
    })
  })

  // ============================================
  // BatchInfo structure tests
  // ============================================
  describe('BatchInfo', () => {
    it('should have correct structure for pending batch', () => {
      const pendingBatch: BatchInfo = {
        batch_number: 1,
        prospectos_count: 100,
        completed_at: null,
        failed_at: null,
        error: null,
        response: null,
        status: 'pending',
      }

      expect(pendingBatch.status).toBe('pending')
      expect(pendingBatch.completed_at).toBeNull()
      expect(pendingBatch.response).toBeNull()
    })

    it('should have correct structure for completed batch', () => {
      const completedBatch: BatchInfo = {
        batch_number: 5,
        prospectos_count: 100,
        completed_at: '2024-01-01T12:00:00Z',
        failed_at: null,
        error: null,
        response: {
          exitosos: 98,
          errores: 2,
        },
        status: 'completed',
      }

      expect(completedBatch.status).toBe('completed')
      expect(completedBatch.response?.exitosos).toBe(98)
      expect(completedBatch.response?.errores).toBe(2)
    })

    it('should have correct structure for failed batch', () => {
      const failedBatch: BatchInfo = {
        batch_number: 10,
        prospectos_count: 100,
        completed_at: null,
        failed_at: '2024-01-01T12:30:00Z',
        error: 'SMTP connection timeout',
        response: null,
        status: 'failed',
      }

      expect(failedBatch.status).toBe('failed')
      expect(failedBatch.error).toBe('SMTP connection timeout')
      expect(failedBatch.failed_at).not.toBeNull()
    })
  })

  // ============================================
  // EtapaBatchingInfo structure tests
  // ============================================
  describe('EtapaBatchingInfo', () => {
    it('should correctly represent a stage without batching', () => {
      const etapaSinBatching: EtapaBatchingInfo = {
        etapa_id: 1,
        node_id: 'stage_1',
        estado_etapa: 'pending',
        has_batching: false,
      }

      expect(etapaSinBatching.has_batching).toBe(false)
      expect(etapaSinBatching.progress).toBeUndefined()
    })

    it('should correctly represent a stage with active batching', () => {
      const etapaConBatching: EtapaBatchingInfo = {
        etapa_id: 2,
        node_id: 'stage_2',
        estado_etapa: 'executing',
        has_batching: true,
        status: 'in_progress',
        progress: {
          total_batches: 200,
          batches_completed: 150,
          batches_pending: 50,
          percentage: 75,
        },
        prospectos: {
          total: 20000,
          enviados: 15000,
          pendientes: 5000,
        },
        timing: {
          started_at: '2024-01-01T10:00:00Z',
          completed_at: null,
          estimated_completion: '2024-01-01T14:00:00Z',
        },
      }

      expect(etapaConBatching.has_batching).toBe(true)
      expect(etapaConBatching.progress?.percentage).toBe(75)
      expect(etapaConBatching.prospectos?.total).toBe(20000)
    })

    it('should handle large volume batching (350k prospects)', () => {
      const largeVolumeEtapa: EtapaBatchingInfo = {
        etapa_id: 3,
        node_id: 'stage_email_masivo',
        estado_etapa: 'executing',
        has_batching: true,
        status: 'in_progress',
        progress: {
          total_batches: 3500, // 350k / 100 per batch
          batches_completed: 1750,
          batches_pending: 1750,
          percentage: 50,
        },
        prospectos: {
          total: 350000,
          enviados: 175000,
          pendientes: 175000,
        },
        timing: {
          started_at: '2024-01-01T00:00:00Z',
          completed_at: null,
          estimated_completion: '2024-01-01T06:00:00Z', // 6 hours for 350k
        },
      }

      expect(largeVolumeEtapa.prospectos?.total).toBe(350000)
      expect(largeVolumeEtapa.progress?.total_batches).toBe(3500)
    })
  })

  // ============================================
  // BatchingSummary structure tests
  // ============================================
  describe('BatchingSummary', () => {
    it('should correctly represent summary with no batching', () => {
      const noSummary: BatchingSummary = {
        total_etapas_con_batching: 0,
        status: 'none',
      }

      expect(noSummary.status).toBe('none')
      expect(noSummary.batches).toBeUndefined()
    })

    it('should correctly represent completed batching summary', () => {
      const completedSummary: BatchingSummary = {
        total_etapas_con_batching: 5,
        status: 'completed',
        batches: {
          total: 500,
          completed: 500,
          pending: 0,
          percentage: 100,
        },
        prospectos: {
          total: 50000,
          enviados: 50000,
          pendientes: 0,
        },
      }

      expect(completedSummary.status).toBe('completed')
      expect(completedSummary.batches?.percentage).toBe(100)
      expect(completedSummary.prospectos?.pendientes).toBe(0)
    })

    it('should correctly calculate percentage for in-progress batching', () => {
      const inProgressSummary: BatchingSummary = {
        total_etapas_con_batching: 3,
        status: 'in_progress',
        batches: {
          total: 200,
          completed: 75,
          pending: 125,
          percentage: 37.5,
        },
        prospectos: {
          total: 20000,
          enviados: 7500,
          pendientes: 12500,
        },
      }

      // Verify percentage calculation
      const calculatedPercentage =
        (inProgressSummary.batches!.completed / inProgressSummary.batches!.total) * 100
      expect(calculatedPercentage).toBeCloseTo(37.5)
    })
  })

  // ============================================
  // BatchingStatusResponse structure tests
  // ============================================
  describe('BatchingStatusResponse', () => {
    it('should correctly represent response with active batching', () => {
      const response: BatchingStatusResponse = {
        error: false,
        data: {
          has_batching: true,
          resumen: {
            total_etapas_con_batching: 2,
            status: 'in_progress',
            batches: {
              total: 100,
              completed: 50,
              pending: 50,
              percentage: 50,
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
              estado_etapa: 'executing',
              has_batching: true,
              status: 'in_progress',
            },
          ],
        },
      }

      expect(response.error).toBe(false)
      expect(response.data.has_batching).toBe(true)
      expect(response.data.etapas).toHaveLength(2)
    })

    it('should correctly represent response without batching', () => {
      const response: BatchingStatusResponse = {
        error: false,
        data: {
          has_batching: false,
          mensaje: 'Este flujo no requiere batching',
        },
      }

      expect(response.data.has_batching).toBe(false)
      expect(response.data.mensaje).toBeDefined()
    })

    it('should correctly represent error response', () => {
      const errorResponse: BatchingStatusResponse = {
        error: true,
        data: {
          has_batching: false,
          mensaje: 'Ejecución no encontrada',
        },
      }

      expect(errorResponse.error).toBe(true)
    })
  })

  // ============================================
  // FlowExecution structure tests
  // ============================================
  describe('FlowExecution', () => {
    it('should correctly represent a pending execution', () => {
      const pendingExecution: FlowExecution = {
        id: 1,
        flujo_id: 10,
        estado: 'pending',
        progreso: {
          porcentaje: 0,
        },
        fecha_inicio: '2024-01-01T00:00:00Z',
        fecha_fin: null,
      }

      expect(pendingExecution.estado).toBe('pending')
      expect(pendingExecution.progreso?.porcentaje).toBe(0)
      expect(pendingExecution.fecha_fin).toBeNull()
    })

    it('should correctly represent a completed execution', () => {
      const completedExecution: FlowExecution = {
        id: 2,
        flujo_id: 10,
        estado: 'completed',
        progreso: {
          porcentaje: 100,
          etapas_completadas: 5,
          etapas_totales: 5,
        },
        fecha_inicio: '2024-01-01T00:00:00Z',
        fecha_fin: '2024-01-01T06:00:00Z',
        estadisticas: {
          emails_enviados: 35000,
          emails_fallidos: 150,
          sms_enviados: 0,
          sms_fallidos: 0,
        },
      }

      expect(completedExecution.estado).toBe('completed')
      expect(completedExecution.fecha_fin).not.toBeNull()
      expect(completedExecution.estadisticas?.emails_enviados).toBe(35000)
    })

    it('should correctly represent a failed execution', () => {
      const failedExecution: FlowExecution = {
        id: 3,
        flujo_id: 10,
        estado: 'failed',
        progreso: {
          porcentaje: 45,
        },
        fecha_inicio: '2024-01-01T00:00:00Z',
        fecha_fin: '2024-01-01T02:30:00Z',
        error: 'Error de conexión con el servidor de correo',
      }

      expect(failedExecution.estado).toBe('failed')
      expect(failedExecution.error).toBeDefined()
    })
  })

  // ============================================
  // Helper function tests (type guards)
  // ============================================
  describe('Type Guards and Helpers', () => {
    it('should identify in-progress execution', () => {
      const isInProgress = (execution: FlowExecution): boolean => {
        return execution.estado === 'in_progress'
      }

      const execution: FlowExecution = {
        id: 1,
        flujo_id: 1,
        estado: 'in_progress',
        fecha_inicio: '2024-01-01',
        fecha_fin: null,
      }

      expect(isInProgress(execution)).toBe(true)
    })

    it('should identify terminal states', () => {
      const isTerminalState = (state: ExecutionState): boolean => {
        return ['completed', 'failed', 'cancelled'].includes(state)
      }

      expect(isTerminalState('completed')).toBe(true)
      expect(isTerminalState('failed')).toBe(true)
      expect(isTerminalState('cancelled')).toBe(true)
      expect(isTerminalState('in_progress')).toBe(false)
      expect(isTerminalState('pending')).toBe(false)
    })

    it('should calculate remaining time estimate', () => {
      const calculateRemainingTime = (progress: {
        total: number
        completed: number
        started_at: string
      }): number => {
        const elapsed = Date.now() - new Date(progress.started_at).getTime()
        const completedRatio = progress.completed / progress.total
        if (completedRatio === 0) return Infinity
        const estimatedTotal = elapsed / completedRatio
        return estimatedTotal - elapsed
      }

      const progress = {
        total: 100,
        completed: 50,
        started_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      }

      const remaining = calculateRemainingTime(progress)
      // Should be approximately 1 hour remaining (3600000ms)
      expect(remaining).toBeGreaterThan(3500000)
      expect(remaining).toBeLessThan(3700000)
    })
  })
})
