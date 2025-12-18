/**
 * Tests for useEnviosStats hook (RED phase)
 *
 * User Story:
 * As a user, I want to fetch and display daily/today/flow statistics
 * The hook should handle loading states, caching, and errors gracefully
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type { EnviosDailyStatsResponse, EnviosTodayStats, EnviosFlowStatsResponse } from '@/types/envios'
import enviosService from '@/api/envios.service'

// Mock the envios service
vi.mock('@/api/envios.service', () => ({
  default: {
    getDailyStats: vi.fn(),
    getTodayStats: vi.fn(),
    getFlowStats: vi.fn(),
  },
}))

// Create a wrapper for React Query
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

// Placeholder hook interface for testing
interface UseEnviosStatsResult {
  dailyStats: EnviosDailyStatsResponse | undefined
  todayStats: EnviosTodayStats | undefined
  flowStats: EnviosFlowStatsResponse | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
}

describe('useEnviosStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Daily Stats', () => {
    it('should fetch daily statistics for a date range', async () => {
      const mockStats: EnviosDailyStatsResponse = {
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
        ],
        resumen: {
          total: 150,
          exitosos: 145,
          fallidos: 5,
          pendientes: 0,
        },
      }

      ;(enviosService.getDailyStats as any).mockResolvedValue(mockStats)

      // Hook will be tested here after implementation
      // const { result } = renderHook(
      //   () => useEnviosStats('2025-01-01', '2025-01-31'),
      //   { wrapper: createQueryClientWrapper() }
      // )

      // expect(result.current.isLoading).toBe(true)

      // await waitFor(() => {
      //   expect(result.current.isLoading).toBe(false)
      // })

      // expect(result.current.dailyStats).toEqual(mockStats)
    })

    it('should handle loading state correctly', async () => {
      const mockStats: EnviosDailyStatsResponse = {
        periodo: {
          fecha_inicio: '2025-01-01',
          fecha_fin: '2025-01-31',
        },
        estadisticas: [],
        resumen: {
          total: 0,
          exitosos: 0,
          fallidos: 0,
          pendientes: 0,
        },
      }

      ;(enviosService.getDailyStats as any).mockResolvedValue(mockStats)

      // Hook test:
      // const { result } = renderHook(
      //   () => useEnviosStats('2025-01-01', '2025-01-31'),
      //   { wrapper: createQueryClientWrapper() }
      // )

      // Initially should be loading
      // expect(result.current.isLoading).toBe(true)

      // After fetch
      // await waitFor(() => {
      //   expect(result.current.isLoading).toBe(false)
      //   expect(result.current.error).toBeNull()
      // })
    })

    it('should handle API errors gracefully', async () => {
      const error = new Error('API Error')
      ;(enviosService.getDailyStats as any).mockRejectedValue(error)

      // Hook test:
      // const { result } = renderHook(
      //   () => useEnviosStats('2025-01-01', '2025-01-31'),
      //   { wrapper: createQueryClientWrapper() }
      // )

      // await waitFor(() => {
      //   expect(result.current.isError).toBe(true)
      //   expect(result.current.error).toEqual(error)
      //   expect(result.current.dailyStats).toBeUndefined()
      // })
    })

    it('should cache results and not refetch when data is fresh', async () => {
      const mockStats: EnviosDailyStatsResponse = {
        periodo: {
          fecha_inicio: '2025-01-01',
          fecha_fin: '2025-01-31',
        },
        estadisticas: [],
        resumen: {
          total: 0,
          exitosos: 0,
          fallidos: 0,
          pendientes: 0,
        },
      }

      ;(enviosService.getDailyStats as any).mockResolvedValue(mockStats)

      // Hook test:
      // const { result: result1 } = renderHook(
      //   () => useEnviosStats('2025-01-01', '2025-01-31'),
      //   { wrapper: createQueryClientWrapper() }
      // )

      // await waitFor(() => {
      //   expect(result1.current.isLoading).toBe(false)
      // })

      // const callCount1 = (enviosService.getDailyStats as any).mock.calls.length

      // // Second hook with same params should use cache
      // const { result: result2 } = renderHook(
      //   () => useEnviosStats('2025-01-01', '2025-01-31'),
      //   { wrapper: createQueryClientWrapper() }
      // )

      // expect(result2.current.dailyStats).toEqual(mockStats)
      // // No new API call should be made
      // expect((enviosService.getDailyStats as any).mock.calls.length).toBe(callCount1)
    })
  })

  describe('Today Stats', () => {
    it('should fetch today statistics', async () => {
      const mockStats: EnviosTodayStats = {
        total: 250,
        pendiente: 50,
        enviado: 190,
        fallido: 10,
        email_count: 150,
        sms_count: 100,
      }

      ;(enviosService.getTodayStats as any).mockResolvedValue(mockStats)

      // Hook test:
      // const { result } = renderHook(
      //   () => useEnviosTodayStats(),
      //   { wrapper: createQueryClientWrapper() }
      // )

      // await waitFor(() => {
      //   expect(result.current.isLoading).toBe(false)
      // })

      // expect(result.current.todayStats).toEqual(mockStats)
    })

    it('should auto-refresh today stats at regular intervals', async () => {
      const mockStats: EnviosTodayStats = {
        total: 250,
        pendiente: 50,
        enviado: 190,
        fallido: 10,
        email_count: 150,
        sms_count: 100,
      }

      ;(enviosService.getTodayStats as any).mockResolvedValue(mockStats)

      // Hook test should support optional auto-refresh:
      // const { result } = renderHook(
      //   () => useEnviosTodayStats({ refetchInterval: 30000 }),
      //   { wrapper: createQueryClientWrapper() }
      // )

      // await waitFor(() => {
      //   expect(result.current.todayStats).toBeDefined()
      // })

      // // Check that service was called multiple times over time
      // act(() => {
      //   vi.advanceTimersByTime(31000)
      // })

      // expect((enviosService.getTodayStats as any).mock.calls.length).toBeGreaterThan(1)
    })
  })

  describe('Flow Stats', () => {
    it('should fetch statistics grouped by flow', async () => {
      const mockStats: EnviosFlowStatsResponse = {
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
        ],
        resumen: {
          total_flujos: 1,
          total_envios: 500,
          total_exitosos: 480,
          total_fallidos: 20,
        },
      }

      ;(enviosService.getFlowStats as any).mockResolvedValue(mockStats)

      // Hook test:
      // const { result } = renderHook(
      //   () => useEnviosFlowStats('2025-01-01', '2025-01-31'),
      //   { wrapper: createQueryClientWrapper() }
      // )

      // await waitFor(() => {
      //   expect(result.current.isLoading).toBe(false)
      // })

      // expect(result.current.flowStats?.estadisticas).toHaveLength(1)
      // expect(result.current.flowStats?.estadisticas[0].flujo_nombre).toBe('Newsletter Mensual')
    })

    it('should handle no flows with shipments', async () => {
      const mockStats: EnviosFlowStatsResponse = {
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

      ;(enviosService.getFlowStats as any).mockResolvedValue(mockStats)

      // Hook test:
      // const { result } = renderHook(
      //   () => useEnviosFlowStats('2025-12-01', '2025-12-31'),
      //   { wrapper: createQueryClientWrapper() }
      // )

      // await waitFor(() => {
      //   expect(result.current.flowStats?.estadisticas).toHaveLength(0)
      // })
    })
  })
})
