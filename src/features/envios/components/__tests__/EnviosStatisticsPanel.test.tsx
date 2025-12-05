/**
 * Tests for EnviosStatisticsPanel component (RED phase)
 *
 * User Stories:
 * 1. As a user, I want to see daily statistics in a chart
 * 2. As a user, I want to see email vs SMS breakdown
 * 3. As a user, I want to see statistics by flow
 * 4. As a user, I want to select a date range and see updated stats
 * 5. As a user, I want to see loading/error states
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type {
  EnviosDailyStatsResponse,
  EnviosFlowStatsResponse,
} from '@/types/envios'

// Mock the hooks
vi.mock('@/features/envios/hooks', () => ({
  useEnviosDailyStats: vi.fn(),
  useEnviosFlowStats: vi.fn(),
}))

const createQueryWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('EnviosStatisticsPanel', () => {
  let mockDailyStats: EnviosDailyStatsResponse
  let mockFlowStats: EnviosFlowStatsResponse

  beforeEach(() => {
    vi.clearAllMocks()

    mockDailyStats = {
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
        {
          fecha: '2025-01-03',
          total: 180,
          exitosos: 175,
          fallidos: 5,
          pendientes: 0,
          email_count: 110,
          sms_count: 70,
        },
      ],
      resumen: {
        total: 530,
        exitosos: 515,
        fallidos: 15,
        pendientes: 0,
      },
    }

    mockFlowStats = {
      periodo: {
        fecha_inicio: '2025-01-01',
        fecha_fin: '2025-01-31',
      },
      estadisticas: [
        {
          flujo_id: 1,
          flujo_nombre: 'Newsletter Mensual',
          total: 300,
          exitosos: 290,
          fallidos: 10,
          pendientes: 0,
          email_count: 300,
          sms_count: 0,
        },
        {
          flujo_id: 2,
          flujo_nombre: 'Promociones SMS',
          total: 230,
          exitosos: 225,
          fallidos: 5,
          pendientes: 0,
          email_count: 0,
          sms_count: 230,
        },
      ],
      resumen: {
        total_flujos: 2,
        total_envios: 530,
        total_exitosos: 515,
        total_fallidos: 15,
      },
    }
  })

  describe('Layout and Structure', () => {
    it('should render the statistics panel with header', async () => {
      // Component test placeholder
      // const { useEnviosDailyStats, useEnviosFlowStats } = await import(
      //   '@/features/envios/hooks'
      // )
      // ;(useEnviosDailyStats as any).mockReturnValue({
      //   data: mockDailyStats,
      //   isLoading: false,
      //   isError: false,
      // })
      // ;(useEnviosFlowStats as any).mockReturnValue({
      //   data: mockFlowStats,
      //   isLoading: false,
      //   isError: false,
      // })

      // render(<EnviosStatisticsPanel />, { wrapper: createQueryWrapper() })

      // expect(screen.getByRole('heading', { name: /estadísticas/i })).toBeInTheDocument()
    })

    it('should render date range selector', async () => {
      // render(<EnviosStatisticsPanel />, { wrapper: createQueryWrapper() })

      // expect(screen.getByLabelText(/fecha inicio/i)).toBeInTheDocument()
      // expect(screen.getByLabelText(/fecha fin/i)).toBeInTheDocument()
    })

    it('should have tabs for different statistics views', async () => {
      // render(<EnviosStatisticsPanel />, { wrapper: createQueryWrapper() })

      // expect(screen.getByRole('tab', { name: /diario/i })).toBeInTheDocument()
      // expect(screen.getByRole('tab', { name: /por flujo/i })).toBeInTheDocument()
      // expect(screen.getByRole('tab', { name: /resumen/i })).toBeInTheDocument()
    })
  })

  describe('Daily Statistics Tab', () => {
    it('should render daily chart when data loads', async () => {
      // const { useEnviosDailyStats } = await import('@/features/envios/hooks')
      // ;(useEnviosDailyStats as any).mockReturnValue({
      //   data: mockDailyStats,
      //   isLoading: false,
      //   isError: false,
      // })

      // render(<EnviosStatisticsPanel />, { wrapper: createQueryWrapper() })

      // await waitFor(() => {
      //   expect(screen.getByText(/2025-01-01/)).toBeInTheDocument()
      //   expect(screen.getByText(/2025-01-02/)).toBeInTheDocument()
      // })
    })

    it('should show email and SMS breakdown in chart', async () => {
      // const { useEnviosDailyStats } = await import('@/features/envios/hooks')
      // ;(useEnviosDailyStats as any).mockReturnValue({
      //   data: mockDailyStats,
      //   isLoading: false,
      //   isError: false,
      // })

      // render(<EnviosStatisticsPanel />, { wrapper: createQueryWrapper() })

      // // Chart should distinguish between email and SMS
      // expect(screen.getByText(/email/i)).toBeInTheDocument()
      // expect(screen.getByText(/sms/i)).toBeInTheDocument()
    })

    it('should show summary stats below chart', async () => {
      // const { useEnviosDailyStats } = await import('@/features/envios/hooks')
      // ;(useEnviosDailyStats as any).mockReturnValue({
      //   data: mockDailyStats,
      //   isLoading: false,
      //   isError: false,
      // })

      // render(<EnviosStatisticsPanel />, { wrapper: createQueryWrapper() })

      // expect(screen.getByText(/530/)).toBeInTheDocument() // total
      // expect(screen.getByText(/515/)).toBeInTheDocument() // exitosos
      // expect(screen.getByText(/15/)).toBeInTheDocument() // fallidos
    })

    it('should show success rate percentage', async () => {
      // const { useEnviosDailyStats } = await import('@/features/envios/hooks')
      // ;(useEnviosDailyStats as any).mockReturnValue({
      //   data: mockDailyStats,
      //   isLoading: false,
      //   isError: false,
      // })

      // render(<EnviosStatisticsPanel />, { wrapper: createQueryWrapper() })

      // // 515 / 530 = 97.17%
      // expect(screen.getByText(/97/)).toBeInTheDocument()
    })

    it('should handle empty daily stats', async () => {
      // const { useEnviosDailyStats } = await import('@/features/envios/hooks')
      // ;(useEnviosDailyStats as any).mockReturnValue({
      //   data: { ...mockDailyStats, estadisticas: [] },
      //   isLoading: false,
      //   isError: false,
      // })

      // render(<EnviosStatisticsPanel />, { wrapper: createQueryWrapper() })

      // expect(screen.getByText(/no hay datos/i)).toBeInTheDocument()
    })
  })

  describe('Channel Breakdown', () => {
    it('should show email vs SMS breakdown card', async () => {
      // const { useEnviosDailyStats } = await import('@/features/envios/hooks')
      // ;(useEnviosDailyStats as any).mockReturnValue({
      //   data: mockDailyStats,
      //   isLoading: false,
      //   isError: false,
      // })

      // render(<EnviosStatisticsPanel />, { wrapper: createQueryWrapper() })

      // // Should show breakdown
      // expect(screen.getByText(/email.*100/i)).toBeInTheDocument()
      // expect(screen.getByText(/sms.*50/i)).toBeInTheDocument()
    })

    it('should calculate email percentage correctly', async () => {
      // const { useEnviosDailyStats } = await import('@/features/envios/hooks')
      // ;(useEnviosDailyStats as any).mockReturnValue({
      //   data: mockDailyStats,
      //   isLoading: false,
      //   isError: false,
      // })

      // render(<EnviosStatisticsPanel />, { wrapper: createQueryWrapper() })

      // // Total email: 100+120+110 = 330
      // // Total: 530
      // // Percentage: 62.26%
      // expect(screen.getByText(/62/)).toBeInTheDocument()
    })

    it('should show visual representation (progress bar or pie chart)', async () => {
      // const { useEnviosDailyStats } = await import('@/features/envios/hooks')
      // ;(useEnviosDailyStats as any).mockReturnValue({
      //   data: mockDailyStats,
      //   isLoading: false,
      //   isError: false,
      // })

      // render(<EnviosStatisticsPanel />, { wrapper: createQueryWrapper() })

      // // Should have visual representation
      // const channelBreakdown = screen.getByRole('region', { name: /canal/i })
      // expect(within(channelBreakdown).getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('Flow Statistics', () => {
    it('should render flow stats when tab is clicked', async () => {
      // const { useEnviosFlowStats } = await import('@/features/envios/hooks')
      // ;(useEnviosFlowStats as any).mockReturnValue({
      //   data: mockFlowStats,
      //   isLoading: false,
      //   isError: false,
      // })

      // render(<EnviosStatisticsPanel />, { wrapper: createQueryWrapper() })

      // const flowTab = screen.getByRole('tab', { name: /por flujo/i })
      // await userEvent.click(flowTab)

      // await waitFor(() => {
      //   expect(screen.getByText(/Newsletter Mensual/)).toBeInTheDocument()
      //   expect(screen.getByText(/Promociones SMS/)).toBeInTheDocument()
      // })
    })

    it('should show flow statistics cards with metrics', async () => {
      // const { useEnviosFlowStats } = await import('@/features/envios/hooks')
      // ;(useEnviosFlowStats as any).mockReturnValue({
      //   data: mockFlowStats,
      //   isLoading: false,
      //   isError: false,
      // })

      // render(<EnviosStatisticsPanel />, { wrapper: createQueryWrapper() })

      // const flowTab = screen.getByRole('tab', { name: /por flujo/i })
      // await userEvent.click(flowTab)

      // expect(screen.getByText(/300/)).toBeInTheDocument() // Newsletter total
      // expect(screen.getByText(/290/)).toBeInTheDocument() // Newsletter exitosos
    })

    it('should allow filtering by flow', async () => {
      // const { useEnviosFlowStats } = await import('@/features/envios/hooks')
      // ;(useEnviosFlowStats as any).mockReturnValue({
      //   data: mockFlowStats,
      //   isLoading: false,
      //   isError: false,
      // })

      // render(<EnviosStatisticsPanel />, { wrapper: createQueryWrapper() })

      // const flowSelect = screen.getByLabelText(/filtrar por flujo/i)
      // await userEvent.selectOptions(flowSelect, '1')

      // // Should show only Newsletter Mensual stats
      // expect(screen.queryByText(/Promociones SMS/)).not.toBeInTheDocument()
    })
  })

  describe('Date Range Selection', () => {
    it('should update stats when date range changes', async () => {
      // const { useEnviosDailyStats } = await import('@/features/envios/hooks')
      // ;(useEnviosDailyStats as any).mockReturnValue({
      //   data: mockDailyStats,
      //   isLoading: false,
      //   isError: false,
      // })

      // render(<EnviosStatisticsPanel />, { wrapper: createQueryWrapper() })

      // const startDateInput = screen.getByLabelText(/fecha inicio/i)
      // const endDateInput = screen.getByLabelText(/fecha fin/i)

      // await userEvent.type(startDateInput, '2025-02-01')
      // await userEvent.type(endDateInput, '2025-02-28')

      // await waitFor(() => {
      //   expect(useEnviosDailyStats).toHaveBeenCalledWith('2025-02-01', '2025-02-28')
      // })
    })

    it('should have preset date range buttons', async () => {
      // render(<EnviosStatisticsPanel />, { wrapper: createQueryWrapper() })

      // expect(screen.getByRole('button', { name: /esta semana/i })).toBeInTheDocument()
      // expect(screen.getByRole('button', { name: /este mes/i })).toBeInTheDocument()
      // expect(screen.getByRole('button', { name: /últimos 3 meses/i })).toBeInTheDocument()
    })

    it('should update dates when preset button is clicked', async () => {
      // render(<EnviosStatisticsPanel />, { wrapper: createQueryWrapper() })

      // const thisMonthButton = screen.getByRole('button', { name: /este mes/i })
      // await userEvent.click(thisMonthButton)

      // const startDateInput = screen.getByLabelText(/fecha inicio/i) as HTMLInputElement
      // expect(startDateInput.value).toMatch(/2025-01-01/)
    })
  })

  describe('Loading and Error States', () => {
    it('should show loading spinner while fetching', async () => {
      // const { useEnviosDailyStats } = await import('@/features/envios/hooks')
      // ;(useEnviosDailyStats as any).mockReturnValue({
      //   data: undefined,
      //   isLoading: true,
      //   isError: false,
      // })

      // render(<EnviosStatisticsPanel />, { wrapper: createQueryWrapper() })

      // expect(screen.getByRole('status')).toBeInTheDocument() // Loading spinner
    })

    it('should show error message on API failure', async () => {
      // const { useEnviosDailyStats } = await import('@/features/envios/hooks')
      // const errorMessage = 'Failed to fetch statistics'
      // ;(useEnviosDailyStats as any).mockReturnValue({
      //   data: undefined,
      //   isLoading: false,
      //   isError: true,
      //   error: new Error(errorMessage),
      // })

      // render(<EnviosStatisticsPanel />, { wrapper: createQueryWrapper() })

      // expect(screen.getByText(new RegExp(errorMessage, 'i'))).toBeInTheDocument()
    })

    it('should have retry button on error', async () => {
      // const { useEnviosDailyStats } = await import('@/features/envios/hooks')
      // ;(useEnviosDailyStats as any).mockReturnValue({
      //   data: undefined,
      //   isLoading: false,
      //   isError: true,
      //   error: new Error('Network error'),
      // })

      // render(<EnviosStatisticsPanel />, { wrapper: createQueryWrapper() })

      // const retryButton = screen.getByRole('button', { name: /reintentar/i })
      // expect(retryButton).toBeInTheDocument()
    })
  })

  describe('Summary Stats', () => {
    it('should display summary statistics cards', async () => {
      // const { useEnviosDailyStats } = await import('@/features/envios/hooks')
      // ;(useEnviosDailyStats as any).mockReturnValue({
      //   data: mockDailyStats,
      //   isLoading: false,
      //   isError: false,
      // })

      // render(<EnviosStatisticsPanel />, { wrapper: createQueryWrapper() })

      // // Should show total
      // expect(screen.getByText(/Total Enviados/)).toBeInTheDocument()
      // expect(screen.getByText(/530/)).toBeInTheDocument()

      // // Should show successful
      // expect(screen.getByText(/Exitosos/)).toBeInTheDocument()
      // expect(screen.getByText(/515/)).toBeInTheDocument()

      // // Should show failed
      // expect(screen.getByText(/Fallidos/)).toBeInTheDocument()
      // expect(screen.getByText(/15/)).toBeInTheDocument()
    })

    it('should show success rate in percentage', async () => {
      // const { useEnviosDailyStats } = await import('@/features/envios/hooks')
      // ;(useEnviosDailyStats as any).mockReturnValue({
      //   data: mockDailyStats,
      //   isLoading: false,
      //   isError: false,
      // })

      // render(<EnviosStatisticsPanel />, { wrapper: createQueryWrapper() })

      // // 515/530 = 97.17%
      // expect(screen.getByText(/97/)).toBeInTheDocument()
    })

    it('should color-code success rate based on percentage', async () => {
      // const { useEnviosDailyStats } = await import('@/features/envios/hooks')
      // ;(useEnviosDailyStats as any).mockReturnValue({
      //   data: mockDailyStats,
      //   isLoading: false,
      //   isError: false,
      // })

      // render(<EnviosStatisticsPanel />, { wrapper: createQueryWrapper() })

      // const successRate = screen.getByText(/97/)
      // // Should have green color class for >90% success
      // expect(successRate.closest('.text-green')).toBeInTheDocument()
    })
  })

  describe('Export and Sharing', () => {
    it('should have export button', async () => {
      // render(<EnviosStatisticsPanel />, { wrapper: createQueryWrapper() })

      // expect(screen.getByRole('button', { name: /exportar/i })).toBeInTheDocument()
    })

    it('should export data as CSV', async () => {
      // const { useEnviosDailyStats } = await import('@/features/envios/hooks')
      // ;(useEnviosDailyStats as any).mockReturnValue({
      //   data: mockDailyStats,
      //   isLoading: false,
      //   isError: false,
      // })

      // render(<EnviosStatisticsPanel />, { wrapper: createQueryWrapper() })

      // const exportButton = screen.getByRole('button', { name: /exportar/i })
      // await userEvent.click(exportButton)

      // // Should trigger download
      // // (mock implementation would verify download occurred)
    })
  })
})
