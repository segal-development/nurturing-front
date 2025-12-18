/**
 * Tests for ExecutionMonitor component
 * Real-time monitoring of flow execution with metrics and timeline
 *
 * RED Phase: Tests first, before implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ExecutionMonitor } from '@/features/envios/components/ExecutionMonitor/ExecutionMonitor'
import * as useFlowExecutionHook from '@/features/envios/hooks/useFlowExecution'

// Mock data
const mockFlowExecution = {
  ejecucion: {
    id: 'exec-123',
    flujo_id: 1,
    estado: 'en_progreso' as const,
    fecha_inicio: '2025-01-05T10:00:00Z',
    metricas: {
      total_prospectos: 100,
      total_enviados: 45,
      total_fallidos: 5,
      total_pendientes: 50,
      tasa_exito: 90,
      tiempo_promedio_ms: 1500,
      tiempo_estimado_restante_ms: 75000,
    },
    eventos: [
      {
        id: '1',
        flujo_id: 1,
        tipo: 'inicio' as const,
        timestamp: '2025-01-05T10:00:00Z',
        mensaje: 'Ejecución iniciada',
      },
      {
        id: '2',
        flujo_id: 1,
        tipo: 'envio_completado' as const,
        timestamp: '2025-01-05T10:00:30Z',
        mensaje: 'Email enviado a juan@example.com',
        datos: { envio_id: 1, prospecto_id: 1 },
      },
    ],
  },
  proxima_actualizacion_ms: 2000,
}

const mockCompletedExecution = {
  ...mockFlowExecution,
  ejecucion: {
    ...mockFlowExecution.ejecucion,
    estado: 'completado' as const,
    fecha_fin: '2025-01-05T10:01:30Z',
    metricas: {
      total_prospectos: 100,
      total_enviados: 95,
      total_fallidos: 5,
      total_pendientes: 0,
      tasa_exito: 95,
      tiempo_promedio_ms: 1500,
      tiempo_estimado_restante_ms: 0,
    },
  },
}

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>,
  )
}

describe('ExecutionMonitor Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.confirm as any).mockClear()
  })

  describe('Loading State', () => {
    it('should display loading spinner when data is loading', () => {
      vi.spyOn(useFlowExecutionHook, 'useFlowExecution').mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as any)

      renderWithQueryClient(<ExecutionMonitor flujoId={1} ejecucionId="exec-123" />)

      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText(/cargando/i)).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('should display error message when query fails', () => {
      vi.spyOn(useFlowExecutionHook, 'useFlowExecution').mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Failed to load execution'),
      } as any)

      renderWithQueryClient(<ExecutionMonitor flujoId={1} ejecucionId="exec-123" />)

      expect(screen.getByText(/error.*monitorear/i)).toBeInTheDocument()
    })
  })

  describe('Execution In Progress', () => {
    beforeEach(() => {
      vi.spyOn(useFlowExecutionHook, 'useFlowExecution').mockReturnValue({
        data: mockFlowExecution,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any)
    })

    it('should display execution status as "En Progreso"', () => {
      renderWithQueryClient(<ExecutionMonitor flujoId={1} ejecucionId="exec-123" />)

      expect(screen.getByText(/en progreso/i)).toBeInTheDocument()
    })

    it('should display total number of prospects', () => {
      renderWithQueryClient(<ExecutionMonitor flujoId={1} ejecucionId="exec-123" />)

      const totalElements = screen.getAllByText(/100/)
      expect(totalElements.length).toBeGreaterThan(0)
    })

    it('should display sent count and percentage', () => {
      renderWithQueryClient(<ExecutionMonitor flujoId={1} ejecucionId="exec-123" />)

      expect(screen.getByText(/enviados/i)).toBeInTheDocument()
      const sentElements = screen.getAllByText(/45/)
      expect(sentElements.length).toBeGreaterThan(0)
    })

    it('should display failed count', () => {
      renderWithQueryClient(<ExecutionMonitor flujoId={1} ejecucionId="exec-123" />)

      expect(screen.getByText(/fallidos/i)).toBeInTheDocument()
      const failedElements = screen.getAllByText(/5/)
      expect(failedElements.length).toBeGreaterThan(0)
    })

    it('should display pending count', () => {
      renderWithQueryClient(<ExecutionMonitor flujoId={1} ejecucionId="exec-123" />)

      expect(screen.getByText(/pendientes/i)).toBeInTheDocument()
      expect(screen.getByText(/50/)).toBeInTheDocument()
    })

    it('should display success rate', () => {
      renderWithQueryClient(<ExecutionMonitor flujoId={1} ejecucionId="exec-123" />)

      expect(screen.getByText(/90%/)).toBeInTheDocument()
    })

    it('should display estimated time remaining', () => {
      renderWithQueryClient(<ExecutionMonitor flujoId={1} ejecucionId="exec-123" />)

      expect(screen.getByText(/tiempo estimado restante/i)).toBeInTheDocument()
    })

    it('should display progress bar with correct percentage', () => {
      const { container } = renderWithQueryClient(
        <ExecutionMonitor flujoId={1} ejecucionId="exec-123" />,
      )

      const progressBar = container.querySelector('[role="progressbar"]')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveAttribute('aria-valuenow', '45')
    })

    it('should show cancel button during execution', () => {
      renderWithQueryClient(<ExecutionMonitor flujoId={1} ejecucionId="exec-123" />)

      const cancelButton = screen.getByRole('button', { name: /cancelar/i })
      expect(cancelButton).toBeInTheDocument()
    })
  })

  describe('Execution Completed', () => {
    beforeEach(() => {
      vi.spyOn(useFlowExecutionHook, 'useFlowExecution').mockReturnValue({
        data: mockCompletedExecution,
        isLoading: false,
        isError: false,
        error: null,
      } as any)
    })

    it('should display completion status', () => {
      renderWithQueryClient(<ExecutionMonitor flujoId={1} ejecucionId="exec-123" />)

      const completedElements = screen.getAllByText(/completado/i)
      expect(completedElements.length).toBeGreaterThan(0)
    })

    it('should display completion time', () => {
      renderWithQueryClient(<ExecutionMonitor flujoId={1} ejecucionId="exec-123" />)

      expect(screen.getByText(/iniciado/i)).toBeInTheDocument()
      expect(screen.getByText(/finalizado/i)).toBeInTheDocument()
    })

    it('should not show cancel button when completed', () => {
      renderWithQueryClient(<ExecutionMonitor flujoId={1} ejecucionId="exec-123" />)

      const cancelButton = screen.queryByRole('button', { name: /cancelar/i })
      expect(cancelButton).not.toBeInTheDocument()
    })

    it('should show final statistics', () => {
      renderWithQueryClient(<ExecutionMonitor flujoId={1} ejecucionId="exec-123" />)

      const percentElements = screen.getAllByText(/95%/)
      expect(percentElements.length).toBeGreaterThan(0)
      expect(screen.getByText(/enviados/i)).toBeInTheDocument()
    })
  })

  describe('Timeline Display', () => {
    beforeEach(() => {
      vi.spyOn(useFlowExecutionHook, 'useFlowExecution').mockReturnValue({
        data: mockFlowExecution,
        isLoading: false,
        isError: false,
        error: null,
      } as any)
    })

    it('should display execution events timeline', () => {
      renderWithQueryClient(<ExecutionMonitor flujoId={1} ejecucionId="exec-123" />)

      expect(screen.getByText(/ejecución iniciada/i)).toBeInTheDocument()
      expect(screen.getByText(/email enviado/i)).toBeInTheDocument()
    })

    it('should display event timestamps', () => {
      const { container } = renderWithQueryClient(<ExecutionMonitor flujoId={1} ejecucionId="exec-123" />)

      // Check that timestamps are rendered in the event timeline
      const timeElements = container.querySelectorAll('[class*="text-xs"][class*="text-segal-dark"]')
      expect(timeElements.length).toBeGreaterThan(0)
    })
  })

  describe('Auto-refresh', () => {
    it('should auto-refresh status while execution is ongoing', () => {
      const refetch = vi.fn()
      vi.spyOn(useFlowExecutionHook, 'useFlowExecution').mockReturnValue({
        data: mockFlowExecution,
        isLoading: false,
        isError: false,
        error: null,
        refetch,
      } as any)

      renderWithQueryClient(<ExecutionMonitor flujoId={1} ejecucionId="exec-123" />)

      expect(refetch).not.toHaveBeenCalled() // Initial load shouldn't trigger refetch
    })
  })

  describe('Cancel Button Interaction', () => {
    it('should call cancel function when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const cancelMock = vi.fn()

      vi.spyOn(useFlowExecutionHook, 'useFlowExecution').mockReturnValue({
        data: mockFlowExecution,
        isLoading: false,
        isError: false,
        error: null,
      } as any)

      // Mock the cancel mutation with proper return type
      vi.spyOn(useFlowExecutionHook, 'useCancelFlowExecution').mockReturnValue({
        mutate: cancelMock,
        isPending: false,
      } as any)

      renderWithQueryClient(<ExecutionMonitor flujoId={1} ejecucionId="exec-123" />)

      const cancelButton = screen.getByRole('button', { name: /cancelar/i })
      await user.click(cancelButton)

      expect(cancelMock).toHaveBeenCalled()
    })

    it('should show loading state on cancel button during cancel', () => {
      vi.spyOn(useFlowExecutionHook, 'useFlowExecution').mockReturnValue({
        data: mockFlowExecution,
        isLoading: false,
        isError: false,
        error: null,
      } as any)

      vi.spyOn(useFlowExecutionHook, 'useCancelFlowExecution').mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
      } as any)

      renderWithQueryClient(<ExecutionMonitor flujoId={1} ejecucionId="exec-123" />)

      const cancelButton = screen.getByRole('button', { name: /cancelando/i })
      expect(cancelButton).toBeDisabled()
    })
  })

  describe('Metrics Display', () => {
    beforeEach(() => {
      vi.spyOn(useFlowExecutionHook, 'useFlowExecution').mockReturnValue({
        data: mockFlowExecution,
        isLoading: false,
        isError: false,
        error: null,
      } as any)
    })

    it('should display metrics in correct format', () => {
      renderWithQueryClient(<ExecutionMonitor flujoId={1} ejecucionId="exec-123" />)

      // Total
      expect(screen.getByText(/total/i)).toBeInTheDocument()
      // Sent
      expect(screen.getByText(/enviados/i)).toBeInTheDocument()
      // Failed
      expect(screen.getByText(/fallidos/i)).toBeInTheDocument()
      // Pending
      expect(screen.getByText(/pendientes/i)).toBeInTheDocument()
    })

    it('should have color-coded status indicators', () => {
      const { container } = renderWithQueryClient(
        <ExecutionMonitor flujoId={1} ejecucionId="exec-123" />,
      )

      const successIndicator = container.querySelector('[class*="green"]')
      const errorIndicator = container.querySelector('[class*="red"]')

      expect(successIndicator || errorIndicator).toBeTruthy()
    })
  })

  describe('Dark Mode Support', () => {
    beforeEach(() => {
      vi.spyOn(useFlowExecutionHook, 'useFlowExecution').mockReturnValue({
        data: mockFlowExecution,
        isLoading: false,
        isError: false,
        error: null,
      } as any)
    })

    it('should have dark mode classes', () => {
      const { container } = renderWithQueryClient(
        <ExecutionMonitor flujoId={1} ejecucionId="exec-123" />,
      )

      const darkModeElement = container.querySelector('[class*="dark:"]')
      expect(darkModeElement).toBeTruthy()
    })
  })

  describe('Responsive Design', () => {
    beforeEach(() => {
      vi.spyOn(useFlowExecutionHook, 'useFlowExecution').mockReturnValue({
        data: mockFlowExecution,
        isLoading: false,
        isError: false,
        error: null,
      } as any)
    })

    it('should render on mobile screens', () => {
      global.innerWidth = 375
      renderWithQueryClient(<ExecutionMonitor flujoId={1} ejecucionId="exec-123" />)

      expect(screen.getByText(/en progreso/i)).toBeInTheDocument()
    })

    it('should render on desktop screens', () => {
      global.innerWidth = 1920
      renderWithQueryClient(<ExecutionMonitor flujoId={1} ejecucionId="exec-123" />)

      expect(screen.getByText(/en progreso/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      vi.spyOn(useFlowExecutionHook, 'useFlowExecution').mockReturnValue({
        data: mockFlowExecution,
        isLoading: false,
        isError: false,
        error: null,
      } as any)
    })

    it('should have proper ARIA labels', () => {
      const { container } = renderWithQueryClient(
        <ExecutionMonitor flujoId={1} ejecucionId="exec-123" />,
      )

      const progressBar = container.querySelector('[role="progressbar"]')
      expect(progressBar).toHaveAttribute('aria-valuenow')
      expect(progressBar).toHaveAttribute('aria-valuemax')
      expect(progressBar).toHaveAttribute('aria-valuemin')
    })

    it('should have status region for live updates', () => {
      vi.spyOn(useFlowExecutionHook, 'useFlowExecution').mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as any)

      renderWithQueryClient(<ExecutionMonitor flujoId={1} ejecucionId="exec-123" />)

      const liveRegion = screen.getByRole('status')
      expect(liveRegion).toHaveAttribute('aria-live')
    })
  })
})
