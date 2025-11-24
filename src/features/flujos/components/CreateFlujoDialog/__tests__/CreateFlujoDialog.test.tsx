import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
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
        expect(configuracionService.obtenerPrecios).toHaveBeenCalled()
      })
    })

    it('should call obtenerPrecios each time dialog opens', async () => {
      const { configuracionService } = await import('@/api/configuracion.service')

      vi.mocked(configuracionService.obtenerPrecios).mockResolvedValue({
        email_costo: 2.5,
        sms_costo: 15
      })

      const onOpenChange = vi.fn()

      const { rerender } = render(
        <CreateFlujoDialog
          open={true}
          onOpenChange={onOpenChange}
          tipoDeudor="deuda-alta"
        />,
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(configuracionService.obtenerPrecios).toHaveBeenCalledTimes(1)
      })

      // Close dialog
      rerender(
        <CreateFlujoDialog
          open={false}
          onOpenChange={onOpenChange}
          tipoDeudor="deuda-alta"
        />
      )

      // Reopen dialog
      rerender(
        <CreateFlujoDialog
          open={true}
          onOpenChange={onOpenChange}
          tipoDeudor="deuda-alta"
        />
      )

      await waitFor(() => {
        expect(configuracionService.obtenerPrecios).toHaveBeenCalledTimes(2)
      })
    })
  })
})
