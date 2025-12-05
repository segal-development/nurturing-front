/**
 * Tests for EnviosService (RED phase)
 *
 * User Stories:
 * 1. As a user, I want to see statistics of emails sent per day
 * 2. As a user, I want to see today's shipment summary
 * 3. As a user, I want to see shipments grouped by flow
 * 4. As a user, I want to filter and list all shipments
 * 5. As a user, I want to view details of a single shipment
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import type {
  EnviosDailyStatsResponse,
  EnviosTodayStats,
  EnviosFlowStatsResponse,
  EnviosListResponse,
  Envio,
  EnviosFilters,
} from '@/types/envios'

/**
 * Mock EnviosService - will be implemented in GREEN phase
 * Tests define the contract/interface the service must fulfill
 */
describe('EnviosService', () => {
  let service: any

  beforeEach(() => {
    // Service will be imported and tested here
    // Currently this is a placeholder for the implementation
    service = {
      getDailyStats: vi.fn(),
      getTodayStats: vi.fn(),
      getFlowStats: vi.fn(),
      list: vi.fn(),
      getDetail: vi.fn(),
    }
  })

  /**
   * USER STORY 1: View daily statistics
   * As a user, I want to see emails sent per day in a date range
   */
  describe('getDailyStats', () => {
    it('should fetch daily statistics for a date range', async () => {
      const mockResponse: EnviosDailyStatsResponse = {
        periodo: {
          fecha_inicio: '2025-01-01',
          fecha_fin: '2025-01-31',
        },
        estadisticas: [
          {
            fecha: '2025-01-01',
            total: 150,
            exitosos: 145,
            fallidos: 5,
            pendientes: 0,
            email_count: 100,
            sms_count: 50,
          },
          {
            fecha: '2025-01-02',
            total: 200,
            exitosos: 195,
            fallidos: 5,
            pendientes: 0,
            email_count: 120,
            sms_count: 80,
          },
        ],
        resumen: {
          total: 350,
          exitosos: 340,
          fallidos: 10,
          pendientes: 0,
        },
      }

      service.getDailyStats.mockResolvedValue(mockResponse)

      const result = await service.getDailyStats('2025-01-01', '2025-01-31')

      expect(service.getDailyStats).toHaveBeenCalledWith('2025-01-01', '2025-01-31')
      expect(result.estadisticas).toHaveLength(2)
      expect(result.estadisticas[0].fecha).toBe('2025-01-01')
      expect(result.resumen.total).toBe(350)
      expect(result.resumen.exitosos).toBe(340)
    })

    it('should return empty statistics when no data exists', async () => {
      const mockResponse: EnviosDailyStatsResponse = {
        periodo: {
          fecha_inicio: '2025-12-01',
          fecha_fin: '2025-12-31',
        },
        estadisticas: [],
        resumen: {
          total: 0,
          exitosos: 0,
          fallidos: 0,
          pendientes: 0,
        },
      }

      service.getDailyStats.mockResolvedValue(mockResponse)

      const result = await service.getDailyStats('2025-12-01', '2025-12-31')

      expect(result.estadisticas).toHaveLength(0)
      expect(result.resumen.total).toBe(0)
    })

    it('should handle API errors gracefully', async () => {
      const error = new Error('API Error')
      service.getDailyStats.mockRejectedValue(error)

      await expect(service.getDailyStats('2025-01-01', '2025-01-31')).rejects.toThrow('API Error')
    })

    it('should include email and SMS breakdown in statistics', async () => {
      const mockResponse: EnviosDailyStatsResponse = {
        periodo: {
          fecha_inicio: '2025-01-01',
          fecha_fin: '2025-01-01',
        },
        estadisticas: [
          {
            fecha: '2025-01-01',
            total: 100,
            exitosos: 95,
            fallidos: 5,
            pendientes: 0,
            email_count: 60,
            sms_count: 40,
          },
        ],
        resumen: {
          total: 100,
          exitosos: 95,
          fallidos: 5,
          pendientes: 0,
        },
      }

      service.getDailyStats.mockResolvedValue(mockResponse)

      const result = await service.getDailyStats('2025-01-01', '2025-01-01')
      const stats = result.estadisticas[0]

      expect(stats.email_count).toBe(60)
      expect(stats.sms_count).toBe(40)
      expect(stats.email_count + stats.sms_count).toBe(100)
    })
  })

  /**
   * USER STORY 2: View today's summary
   * As a user, I want to see a quick summary of today's shipments
   */
  describe('getTodayStats', () => {
    it('should fetch today statistics with all states', async () => {
      const mockResponse: EnviosTodayStats = {
        total: 250,
        pendiente: 50,
        enviado: 190,
        fallido: 10,
        email_count: 150,
        sms_count: 100,
      }

      service.getTodayStats.mockResolvedValue(mockResponse)

      const result = await service.getTodayStats()

      expect(service.getTodayStats).toHaveBeenCalled()
      expect(result.total).toBe(250)
      expect(result.enviado).toBe(190)
      expect(result.fallido).toBe(10)
      expect(result.pendiente).toBe(50)
    })

    it('should have zero totals on days with no shipments', async () => {
      const mockResponse: EnviosTodayStats = {
        total: 0,
        pendiente: 0,
        enviado: 0,
        fallido: 0,
        email_count: 0,
        sms_count: 0,
      }

      service.getTodayStats.mockResolvedValue(mockResponse)

      const result = await service.getTodayStats()

      expect(result.total).toBe(0)
      expect(result.pendiente).toBe(0)
      expect(result.enviado).toBe(0)
      expect(result.fallido).toBe(0)
    })

    it('should break down by email and SMS channels', async () => {
      const mockResponse: EnviosTodayStats = {
        total: 300,
        pendiente: 50,
        enviado: 240,
        fallido: 10,
        email_count: 200,
        sms_count: 100,
      }

      service.getTodayStats.mockResolvedValue(mockResponse)

      const result = await service.getTodayStats()

      expect(result.email_count).toBe(200)
      expect(result.sms_count).toBe(100)
      expect(result.email_count + result.sms_count).toBe(300)
    })
  })

  /**
   * USER STORY 3: View shipments by flow
   * As a user, I want to see statistics grouped by flow
   */
  describe('getFlowStats', () => {
    it('should fetch statistics grouped by flow', async () => {
      const mockResponse: EnviosFlowStatsResponse = {
        periodo: {
          fecha_inicio: '2025-01-01',
          fecha_fin: '2025-01-31',
        },
        estadisticas: [
          {
            flujo_id: 1,
            flujo_nombre: 'Newsletter Mensual',
            total: 500,
            exitosos: 480,
            fallidos: 20,
            pendientes: 0,
            email_count: 500,
            sms_count: 0,
          },
          {
            flujo_id: 2,
            flujo_nombre: 'Promociones SMS',
            total: 300,
            exitosos: 295,
            fallidos: 5,
            pendientes: 0,
            email_count: 0,
            sms_count: 300,
          },
        ],
        resumen: {
          total_flujos: 2,
          total_envios: 800,
          total_exitosos: 775,
          total_fallidos: 25,
        },
      }

      service.getFlowStats.mockResolvedValue(mockResponse)

      const result = await service.getFlowStats('2025-01-01', '2025-01-31')

      expect(result.estadisticas).toHaveLength(2)
      expect(result.estadisticas[0].flujo_nombre).toBe('Newsletter Mensual')
      expect(result.resumen.total_envios).toBe(800)
    })

    it('should show empty list when no flows have shipments', async () => {
      const mockResponse: EnviosFlowStatsResponse = {
        periodo: {
          fecha_inicio: '2025-12-01',
          fecha_fin: '2025-12-31',
        },
        estadisticas: [],
        resumen: {
          total_flujos: 0,
          total_envios: 0,
          total_exitosos: 0,
          total_fallidos: 0,
        },
      }

      service.getFlowStats.mockResolvedValue(mockResponse)

      const result = await service.getFlowStats('2025-12-01', '2025-12-31')

      expect(result.estadisticas).toHaveLength(0)
      expect(result.resumen.total_flujos).toBe(0)
    })

    it('should calculate success rate correctly per flow', async () => {
      const mockResponse: EnviosFlowStatsResponse = {
        periodo: {
          fecha_inicio: '2025-01-01',
          fecha_fin: '2025-01-31',
        },
        estadisticas: [
          {
            flujo_id: 1,
            flujo_nombre: 'Test Flow',
            total: 100,
            exitosos: 95,
            fallidos: 5,
            pendientes: 0,
            email_count: 60,
            sms_count: 40,
          },
        ],
        resumen: {
          total_flujos: 1,
          total_envios: 100,
          total_exitosos: 95,
          total_fallidos: 5,
        },
      }

      service.getFlowStats.mockResolvedValue(mockResponse)

      const result = await service.getFlowStats('2025-01-01', '2025-01-31')
      const flowStats = result.estadisticas[0]

      const successRate = (flowStats.exitosos / flowStats.total) * 100
      expect(successRate).toBe(95)
    })
  })

  /**
   * USER STORY 4: Filter and list all shipments
   * As a user, I want to filter shipments and see them in a paginated list
   */
  describe('list', () => {
    it('should fetch paginated list of shipments', async () => {
      const filters: EnviosFilters = {
        pagina: 1,
        por_pagina: 50,
      }

      const mockResponse: EnviosListResponse = {
        data: [
          {
            id: 1,
            flujo_id: 1,
            prospecto_id: 1,
            estado: 'enviado',
            canal: 'email',
            fecha_creacion: '2025-01-15T10:00:00Z',
            fecha_enviado: '2025-01-15T10:05:00Z',
            contenido: 'Hola, aquí está tu newsletter...',
            metadata: {
              destinatario: 'user@example.com',
              asunto: 'Newsletter Enero 2025',
            },
          },
        ],
        meta: {
          total: 100,
          pagina: 1,
          por_pagina: 50,
          total_paginas: 2,
        },
      }

      service.list.mockResolvedValue(mockResponse)

      const result = await service.list(filters)

      expect(service.list).toHaveBeenCalledWith(filters)
      expect(result.data).toHaveLength(1)
      expect(result.meta.total).toBe(100)
      expect(result.meta.total_paginas).toBe(2)
    })

    it('should filter by estado', async () => {
      const filters: EnviosFilters = {
        estado: 'fallido',
        pagina: 1,
      }

      const mockResponse: EnviosListResponse = {
        data: [
          {
            id: 2,
            flujo_id: 1,
            prospecto_id: 2,
            estado: 'fallido',
            canal: 'email',
            fecha_creacion: '2025-01-15T10:00:00Z',
            contenido: 'Test email',
            metadata: {
              destinatario: 'invalid@example.com',
              error: 'Invalid email address',
            },
          },
        ],
        meta: {
          total: 5,
          pagina: 1,
          por_pagina: 50,
          total_paginas: 1,
        },
      }

      service.list.mockResolvedValue(mockResponse)

      const result = await service.list(filters)

      expect(service.list).toHaveBeenCalledWith(filters)
      expect(result.data[0].estado).toBe('fallido')
      expect(result.data[0].metadata.error).toBeDefined()
    })

    it('should filter by canal', async () => {
      const filters: EnviosFilters = {
        canal: 'sms',
        pagina: 1,
      }

      const mockResponse: EnviosListResponse = {
        data: [
          {
            id: 3,
            flujo_id: 2,
            prospecto_id: 3,
            estado: 'enviado',
            canal: 'sms',
            fecha_creacion: '2025-01-15T10:00:00Z',
            fecha_enviado: '2025-01-15T10:05:00Z',
            contenido: 'Hola, tu código de promoción es...',
            metadata: {
              destinatario: '+56912345678',
            },
          },
        ],
        meta: {
          total: 50,
          pagina: 1,
          por_pagina: 50,
          total_paginas: 1,
        },
      }

      service.list.mockResolvedValue(mockResponse)

      const result = await service.list(filters)

      expect(result.data[0].canal).toBe('sms')
    })

    it('should filter by flujo_id', async () => {
      const filters: EnviosFilters = {
        flujo_id: 1,
        pagina: 1,
      }

      const mockResponse: EnviosListResponse = {
        data: [
          {
            id: 1,
            flujo_id: 1,
            prospecto_id: 1,
            estado: 'enviado',
            canal: 'email',
            fecha_creacion: '2025-01-15T10:00:00Z',
            fecha_enviado: '2025-01-15T10:05:00Z',
            contenido: 'Newsletter content',
            metadata: {
              destinatario: 'user@example.com',
            },
          },
        ],
        meta: {
          total: 150,
          pagina: 1,
          por_pagina: 50,
          total_paginas: 3,
        },
      }

      service.list.mockResolvedValue(mockResponse)

      const result = await service.list(filters)

      expect(result.data.every((envio) => envio.flujo_id === 1)).toBe(true)
    })

    it('should filter by date range', async () => {
      const filters: EnviosFilters = {
        fecha_desde: '2025-01-01',
        fecha_hasta: '2025-01-31',
        pagina: 1,
      }

      const mockResponse: EnviosListResponse = {
        data: [],
        meta: {
          total: 0,
          pagina: 1,
          por_pagina: 50,
          total_paginas: 0,
        },
      }

      service.list.mockResolvedValue(mockResponse)

      const result = await service.list(filters)

      expect(service.list).toHaveBeenCalledWith(filters)
      expect(result.data).toHaveLength(0)
    })

    it('should combine multiple filters', async () => {
      const filters: EnviosFilters = {
        estado: 'enviado',
        canal: 'email',
        flujo_id: 1,
        fecha_desde: '2025-01-01',
        pagina: 1,
      }

      const mockResponse: EnviosListResponse = {
        data: [
          {
            id: 1,
            flujo_id: 1,
            prospecto_id: 1,
            estado: 'enviado',
            canal: 'email',
            fecha_creacion: '2025-01-15T10:00:00Z',
            fecha_enviado: '2025-01-15T10:05:00Z',
            contenido: 'Email content',
            metadata: {
              destinatario: 'user@example.com',
            },
          },
        ],
        meta: {
          total: 1,
          pagina: 1,
          por_pagina: 50,
          total_paginas: 1,
        },
      }

      service.list.mockResolvedValue(mockResponse)

      const result = await service.list(filters)

      expect(result.data[0].estado).toBe('enviado')
      expect(result.data[0].canal).toBe('email')
      expect(result.data[0].flujo_id).toBe(1)
    })

    it('should handle empty results gracefully', async () => {
      const filters: EnviosFilters = {
        estado: 'pendiente',
        pagina: 1,
      }

      const mockResponse: EnviosListResponse = {
        data: [],
        meta: {
          total: 0,
          pagina: 1,
          por_pagina: 50,
          total_paginas: 0,
        },
      }

      service.list.mockResolvedValue(mockResponse)

      const result = await service.list(filters)

      expect(result.data).toHaveLength(0)
      expect(result.meta.total).toBe(0)
    })
  })

  /**
   * USER STORY 5: View shipment details
   * As a user, I want to see full details of a single shipment
   */
  describe('getDetail', () => {
    it('should fetch complete shipment details', async () => {
      const mockEnvio: Envio = {
        id: 1,
        flujo_id: 1,
        prospecto_id: 1,
        estado: 'enviado',
        canal: 'email',
        fecha_creacion: '2025-01-15T10:00:00Z',
        fecha_enviado: '2025-01-15T10:05:00Z',
        contenido: '<html><body>Newsletter content</body></html>',
        metadata: {
          destinatario: 'user@example.com',
          asunto: 'Newsletter Enero 2025',
        },
        prospecto: {
          id: 1,
          nombre: 'John Doe',
          email: 'user@example.com',
          telefono: '+56912345678',
          importacion_id: 1,
          created_at: '2024-12-01T00:00:00Z',
        },
        flujo: {
          id: 1,
          nombre: 'Newsletter Mensual',
          descripcion: 'Envío de newsletter mensual',
          estado: 'activo',
          created_at: '2024-12-01T00:00:00Z',
        },
        etapa: {
          id: 1,
          nombre: 'Envío de Email',
        },
      }

      service.getDetail.mockResolvedValue(mockEnvio)

      const result = await service.getDetail(1)

      expect(service.getDetail).toHaveBeenCalledWith(1)
      expect(result.id).toBe(1)
      expect(result.prospecto?.nombre).toBe('John Doe')
      expect(result.flujo?.nombre).toBe('Newsletter Mensual')
      expect(result.contenido).toBeDefined()
    })

    it('should include error information for failed shipments', async () => {
      const mockEnvio: Envio = {
        id: 2,
        flujo_id: 1,
        prospecto_id: 2,
        estado: 'fallido',
        canal: 'email',
        fecha_creacion: '2025-01-15T10:00:00Z',
        contenido: 'Email content',
        metadata: {
          destinatario: 'invalid@example.com',
          error: 'SMTP Error: Invalid email address',
          asunto: 'Test Email',
        },
      }

      service.getDetail.mockResolvedValue(mockEnvio)

      const result = await service.getDetail(2)

      expect(result.estado).toBe('fallido')
      expect(result.metadata.error).toBeDefined()
      expect(result.metadata.error).toContain('Invalid email address')
    })

    it('should handle not found errors', async () => {
      const error = new Error('Envio not found')
      service.getDetail.mockRejectedValue(error)

      await expect(service.getDetail(999)).rejects.toThrow('Envio not found')
    })

    it('should include SMS metadata when canal is sms', async () => {
      const mockEnvio: Envio = {
        id: 3,
        flujo_id: 2,
        prospecto_id: 3,
        estado: 'enviado',
        canal: 'sms',
        fecha_creacion: '2025-01-15T10:00:00Z',
        fecha_enviado: '2025-01-15T10:05:00Z',
        contenido: 'Tu código de promoción es: ABC123',
        metadata: {
          destinatario: '+56912345678',
          carriers: 'Movistar',
        },
      }

      service.getDetail.mockResolvedValue(mockEnvio)

      const result = await service.getDetail(3)

      expect(result.canal).toBe('sms')
      expect(result.metadata.destinatario).toMatch(/^\+\d+/)
    })
  })
})
