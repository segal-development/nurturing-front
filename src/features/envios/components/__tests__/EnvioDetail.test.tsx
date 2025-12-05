/**
 * Tests for EnvioDetail component
 * Component for displaying detailed information about a single shipment
 *
 * RED Phase: Tests first, before implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EnvioDetail } from '@/features/envios/components/EnvioDetail/EnvioDetail'
import * as useEnvioDetailHook from '@/features/envios/hooks/useEnvioDetail'

// Mock data
const mockEnvio = {
  id: 1,
  flujo_id: 1,
  prospecto_id: 1,
  estado: 'enviado' as const,
  canal: 'email' as const,
  fecha_creacion: '2025-01-01T10:00:00Z',
  fecha_enviado: '2025-01-01T10:05:00Z',
  contenido: 'Contenido del envío',
  metadata: {
    destinatario: 'test@example.com',
    asunto: 'Asunto de prueba',
  },
  prospecto: {
    id: 1,
    nombre: 'Juan Pérez',
    email: 'test@example.com',
    telefono: '1234567890',
    estado: 'activo' as const,
  },
  flujo: {
    id: 1,
    nombre: 'Flujo de Prueba',
    descripcion: 'Descripción del flujo',
    estado: 'activo' as const,
  },
  etapa: {
    id: 1,
    flujo_id: 1,
    dia_envio: 1,
    tipo_mensaje: 'email' as const,
    activo: true,
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-01T10:00:00Z',
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

describe('EnvioDetail Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('should display loading spinner when data is loading', () => {
      vi.spyOn(useEnvioDetailHook, 'useEnvioDetail').mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as any)

      renderWithQueryClient(<EnvioDetail envioId={1} />)

      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText(/cargando/i)).toBeInTheDocument()
    })

    it('should not display loading spinner when data is loaded', () => {
      vi.spyOn(useEnvioDetailHook, 'useEnvioDetail').mockReturnValue({
        data: mockEnvio,
        isLoading: false,
        isError: false,
        error: null,
      } as any)

      renderWithQueryClient(<EnvioDetail envioId={1} />)

      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('should display error message when query fails', () => {
      vi.spyOn(useEnvioDetailHook, 'useEnvioDetail').mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Failed to load envio'),
      } as any)

      renderWithQueryClient(<EnvioDetail envioId={1} />)

      expect(screen.getByText(/error.*cargar/i)).toBeInTheDocument()
      expect(screen.getByText(/intenta nuevamente/i)).toBeInTheDocument()
    })

    it('should display retry button on error', () => {
      const refetch = vi.fn()
      vi.spyOn(useEnvioDetailHook, 'useEnvioDetail').mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Failed to load'),
        refetch,
      } as any)

      renderWithQueryClient(<EnvioDetail envioId={1} />)

      const retryButton = screen.getByRole('button', { name: /reintentar/i })
      expect(retryButton).toBeInTheDocument()
    })
  })

  describe('Display Shipment Information', () => {
    beforeEach(() => {
      vi.spyOn(useEnvioDetailHook, 'useEnvioDetail').mockReturnValue({
        data: mockEnvio,
        isLoading: false,
        isError: false,
        error: null,
      } as any)
    })

    it('should display recipient information', () => {
      renderWithQueryClient(<EnvioDetail envioId={1} />)

      expect(screen.getByText(/juan pérez/i)).toBeInTheDocument()
      expect(screen.getByText(/test@example.com/i)).toBeInTheDocument()
    })

    it('should display channel information', () => {
      renderWithQueryClient(<EnvioDetail envioId={1} />)

      expect(screen.getByText(/email/i)).toBeInTheDocument()
    })

    it('should display status with correct color coding', () => {
      renderWithQueryClient(<EnvioDetail envioId={1} />)

      const statusBadge = screen.getByText(/enviado/i)
      expect(statusBadge).toHaveClass(/green|success|enviado/)
    })

    it('should display flow name', () => {
      renderWithQueryClient(<EnvioDetail envioId={1} />)

      expect(screen.getByText(/flujo de prueba/i)).toBeInTheDocument()
    })

    it('should display stage day', () => {
      renderWithQueryClient(<EnvioDetail envioId={1} />)

      expect(screen.getByText(/día 1/i)).toBeInTheDocument()
    })

    it('should display email subject if available', () => {
      renderWithQueryClient(<EnvioDetail envioId={1} />)

      expect(screen.getByText(/asunto de prueba/i)).toBeInTheDocument()
    })

    it('should display email content', () => {
      renderWithQueryClient(<EnvioDetail envioId={1} />)

      expect(screen.getByText(/contenido del envío/i)).toBeInTheDocument()
    })

    it('should display creation date', () => {
      renderWithQueryClient(<EnvioDetail envioId={1} />)

      expect(screen.getByText(/2025-01-01/)).toBeInTheDocument()
    })

    it('should display sent date for sent envios', () => {
      renderWithQueryClient(<EnvioDetail envioId={1} />)

      const sentDateElement = screen.getByText(/enviado.*2025-01-01/)
      expect(sentDateElement).toBeInTheDocument()
    })
  })

  describe('Status-Specific Display', () => {
    it('should not display sent date for pending envios', () => {
      const pendingEnvio = { ...mockEnvio, estado: 'pendiente' as const, fecha_enviado: undefined }
      vi.spyOn(useEnvioDetailHook, 'useEnvioDetail').mockReturnValue({
        data: pendingEnvio,
        isLoading: false,
        isError: false,
        error: null,
      } as any)

      renderWithQueryClient(<EnvioDetail envioId={1} />)

      expect(screen.queryByText(/enviado.*2025-01-01/)).not.toBeInTheDocument()
    })

    it('should display error message for failed envios', () => {
      const failedEnvio = {
        ...mockEnvio,
        estado: 'fallido' as const,
        metadata: { ...mockEnvio.metadata, error: 'Invalid email address' },
      }
      vi.spyOn(useEnvioDetailHook, 'useEnvioDetail').mockReturnValue({
        data: failedEnvio,
        isLoading: false,
        isError: false,
        error: null,
      } as any)

      renderWithQueryClient(<EnvioDetail envioId={1} />)

      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument()
    })
  })

  describe('Tabs Navigation', () => {
    beforeEach(() => {
      vi.spyOn(useEnvioDetailHook, 'useEnvioDetail').mockReturnValue({
        data: mockEnvio,
        isLoading: false,
        isError: false,
        error: null,
      } as any)
    })

    it('should have Detalles tab selected by default', () => {
      renderWithQueryClient(<EnvioDetail envioId={1} />)

      const tab = screen.getByRole('tab', { name: /detalles/i })
      expect(tab).toHaveAttribute('data-state', 'active')
    })

    it('should have Contenido tab', () => {
      renderWithQueryClient(<EnvioDetail envioId={1} />)

      expect(screen.getByRole('tab', { name: /contenido/i })).toBeInTheDocument()
    })

    it('should switch to Contenido tab when clicked', async () => {
      const user = userEvent.setup()
      renderWithQueryClient(<EnvioDetail envioId={1} />)

      const contentTab = screen.getByRole('tab', { name: /contenido/i })
      await user.click(contentTab)

      expect(contentTab).toHaveAttribute('data-state', 'active')
    })

    it('should display content panel when switched to Contenido tab', async () => {
      const user = userEvent.setup()
      renderWithQueryClient(<EnvioDetail envioId={1} />)

      const contentTab = screen.getByRole('tab', { name: /contenido/i })
      await user.click(contentTab)

      await waitFor(() => {
        expect(screen.getByText(/contenido del envío/i)).toBeInTheDocument()
      })
    })
  })

  describe('Action Buttons', () => {
    beforeEach(() => {
      vi.spyOn(useEnvioDetailHook, 'useEnvioDetail').mockReturnValue({
        data: mockEnvio,
        isLoading: false,
        isError: false,
        error: null,
      } as any)
    })

    it('should have copy button for email address', () => {
      renderWithQueryClient(<EnvioDetail envioId={1} />)

      expect(screen.getByRole('button', { name: /copiar/i })).toBeInTheDocument()
    })

    it('should copy email to clipboard when copy button clicked', async () => {
      const user = userEvent.setup()
      vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()

      renderWithQueryClient(<EnvioDetail envioId={1} />)

      const copyButton = screen.getByRole('button', { name: /copiar/i })
      await user.click(copyButton)

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test@example.com')
      })
    })

    it('should show success message after copy', async () => {
      const user = userEvent.setup()
      vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()

      renderWithQueryClient(<EnvioDetail envioId={1} />)

      const copyButton = screen.getByRole('button', { name: /copiar/i })
      await user.click(copyButton)

      await waitFor(() => {
        expect(screen.getByText(/copiado/i)).toBeInTheDocument()
      })
    })

    it('should have close button', () => {
      renderWithQueryClient(<EnvioDetail envioId={1} />)

      const closeButton = screen.getByRole('button', { name: /cerrar|×/i })
      expect(closeButton).toBeInTheDocument()
    })

    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      renderWithQueryClient(<EnvioDetail envioId={1} onClose={onClose} />)

      const closeButton = screen.getByRole('button', { name: /cerrar|×/i })
      await user.click(closeButton)

      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('Metadata Display', () => {
    beforeEach(() => {
      vi.spyOn(useEnvioDetailHook, 'useEnvioDetail').mockReturnValue({
        data: mockEnvio,
        isLoading: false,
        isError: false,
        error: null,
      } as any)
    })

    it('should display recipient from metadata', () => {
      renderWithQueryClient(<EnvioDetail envioId={1} />)

      expect(screen.getByText(/test@example.com/)).toBeInTheDocument()
    })

    it('should display email subject from metadata', () => {
      renderWithQueryClient(<EnvioDetail envioId={1} />)

      expect(screen.getByText(/asunto de prueba/i)).toBeInTheDocument()
    })

    it('should display error from metadata if envio failed', () => {
      const failedEnvio = {
        ...mockEnvio,
        estado: 'fallido' as const,
        metadata: { ...mockEnvio.metadata, error: 'Email bounced' },
      }
      vi.spyOn(useEnvioDetailHook, 'useEnvioDetail').mockReturnValue({
        data: failedEnvio,
        isLoading: false,
        isError: false,
        error: null,
      } as any)

      renderWithQueryClient(<EnvioDetail envioId={1} />)

      expect(screen.getByText(/email bounced/i)).toBeInTheDocument()
    })
  })

  describe('Dark Mode Support', () => {
    beforeEach(() => {
      vi.spyOn(useEnvioDetailHook, 'useEnvioDetail').mockReturnValue({
        data: mockEnvio,
        isLoading: false,
        isError: false,
        error: null,
      } as any)
    })

    it('should have dark mode classes on main container', () => {
      const { container } = renderWithQueryClient(<EnvioDetail envioId={1} />)

      const mainCard = container.querySelector('[class*="dark:"]')
      expect(mainCard).toBeInTheDocument()
    })

    it('should apply dark styles to text elements', () => {
      const { container } = renderWithQueryClient(<EnvioDetail envioId={1} />)

      const darkText = container.querySelector('[class*="dark:text"]')
      expect(darkText).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    beforeEach(() => {
      vi.spyOn(useEnvioDetailHook, 'useEnvioDetail').mockReturnValue({
        data: mockEnvio,
        isLoading: false,
        isError: false,
        error: null,
      } as any)
    })

    it('should render on mobile screens', () => {
      global.innerWidth = 375
      renderWithQueryClient(<EnvioDetail envioId={1} />)

      expect(screen.getByText(/juan pérez/i)).toBeInTheDocument()
    })

    it('should render on tablet screens', () => {
      global.innerWidth = 768
      renderWithQueryClient(<EnvioDetail envioId={1} />)

      expect(screen.getByText(/juan pérez/i)).toBeInTheDocument()
    })

    it('should render on desktop screens', () => {
      global.innerWidth = 1920
      renderWithQueryClient(<EnvioDetail envioId={1} />)

      expect(screen.getByText(/juan pérez/i)).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should handle undefined envio gracefully', () => {
      vi.spyOn(useEnvioDetailHook, 'useEnvioDetail').mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      } as any)

      renderWithQueryClient(<EnvioDetail envioId={1} />)

      expect(screen.getByText(/no disponible|no encontrado/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      vi.spyOn(useEnvioDetailHook, 'useEnvioDetail').mockReturnValue({
        data: mockEnvio,
        isLoading: false,
        isError: false,
        error: null,
      } as any)
    })

    it('should have proper heading hierarchy', () => {
      renderWithQueryClient(<EnvioDetail envioId={1} />)

      const heading = screen.getByRole('heading')
      expect(heading).toBeInTheDocument()
    })

    it('should have proper tab role and attributes', () => {
      renderWithQueryClient(<EnvioDetail envioId={1} />)

      const tabs = screen.getAllByRole('tab')
      expect(tabs.length).toBeGreaterThan(0)
      tabs.forEach((tab) => {
        expect(tab).toHaveAttribute('data-state')
      })
    })

    it('should have semantic HTML structure', () => {
      const { container } = renderWithQueryClient(<EnvioDetail envioId={1} />)

      const cards = container.querySelectorAll('[class*="card"]')
      expect(cards.length).toBeGreaterThan(0)
    })

    it('should have proper labels for form inputs if present', () => {
      renderWithQueryClient(<EnvioDetail envioId={1} />)

      // Should not have unlabeled form inputs
      const inputs = screen.queryAllByRole('textbox')
      inputs.forEach((input) => {
        expect(input).toHaveAccessibleName()
      })
    })

    it('should announce loading state to screen readers', () => {
      vi.spyOn(useEnvioDetailHook, 'useEnvioDetail').mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as any)

      renderWithQueryClient(<EnvioDetail envioId={1} />)

      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })
})
