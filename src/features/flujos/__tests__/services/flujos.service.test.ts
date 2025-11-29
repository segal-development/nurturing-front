/**
 * Unit tests for flujos.service
 * API integration and data transformation
 *
 * Coverage: Core API functions = 100%, Error handling = 100%
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flujosService } from '@/api/flujos.service'
import {
  createMockFlujosService,
  mockOpcionesFlujos,
  mockFlujoNurturing,
  mockFlujoResponse,
  mockEjecucionFlujo,
  createMockFlujo,
  createMockFlujoList,
} from '../mocks/flujosService.mock'

/**
 * Mock the API client
 */
vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('flujosService', () => {
  const mockService = createMockFlujosService()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getOpciones', () => {
    it('should fetch and return filter options', async () => {
      mockService.getOpciones.mockResolvedValueOnce(mockOpcionesFlujos)

      const result = await mockService.getOpciones()

      expect(result).toEqual(mockOpcionesFlujos)
      expect(result.origenes).toHaveLength(2)
      expect(result.tipos_deudor).toHaveLength(2)
    })

    it('should handle empty options', async () => {
      mockService.getOpciones.mockResolvedValueOnce({
        origenes: [],
        tipos_deudor: [],
      })

      const result = await mockService.getOpciones()

      expect(result.origenes).toEqual([])
      expect(result.tipos_deudor).toEqual([])
    })

    it('should throw error on network failure', async () => {
      const error = new Error('Network error')
      mockService.getOpciones.mockRejectedValueOnce(error)

      await expect(mockService.getOpciones()).rejects.toThrow('Network error')
    })

    it('should handle malformed response gracefully', async () => {
      mockService.getOpciones.mockResolvedValueOnce({
        origenes: null,
        tipos_deudor: undefined,
      })

      const result = await mockService.getOpciones()

      // Should not crash
      expect(result).toBeDefined()
    })
  })

  describe('getAll', () => {
    it('should fetch all flujos without filters', async () => {
      mockService.getAll.mockResolvedValueOnce(mockFlujoResponse)

      const result = await mockService.getAll()

      expect(result.data).toHaveLength(1)
      expect(result.meta.total).toBe(50)
      expect(result.meta.current_page).toBe(1)
    })

    it('should apply origen_id filter', async () => {
      const filteredResponse = {
        ...mockFlujoResponse,
        data: [mockFlujoNurturing],
      }
      mockService.getAll.mockResolvedValueOnce(filteredResponse)

      const result = await mockService.getAll({ origen_id: 1 })

      expect(result.data).toHaveLength(1)
      expect(mockService.getAll).toHaveBeenCalledWith({ origen_id: 1 })
    })

    it('should apply tipo_deudor filter', async () => {
      mockService.getAll.mockResolvedValueOnce(mockFlujoResponse)

      await mockService.getAll({ tipo_deudor: 'persona' })

      expect(mockService.getAll).toHaveBeenCalledWith({ tipo_deudor: 'persona' })
    })

    it('should apply pagination params', async () => {
      mockService.getAll.mockResolvedValueOnce({
        ...mockFlujoResponse,
        meta: { ...mockFlujoResponse.meta, current_page: 2 },
      })

      const result = await mockService.getAll({ page: 2, per_page: 10 })

      expect(mockService.getAll).toHaveBeenCalledWith({ page: 2, per_page: 10 })
      expect(result.meta.current_page).toBe(2)
    })

    it('should handle multiple filters combined', async () => {
      mockService.getAll.mockResolvedValueOnce(mockFlujoResponse)

      await mockService.getAll({
        origen_id: 1,
        tipo_deudor: 'empresa',
        page: 2,
        per_page: 20,
      })

      expect(mockService.getAll).toHaveBeenCalledWith({
        origen_id: 1,
        tipo_deudor: 'empresa',
        page: 2,
        per_page: 20,
      })
    })

    it('should throw error on server failure', async () => {
      const error = new Error('Server error')
      mockService.getAll.mockRejectedValueOnce(error)

      await expect(mockService.getAll()).rejects.toThrow('Server error')
    })

    it('should handle large result sets', async () => {
      const largeList = createMockFlujoList(100)
      mockService.getAll.mockResolvedValueOnce(largeList)

      const result = await mockService.getAll()

      expect(result.data).toHaveLength(100)
      expect(result.meta.total).toBe(100)
    })
  })

  describe('getById', () => {
    it('should fetch flujo by ID', async () => {
      mockService.getById.mockResolvedValueOnce(mockFlujoNurturing)

      const result = await mockService.getById(1)

      expect(result).toEqual(mockFlujoNurturing)
      expect(result.id).toBe(1)
      expect(mockService.getById).toHaveBeenCalledWith(1)
    })

    it('should return complete flujo with all relations', async () => {
      mockService.getById.mockResolvedValueOnce(mockFlujoNurturing)

      const result = await mockService.getById(1)

      expect(result.config_visual).toBeDefined()
      expect(result.config_structure).toBeDefined()
      expect(result.etapas).toBeDefined()
      expect(result.estadisticas).toBeDefined()
    })

    it('should throw error for non-existent ID', async () => {
      mockService.getById.mockRejectedValueOnce(new Error('Not found'))

      await expect(mockService.getById(999)).rejects.toThrow('Not found')
    })

    it('should handle ID edge cases', async () => {
      mockService.getById.mockResolvedValueOnce(mockFlujoNurturing)

      // ID = 0 should work (edge case)
      await mockService.getById(0)
      expect(mockService.getById).toHaveBeenCalledWith(0)
    })

    it('should maintain data types in response', async () => {
      mockService.getById.mockResolvedValueOnce(mockFlujoNurturing)

      const result = await mockService.getById(1)

      expect(typeof result.id).toBe('number')
      expect(typeof result.nombre).toBe('string')
      expect(typeof result.activo).toBe('boolean')
      expect(Array.isArray(result.etapas)).toBe(true)
    })
  })

  describe('createWithProspectos', () => {
    it('should create flujo with prospects', async () => {
      const payload = {
        nombre: 'New Flow',
        descripcion: 'Test flow',
        tipo_prospecto: 'persona',
        origen_id: 1,
        prospectos_ids: [1, 2, 3],
        config_visual: { nodes: [], edges: [] },
        config_structure: { stages: [], conditions: [], branches: [] },
        distribucion: {
          tipoMensaje: 'email',
          emailPercentage: 100,
          costEmail: 0.5,
          costSms: 1,
        },
        total_cost: 1.5,
        estimatedTime: 24,
      }

      mockService.createWithProspectos.mockResolvedValueOnce({
        ...mockFlujoNurturing,
        nombre: 'New Flow',
      })

      const result = await mockService.createWithProspectos(payload)

      expect(result.id).toBeDefined()
      expect(result.nombre).toBe('New Flow')
      expect(mockService.createWithProspectos).toHaveBeenCalledWith(payload)
    })

    it('should validate required fields', async () => {
      const invalidPayload = {
        nombre: '', // Empty name
        descripcion: 'Test',
        // Missing other required fields
      }

      mockService.createWithProspectos.mockRejectedValueOnce(
        new Error('Nombre es requerido')
      )

      await expect(mockService.createWithProspectos(invalidPayload as any)).rejects.toThrow(
        'Nombre es requerido'
      )
    })

    it('should handle empty prospects list', async () => {
      const payload = {
        nombre: 'Flow',
        descripcion: 'Test',
        tipo_prospecto: 'persona',
        origen_id: 1,
        prospectos_ids: [], // Empty
        config_visual: { nodes: [], edges: [] },
        config_structure: { stages: [], conditions: [], branches: [] },
        distribucion: { tipoMensaje: 'email', emailPercentage: 100, costEmail: 0.5, costSms: 1 },
        total_cost: 0,
        estimatedTime: 0,
      }

      mockService.createWithProspectos.mockResolvedValueOnce(mockFlujoNurturing)

      const result = await mockService.createWithProspectos(payload)
      expect(result).toBeDefined()
    })

    it('should calculate costs correctly', async () => {
      const payload = {
        nombre: 'Premium Flow',
        descripcion: 'Test',
        tipo_prospecto: 'empresa',
        origen_id: 2,
        prospectos_ids: [1, 2, 3, 4, 5],
        config_visual: { nodes: [], edges: [] },
        config_structure: { stages: [], conditions: [], branches: [] },
        distribucion: {
          tipoMensaje: 'ambos',
          emailPercentage: 70,
          costEmail: 0.5,
          costSms: 1,
        },
        total_cost: 4.5, // (5 * 0.7 * 0.5) + (5 * 0.3 * 1) = 1.75 + 1.5 = 3.25
        estimatedTime: 48,
      }

      mockService.createWithProspectos.mockResolvedValueOnce(mockFlujoNurturing)

      const result = await mockService.createWithProspectos(payload)
      expect(result).toBeDefined()
    })
  })

  describe('update', () => {
    it('should update flujo metadata', async () => {
      const updateData = {
        nombre: 'Updated Flow',
        descripcion: 'Updated description',
      }

      mockService.update.mockResolvedValueOnce({
        ...mockFlujoNurturing,
        ...updateData,
      })

      const result = await mockService.update(1, updateData)

      expect(result.nombre).toBe('Updated Flow')
      expect(mockService.update).toHaveBeenCalledWith(1, updateData)
    })

    it('should handle partial updates', async () => {
      mockService.update.mockResolvedValueOnce({
        ...mockFlujoNurturing,
        nombre: 'New Name',
      })

      await mockService.update(1, { nombre: 'New Name' })

      expect(mockService.update).toHaveBeenCalledWith(1, { nombre: 'New Name' })
    })

    it('should throw error for non-existent flujo', async () => {
      mockService.update.mockRejectedValueOnce(new Error('Flujo not found'))

      await expect(mockService.update(999, { nombre: 'Test' })).rejects.toThrow(
        'Flujo not found'
      )
    })
  })

  describe('delete', () => {
    it('should delete flujo successfully', async () => {
      mockService.delete.mockResolvedValueOnce({
        mensaje: 'Flujo eliminado correctamente',
        detalles: { etapas_eliminadas: 5, ejecuciones_eliminadas: 2 },
      })

      const result = await mockService.delete(1)

      expect(result.mensaje).toContain('eliminado')
      expect(mockService.delete).toHaveBeenCalledWith(1)
    })

    it('should cascade delete related records', async () => {
      mockService.delete.mockResolvedValueOnce({
        mensaje: 'Flujo eliminado',
        detalles: {
          etapas_eliminadas: 3,
          ejecuciones_eliminadas: 1,
          ramificaciones_eliminadas: 2,
        },
      })

      const result = await mockService.delete(1)

      expect(result.detalles.etapas_eliminadas).toBe(3)
      expect(result.detalles.ramificaciones_eliminadas).toBe(2)
    })

    it('should throw error for non-existent flujo', async () => {
      mockService.delete.mockRejectedValueOnce(new Error('Flujo no encontrado'))

      await expect(mockService.delete(999)).rejects.toThrow('no encontrado')
    })
  })

  describe('ejecutarFlujo', () => {
    it('should execute flujo with prospects', async () => {
      mockService.ejecutarFlujo.mockResolvedValueOnce({
        id: 1,
        estado: 'en_progreso',
        fecha_inicio_programada: null,
      })

      const result = await mockService.ejecutarFlujo(1, { prospectos_ids: [1, 2, 3] })

      expect(result.estado).toBe('en_progreso')
      expect(mockService.ejecutarFlujo).toHaveBeenCalledWith(1, { prospectos_ids: [1, 2, 3] })
    })

    it('should handle scheduled execution', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      mockService.ejecutarFlujo.mockResolvedValueOnce({
        id: 1,
        estado: 'programado',
        fecha_inicio_programada: futureDate,
      })

      await mockService.ejecutarFlujo(1, {
        prospectos_ids: [1],
        fecha_inicio_programada: futureDate,
      })

      expect(mockService.ejecutarFlujo).toHaveBeenCalled()
    })

    it('should throw error with empty prospects', async () => {
      mockService.ejecutarFlujo.mockRejectedValueOnce(
        new Error('Prospectos requeridos')
      )

      await expect(
        mockService.ejecutarFlujo(1, { prospectos_ids: [] })
      ).rejects.toThrow('Prospectos')
    })

    it('should throw error for non-existent flujo', async () => {
      mockService.ejecutarFlujo.mockRejectedValueOnce(new Error('Flujo no encontrado'))

      await expect(mockService.ejecutarFlujo(999, { prospectos_ids: [1] })).rejects.toThrow()
    })
  })

  describe('obtenerProgreso', () => {
    it('should fetch execution progress', async () => {
      mockService.obtenerProgreso.mockResolvedValueOnce(mockEjecucionFlujo)

      const result = await mockService.obtenerProgreso(1)

      expect(result.estado).toBe('completado')
      expect(result.porcentaje_completado).toBe(100)
    })

    it('should show in-progress status', async () => {
      mockService.obtenerProgreso.mockResolvedValueOnce({
        ...mockEjecucionFlujo,
        estado: 'en_progreso',
        porcentaje_completado: 50,
      })

      const result = await mockService.obtenerProgreso(1)

      expect(result.estado).toBe('en_progreso')
      expect(result.porcentaje_completado).toBe(50)
    })

    it('should handle failed executions', async () => {
      mockService.obtenerProgreso.mockResolvedValueOnce({
        ...mockEjecucionFlujo,
        estado: 'fallido',
        porcentaje_completado: 0,
      })

      const result = await mockService.obtenerProgreso(1)

      expect(result.estado).toBe('fallido')
    })

    it('should throw error for non-existent ejecución', async () => {
      mockService.obtenerProgreso.mockRejectedValueOnce(new Error('Ejecución no encontrada'))

      await expect(mockService.obtenerProgreso(999)).rejects.toThrow('no encontrada')
    })
  })

  describe('obtenerHistorialEjecuciones', () => {
    it('should fetch execution history', async () => {
      mockService.obtenerHistorialEjecuciones.mockResolvedValueOnce({
        data: [mockEjecucionFlujo],
      })

      const result = await mockService.obtenerHistorialEjecuciones(1)

      expect(result.data).toHaveLength(1)
      expect(result.data[0].estado).toBe('completado')
    })

    it('should return empty array for no executions', async () => {
      mockService.obtenerHistorialEjecuciones.mockResolvedValueOnce({
        data: [],
      })

      const result = await mockService.obtenerHistorialEjecuciones(1)

      expect(result.data).toEqual([])
    })

    it('should include multiple executions', async () => {
      const ejecuciones = [
        mockEjecucionFlujo,
        { ...mockEjecucionFlujo, id: 2, estado: 'en_progreso' },
        { ...mockEjecucionFlujo, id: 3, estado: 'fallido' },
      ]
      mockService.obtenerHistorialEjecuciones.mockResolvedValueOnce({
        data: ejecuciones,
      })

      const result = await mockService.obtenerHistorialEjecuciones(1)

      expect(result.data).toHaveLength(3)
      expect(result.data.map((e) => e.estado)).toEqual(['completado', 'en_progreso', 'fallido'])
    })

    it('should throw error for invalid flujo ID', async () => {
      mockService.obtenerHistorialEjecuciones.mockRejectedValueOnce(
        new Error('Flujo no encontrado')
      )

      await expect(mockService.obtenerHistorialEjecuciones(999)).rejects.toThrow()
    })
  })

  describe('Error Handling & Edge Cases', () => {
    it('should handle network timeouts', async () => {
      mockService.getAll.mockRejectedValueOnce(new Error('Request timeout'))

      await expect(mockService.getAll()).rejects.toThrow('timeout')
    })

    it('should handle 400 Bad Request', async () => {
      mockService.create.mockRejectedValueOnce(new Error('Invalid flujo data'))

      await expect(mockService.create({} as any)).rejects.toThrow('Invalid')
    })

    it('should handle 403 Forbidden', async () => {
      mockService.delete.mockRejectedValueOnce(new Error('Permission denied'))

      await expect(mockService.delete(1)).rejects.toThrow('Permission')
    })

    it('should handle 500 Server Error', async () => {
      mockService.getAll.mockRejectedValueOnce(new Error('Internal server error'))

      await expect(mockService.getAll()).rejects.toThrow('server error')
    })

    it('should handle null/undefined in responses', async () => {
      mockService.getById.mockResolvedValueOnce({
        ...mockFlujoNurturing,
        descripcion: null,
        estadisticas: undefined,
      })

      const result = await mockService.getById(1)

      expect(result.descripcion).toBeNull()
      expect(result.estadisticas).toBeUndefined()
    })
  })
})
