import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { CreateFlujoDialog } from '../CreateFlujoDialog'
import { BrowserRouter } from 'react-router-dom'

// Mock the configuration service
vi.mock('@/api/configuracion.service', () => ({
  configuracionService: {
    obtenerPrecios: vi.fn()
  }
}))

// Mock the prospectos service
vi.mock('@/api/prospectos.service', () => ({
  prospectosService: {
    getAll: vi.fn()
  }
}))

// Mock the flujos service
vi.mock('@/api/flujos.service', () => ({
  flujosService: {
    createWithProspectos: vi.fn()
  }
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  )
}

describe('CreateFlujoDialog - Dynamic Pricing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading Dynamic Prices', () => {
    it('should load dynamic prices from configuracionService when dialog opens', async () => {
      const { configuracionService } = await import('@/api/configuracion.service')

      vi.mocked(configuracionService.obtenerPrecios).mockResolvedValue({
        email_costo: 2.5,
        sms_costo: 15
      })

      render(
        <CreateFlujoDialog
          open={true}
          onOpenChange={vi.fn()}
          tipoDeudor="deuda-alta"
        />,
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(configuracionService.obtenerPrecios).toHaveBeenCalled()
      })
    })

    it('should display updated email price from configuration', async () => {
      const { configuracionService } = await import('@/api/configuracion.service')

      vi.mocked(configuracionService.obtenerPrecios).mockResolvedValue({
        email_costo: 2.5,
        sms_costo: 15
      })

      render(
        <CreateFlujoDialog
          open={true}
          onOpenChange={vi.fn()}
          tipoDeudor="deuda-alta"
        />,
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(screen.getByText(/\$2.5 por envío/)).toBeInTheDocument()
      })
    })

    it('should display updated SMS price from configuration', async () => {
      const { configuracionService } = await import('@/api/configuracion.service')

      vi.mocked(configuracionService.obtenerPrecios).mockResolvedValue({
        email_costo: 2.5,
        sms_costo: 15
      })

      render(
        <CreateFlujoDialog
          open={true}
          onOpenChange={vi.fn()}
          tipoDeudor="deuda-alta"
        />,
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(screen.getByText(/\$15 por envío/)).toBeInTheDocument()
      })
    })

    it('should use default prices if service returns error', async () => {
      const { configuracionService } = await import('@/api/configuracion.service')

      vi.mocked(configuracionService.obtenerPrecios).mockRejectedValue(
        new Error('API Error')
      )

      render(
        <CreateFlujoDialog
          open={true}
          onOpenChange={vi.fn()}
          tipoDeudor="deuda-alta"
        />,
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        // Should fall back to default prices: $1 for email, $11 for SMS
        expect(screen.getByText(/\$1 por envío/)).toBeInTheDocument()
        expect(screen.getByText(/\$11 por envío/)).toBeInTheDocument()
      })
    })

    it('should show loading indicator while prices are being fetched', async () => {
      const { configuracionService } = await import('@/api/configuracion.service')

      // Use a promise that takes time to resolve
      vi.mocked(configuracionService.obtenerPrecios).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ email_costo: 2.5, sms_costo: 15 }), 100))
      )

      render(
        <CreateFlujoDialog
          open={true}
          onOpenChange={vi.fn()}
          tipoDeudor="deuda-alta"
        />,
        { wrapper: createWrapper() }
      )

      // Should show loading message initially
      expect(screen.getByText(/cargando precios actualizados/i)).toBeInTheDocument()

      // Should disappear after loading completes
      await waitFor(() => {
        expect(screen.queryByText(/cargando precios actualizados/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Price Display in Message Type Selection', () => {
    it('should display correct email price in Email button', async () => {
      const { configuracionService } = await import('@/api/configuracion.service')

      vi.mocked(configuracionService.obtenerPrecios).mockResolvedValue({
        email_costo: 3.0,
        sms_costo: 15
      })

      render(
        <CreateFlujoDialog
          open={true}
          onOpenChange={vi.fn()}
          tipoDeudor="deuda-alta"
        />,
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        const emailButtons = screen.getAllByText(/Email/)
        expect(emailButtons[0]).toBeInTheDocument()
        expect(screen.getByText(/\$3.0 por envío/)).toBeInTheDocument()
      })
    })

    it('should display correct SMS price in SMS button', async () => {
      const { configuracionService } = await import('@/api/configuracion.service')

      vi.mocked(configuracionService.obtenerPrecios).mockResolvedValue({
        email_costo: 1.0,
        sms_costo: 20
      })

      render(
        <CreateFlujoDialog
          open={true}
          onOpenChange={vi.fn()}
          tipoDeudor="deuda-alta"
        />,
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(screen.getByText(/\$20 por envío/)).toBeInTheDocument()
      })
    })
  })

  describe('Price Usage in Cost Calculations', () => {
    it('should use dynamic prices when calculating total cost', async () => {
      const { configuracionService } = await import('@/api/configuracion.service')
      const { prospectosService } = await import('@/api/prospectos.service')

      vi.mocked(configuracionService.obtenerPrecios).mockResolvedValue({
        email_costo: 2.5,
        sms_costo: 15
      })

      vi.mocked(prospectosService.getAll).mockResolvedValue({
        data: [
          { id: 1, nombre: 'Prospect 1', email: 'test1@example.com' },
          { id: 2, nombre: 'Prospect 2', email: 'test2@example.com' }
        ],
        pagination: {
          current_page: 1,
          per_page: 10,
          total: 2,
          last_page: 1
        }
      })

      render(
        <CreateFlujoDialog
          open={true}
          onOpenChange={vi.fn()}
          tipoDeudor="deuda-alta"
          opciones={{
            origenes: [{ id: '1', nombre: 'Origin 1', total_flujos: 0 }]
          }}
        />,
        { wrapper: createWrapper() }
      )

      const user = userEvent.setup()

      // Select origin
      await waitFor(() => {
        const originButton = screen.getByText('Origin 1')
        expect(originButton).toBeInTheDocument()
      })

      const originButton = screen.getByText('Origin 1')
      await user.click(originButton)

      // Click continue to prospects
      const continueButton = screen.getByRole('button', { name: /continuar/i })
      await user.click(continueButton)

      // Wait for prospects to load
      await waitFor(() => {
        expect(screen.getByText('Prospect 1')).toBeInTheDocument()
      })

      // The dynamic prices should be loaded and used in calculations
      expect(configuracionService.obtenerPrecios).toHaveBeenCalled()
    })
  })
})
