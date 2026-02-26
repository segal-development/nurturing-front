/**
 * Tests for useFlujoAnalytics hook
 *
 * Tests the hook that fetches comprehensive flujo analytics
 * including funnel metrics, conversion rates, costs, and per-stage breakdown.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useFlujoAnalytics } from '@/features/flujos/hooks/useFlujoAnalytics'
import { flujosService, type FlujoAnalytics } from '@/api/flujos.service'

vi.mock('@/api/flujos.service', () => ({
  flujosService: {
    getAnalytics: vi.fn(),
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

const mockAnalytics: FlujoAnalytics = {
  resumen: {
    tasa_apertura: 45.2,
    tasa_click: 12.5,
    tasa_fallo: 2.1,
    costo_total: 150.50,
    costo_por_conversion: 25.08,
    emails_enviados: 500,
    sms_enviados: 100,
  },
  funnel: {
    prospectos: 100,
    enviados: 600,
    abiertos: 271,
    clickeados: 75,
    conversiones: 6,
    tasa_apertura: 45.2,
    tasa_click_sobre_abiertos: 27.7,
    tasa_conversion: 6.0,
  },
  etapas: [
    {
      node_id: 'stage-1',
      label: 'Email Bienvenida',
      tipo_mensaje: 'email',
      orden: 1,
      enviados: 300,
      fallidos: 5,
      abiertos: 150,
      clickeados: 40,
      tasa_apertura: 50.0,
      tasa_click: 13.3,
    },
    {
      node_id: 'stage-2',
      label: 'SMS Recordatorio',
      tipo_mensaje: 'sms',
      orden: 2,
      enviados: 100,
      fallidos: 2,
      abiertos: null,
      clickeados: null,
      tasa_apertura: null,
      tasa_click: null,
    },
  ],
  totales: {
    envios: {
      total: 600,
      enviados: 587,
      fallidos: 13,
      pendientes: 0,
      abiertos: 271,
      clickeados: 75,
    },
    prospectos: {
      total: 100,
      completados: 6,
      en_proceso: 80,
      pendientes: 10,
      cancelados: 4,
    },
  },
}

describe('useFlujoAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Fetch Analytics', () => {
    it('should fetch analytics successfully', async () => {
      vi.mocked(flujosService.getAnalytics).mockResolvedValue(mockAnalytics)

      const { result } = renderHook(
        () => useFlujoAnalytics(1),
        { wrapper: createQueryClientWrapper() }
      )

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual(mockAnalytics)
      expect(result.current.error).toBeNull()
      expect(flujosService.getAnalytics).toHaveBeenCalledWith(1)
    })

    it('should not fetch when flujoId is undefined', async () => {
      const { result } = renderHook(
        () => useFlujoAnalytics(undefined),
        { wrapper: createQueryClientWrapper() }
      )

      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
      expect(flujosService.getAnalytics).not.toHaveBeenCalled()
    })

    it('should not fetch when enabled is false', async () => {
      const { result } = renderHook(
        () => useFlujoAnalytics(1, false),
        { wrapper: createQueryClientWrapper() }
      )

      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
      expect(flujosService.getAnalytics).not.toHaveBeenCalled()
    })

    it('should handle API errors', async () => {
      const error = new Error('Network error')
      vi.mocked(flujosService.getAnalytics).mockRejectedValue(error)

      const { result } = renderHook(
        () => useFlujoAnalytics(1),
        { wrapper: createQueryClientWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeDefined()
      expect(result.current.data).toBeUndefined()
    })

    it('should refetch when flujoId changes', async () => {
      const analytics1 = { ...mockAnalytics, resumen: { ...mockAnalytics.resumen, tasa_apertura: 50 } }
      const analytics2 = { ...mockAnalytics, resumen: { ...mockAnalytics.resumen, tasa_apertura: 60 } }

      vi.mocked(flujosService.getAnalytics)
        .mockResolvedValueOnce(analytics1)
        .mockResolvedValueOnce(analytics2)

      const { result, rerender } = renderHook(
        ({ flujoId }) => useFlujoAnalytics(flujoId),
        {
          initialProps: { flujoId: 1 as number | undefined },
          wrapper: createQueryClientWrapper(),
        }
      )

      await waitFor(() => {
        expect(result.current.data?.resumen.tasa_apertura).toBe(50)
      })

      rerender({ flujoId: 2 })

      await waitFor(() => {
        expect(result.current.data?.resumen.tasa_apertura).toBe(60)
      })

      expect(flujosService.getAnalytics).toHaveBeenCalledTimes(2)
    })
  })

  describe('Analytics Data Structure', () => {
    it('should return complete resumen metrics', async () => {
      vi.mocked(flujosService.getAnalytics).mockResolvedValue(mockAnalytics)

      const { result } = renderHook(
        () => useFlujoAnalytics(1),
        { wrapper: createQueryClientWrapper() }
      )

      await waitFor(() => {
        expect(result.current.data).toBeDefined()
      })

      const { resumen } = result.current.data!
      expect(resumen.tasa_apertura).toBe(45.2)
      expect(resumen.tasa_click).toBe(12.5)
      expect(resumen.tasa_fallo).toBe(2.1)
      expect(resumen.costo_total).toBe(150.50)
      expect(resumen.costo_por_conversion).toBe(25.08)
      expect(resumen.emails_enviados).toBe(500)
      expect(resumen.sms_enviados).toBe(100)
    })

    it('should return funnel data without tasa_envio', async () => {
      vi.mocked(flujosService.getAnalytics).mockResolvedValue(mockAnalytics)

      const { result } = renderHook(
        () => useFlujoAnalytics(1),
        { wrapper: createQueryClientWrapper() }
      )

      await waitFor(() => {
        expect(result.current.data).toBeDefined()
      })

      const { funnel } = result.current.data!
      expect(funnel.prospectos).toBe(100)
      expect(funnel.enviados).toBe(600)
      expect(funnel.abiertos).toBe(271)
      expect(funnel.clickeados).toBe(75)
      expect(funnel.conversiones).toBe(6)
      expect(funnel.tasa_apertura).toBe(45.2)
      expect(funnel.tasa_click_sobre_abiertos).toBe(27.7)
      expect(funnel.tasa_conversion).toBe(6.0)
      // tasa_envio was removed because it can exceed 100%
      expect((funnel as Record<string, unknown>).tasa_envio).toBeUndefined()
    })

    it('should return etapas with correct types', async () => {
      vi.mocked(flujosService.getAnalytics).mockResolvedValue(mockAnalytics)

      const { result } = renderHook(
        () => useFlujoAnalytics(1),
        { wrapper: createQueryClientWrapper() }
      )

      await waitFor(() => {
        expect(result.current.data).toBeDefined()
      })

      const { etapas } = result.current.data!
      expect(etapas).toHaveLength(2)

      // Email stage should have all metrics
      const emailStage = etapas[0]
      expect(emailStage.tipo_mensaje).toBe('email')
      expect(emailStage.abiertos).toBe(150)
      expect(emailStage.clickeados).toBe(40)
      expect(emailStage.tasa_apertura).toBe(50.0)

      // SMS stage should have null for email-specific metrics
      const smsStage = etapas[1]
      expect(smsStage.tipo_mensaje).toBe('sms')
      expect(smsStage.abiertos).toBeNull()
      expect(smsStage.clickeados).toBeNull()
      expect(smsStage.tasa_apertura).toBeNull()
    })

    it('should return totales with envios and prospectos breakdown', async () => {
      vi.mocked(flujosService.getAnalytics).mockResolvedValue(mockAnalytics)

      const { result } = renderHook(
        () => useFlujoAnalytics(1),
        { wrapper: createQueryClientWrapper() }
      )

      await waitFor(() => {
        expect(result.current.data).toBeDefined()
      })

      const { totales } = result.current.data!
      
      // Envios breakdown
      expect(totales.envios.total).toBe(600)
      expect(totales.envios.enviados).toBe(587)
      expect(totales.envios.fallidos).toBe(13)
      expect(totales.envios.abiertos).toBe(271)
      expect(totales.envios.clickeados).toBe(75)

      // Prospectos breakdown
      expect(totales.prospectos.total).toBe(100)
      expect(totales.prospectos.completados).toBe(6)
      expect(totales.prospectos.en_proceso).toBe(80)
      expect(totales.prospectos.cancelados).toBe(4)
    })
  })

  describe('Stale Time', () => {
    it('should have 1 minute stale time for analytics', async () => {
      vi.mocked(flujosService.getAnalytics).mockResolvedValue(mockAnalytics)

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
      })

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(
        () => useFlujoAnalytics(1),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.data).toBeDefined()
      })

      // Verify query was called once
      expect(flujosService.getAnalytics).toHaveBeenCalledTimes(1)

      // Render another hook - should use cached data (staleTime = 60000)
      renderHook(
        () => useFlujoAnalytics(1),
        { wrapper }
      )

      // Should not call API again due to stale time
      expect(flujosService.getAnalytics).toHaveBeenCalledTimes(1)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty etapas array', async () => {
      const analyticsNoEtapas = {
        ...mockAnalytics,
        etapas: [],
      }
      vi.mocked(flujosService.getAnalytics).mockResolvedValue(analyticsNoEtapas)

      const { result } = renderHook(
        () => useFlujoAnalytics(1),
        { wrapper: createQueryClientWrapper() }
      )

      await waitFor(() => {
        expect(result.current.data).toBeDefined()
      })

      expect(result.current.data!.etapas).toHaveLength(0)
    })

    it('should handle zero values in metrics', async () => {
      const analyticsZeros: FlujoAnalytics = {
        resumen: {
          tasa_apertura: 0,
          tasa_click: 0,
          tasa_fallo: 0,
          costo_total: 0,
          costo_por_conversion: 0,
          emails_enviados: 0,
          sms_enviados: 0,
        },
        funnel: {
          prospectos: 0,
          enviados: 0,
          abiertos: 0,
          clickeados: 0,
          conversiones: 0,
          tasa_apertura: 0,
          tasa_click_sobre_abiertos: 0,
          tasa_conversion: 0,
        },
        etapas: [],
        totales: {
          envios: {
            total: 0,
            enviados: 0,
            fallidos: 0,
            pendientes: 0,
            abiertos: 0,
            clickeados: 0,
          },
          prospectos: {
            total: 0,
            completados: 0,
            en_proceso: 0,
            pendientes: 0,
            cancelados: 0,
          },
        },
      }
      vi.mocked(flujosService.getAnalytics).mockResolvedValue(analyticsZeros)

      const { result } = renderHook(
        () => useFlujoAnalytics(1),
        { wrapper: createQueryClientWrapper() }
      )

      await waitFor(() => {
        expect(result.current.data).toBeDefined()
      })

      expect(result.current.data!.totales.envios.total).toBe(0)
      expect(result.current.data!.totales.prospectos.total).toBe(0)
    })

    it('should treat flujoId of 0 as invalid (not fetch)', async () => {
      // Database IDs start at 1, so 0 is not a valid flujoId
      // The hook treats 0 as falsy and disables the query
      const { result } = renderHook(
        () => useFlujoAnalytics(0),
        { wrapper: createQueryClientWrapper() }
      )

      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
      expect(flujosService.getAnalytics).not.toHaveBeenCalled()
    })
  })
})
