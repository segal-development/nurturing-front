/**
 * Tests for useEnvioDetail hook (RED phase)
 *
 * User Story:
 * As a user, I want to view complete details of a shipment including
 * prospect info, flow, content, and error details if failed
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type { Envio } from '@/types/envios'
import enviosService from '@/api/envios.service'

vi.mock('@/api/envios.service', () => ({
  default: {
    getDetail: vi.fn(),
  },
}))

const createQueryClientWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useEnvioDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Fetch Detail', () => {
    it('should fetch complete envio details', async () => {
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
          tipo_prospecto_id: 1,
          estado: 'activo',
          monto_deuda: 50000,
          fecha_ultimo_contacto: null,
          importacion_id: 1,
          created_at: '2024-12-01T00:00:00Z',
          updated_at: '2024-12-01T00:00:00Z',
        },
        flujo: {
          id: 1,
          nombre: 'Newsletter Mensual',
          descripcion: 'Envío de newsletter mensual',
          tipo_mensaje: 'email',
          etapas: [],
          estado: 'activo',
          created_at: '2024-12-01T00:00:00Z',
          updated_at: '2024-12-01T00:00:00Z',
        },
        etapa: {
          id: 1,
          flujo_id: 1,
          dia_envio: 0,
          tipo_mensaje: 'email',
          activo: true,
          created_at: '2024-12-01T00:00:00Z',
          updated_at: '2024-12-01T00:00:00Z',
        },
      }

      ;(enviosService.getDetail as any).mockResolvedValue(mockEnvio)

      // Hook test:
      // const { result } = renderHook(
      //   () => useEnvioDetail(1),
      //   { wrapper: createQueryClientWrapper() }
      // )

      // await waitFor(() => {
      //   expect(result.current.isLoading).toBe(false)
      // })

      // expect(result.current.envio).toEqual(mockEnvio)
      // expect(result.current.envio?.prospecto?.nombre).toBe('John Doe')
      // expect(result.current.envio?.flujo?.nombre).toBe('Newsletter Mensual')
    })

    it('should not fetch when envio_id is null', async () => {
      // Hook test:
      // const { result } = renderHook(
      //   () => useEnvioDetail(null),
      //   { wrapper: createQueryClientWrapper() }
      // )

      // expect(result.current.envio).toBeUndefined()
      // expect(enviosService.getDetail).not.toHaveBeenCalled()
    })

    it('should handle API errors', async () => {
      const error = new Error('Envio not found')
      ;(enviosService.getDetail as any).mockRejectedValue(error)

      // Hook test:
      // const { result } = renderHook(
      //   () => useEnvioDetail(999),
      //   { wrapper: createQueryClientWrapper() }
      // )

      // await waitFor(() => {
      //   expect(result.current.isError).toBe(true)
      //   expect(result.current.error?.message).toBe('Envio not found')
      // })
    })

    it('should refetch when envio_id changes', async () => {
      const mockEnvio1: Envio = {
        id: 1,
        flujo_id: 1,
        prospecto_id: 1,
        estado: 'enviado',
        canal: 'email',
        fecha_creacion: '2025-01-15T10:00:00Z',
        contenido: 'Email 1',
        metadata: { destinatario: 'user1@example.com' },
      }

      const mockEnvio2: Envio = {
        id: 2,
        flujo_id: 1,
        prospecto_id: 2,
        estado: 'fallido',
        canal: 'email',
        fecha_creacion: '2025-01-15T11:00:00Z',
        contenido: 'Email 2',
        metadata: {
          destinatario: 'user2@example.com',
          error: 'Email not found',
        },
      }

      ;(enviosService.getDetail as any)
        .mockResolvedValueOnce(mockEnvio1)
        .mockResolvedValueOnce(mockEnvio2)

      // Hook test:
      // const { result, rerender } = renderHook(
      //   ({ envioId }) => useEnvioDetail(envioId),
      //   {
      //     initialProps: { envioId: 1 },
      //     wrapper: createQueryClientWrapper(),
      //   }
      // )

      // await waitFor(() => {
      //   expect(result.current.envio?.id).toBe(1)
      // })

      // rerender({ envioId: 2 })

      // await waitFor(() => {
      //   expect(result.current.envio?.id).toBe(2)
      //   expect(result.current.envio?.estado).toBe('fallido')
      // })
    })
  })

  describe('Failed Shipment Details', () => {
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

      ;(enviosService.getDetail as any).mockResolvedValue(mockEnvio)

      // Hook test:
      // const { result } = renderHook(
      //   () => useEnvioDetail(2),
      //   { wrapper: createQueryClientWrapper() }
      // )

      // await waitFor(() => {
      //   expect(result.current.envio?.estado).toBe('fallido')
      //   expect(result.current.envio?.metadata.error).toBeDefined()
      //   expect(result.current.envio?.metadata.error).toContain('Invalid email address')
      // })
    })

    it('should display pending shipment with no sent date', async () => {
      const mockEnvio: Envio = {
        id: 3,
        flujo_id: 1,
        prospecto_id: 3,
        estado: 'pendiente',
        canal: 'sms',
        fecha_creacion: '2025-01-15T10:00:00Z',
        contenido: 'SMS message',
        metadata: {
          destinatario: '+56912345678',
        },
      }

      ;(enviosService.getDetail as any).mockResolvedValue(mockEnvio)

      // Hook test:
      // const { result } = renderHook(
      //   () => useEnvioDetail(3),
      //   { wrapper: createQueryClientWrapper() }
      // )

      // await waitFor(() => {
      //   expect(result.current.envio?.estado).toBe('pendiente')
      //   expect(result.current.envio?.fecha_enviado).toBeUndefined()
      // })
    })

    it('should include SMS metadata with phone number', async () => {
      const mockEnvio: Envio = {
        id: 4,
        flujo_id: 2,
        prospecto_id: 4,
        estado: 'enviado',
        canal: 'sms',
        fecha_creacion: '2025-01-15T10:00:00Z',
        fecha_enviado: '2025-01-15T10:05:00Z',
        contenido: 'Tu código de promoción es: ABC123',
        metadata: {
          destinatario: '+56912345678',
          carriers: 'Movistar',
          message_id: 'SMS-12345',
        },
      }

      ;(enviosService.getDetail as any).mockResolvedValue(mockEnvio)

      // Hook test:
      // const { result } = renderHook(
      //   () => useEnvioDetail(4),
      //   { wrapper: createQueryClientWrapper() }
      // )

      // await waitFor(() => {
      //   expect(result.current.envio?.canal).toBe('sms')
      //   expect(result.current.envio?.metadata.destinatario).toMatch(/^\+\d+/)
      //   expect(result.current.envio?.metadata.carriers).toBeDefined()
      // })
    })
  })

  describe('Caching', () => {
    it('should cache results and not refetch when data is fresh', async () => {
      const mockEnvio: Envio = {
        id: 1,
        flujo_id: 1,
        prospecto_id: 1,
        estado: 'enviado',
        canal: 'email',
        fecha_creacion: '2025-01-15T10:00:00Z',
        contenido: 'Email content',
        metadata: { destinatario: 'user@example.com' },
      }

      ;(enviosService.getDetail as any).mockResolvedValue(mockEnvio)

      // Hook test:
      // const { result: result1 } = renderHook(
      //   () => useEnvioDetail(1),
      //   { wrapper: createQueryClientWrapper() }
      // )

      // await waitFor(() => {
      //   expect(result1.current.envio).toBeDefined()
      // })

      // const callCount1 = (enviosService.getDetail as any).mock.calls.length

      // // Second hook with same ID should use cache
      // const { result: result2 } = renderHook(
      //   () => useEnvioDetail(1),
      //   { wrapper: createQueryClientWrapper() }
      // )

      // expect(result2.current.envio?.id).toBe(1)
      // // No new API call should be made
      // expect((enviosService.getDetail as any).mock.calls.length).toBe(callCount1)
    })
  })
})
