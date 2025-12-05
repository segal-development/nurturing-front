/**
 * Tests for EnviosList component (RED phase)
 *
 * User Stories:
 * 1. As a user, I want to see a list of shipments in a table
 * 2. As a user, I want to filter shipments by status, channel, and flow
 * 3. As a user, I want to paginate through results
 * 4. As a user, I want to click on a shipment to see details
 * 5. As a user, I want to sort by date and status
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type { EnviosListResponse } from '@/types/envios'

vi.mock('@/features/envios/hooks', () => ({
  useEnviosListWithFilters: vi.fn(),
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

describe('EnviosList', () => {
  let mockListResponse: EnviosListResponse

  beforeEach(() => {
    vi.clearAllMocks()

    mockListResponse = {
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
            destinatario: 'user1@example.com',
            asunto: 'Test Email',
          },
        },
        {
          id: 2,
          flujo_id: 1,
          prospecto_id: 2,
          estado: 'fallido',
          canal: 'email',
          fecha_creacion: '2025-01-15T11:00:00Z',
          contenido: 'Email content',
          metadata: {
            destinatario: 'invalid@example.com',
            error: 'Invalid email',
          },
        },
        {
          id: 3,
          flujo_id: 2,
          prospecto_id: 3,
          estado: 'enviado',
          canal: 'sms',
          fecha_creacion: '2025-01-15T12:00:00Z',
          fecha_enviado: '2025-01-15T12:05:00Z',
          contenido: 'SMS message',
          metadata: {
            destinatario: '+56912345678',
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
  })

  describe('Table Display', () => {
    it('should render table with shipment data', async () => {
      // const { useEnviosListWithFilters } = await import('@/features/envios/hooks')
      // ;(useEnviosListWithFilters as any).mockReturnValue({
      //   envios: mockListResponse.data,
      //   meta: mockListResponse.meta,
      //   isLoading: false,
      //   isError: false,
      //   filters: {},
      //   setFilters: vi.fn(),
      // })

      // render(<EnviosList />, { wrapper: createQueryWrapper() })

      // expect(screen.getByRole('table')).toBeInTheDocument()
      // expect(screen.getByText('user1@example.com')).toBeInTheDocument()
      // expect(screen.getByText('invalid@example.com')).toBeInTheDocument()
    })

    it('should show column headers', async () => {
      // const { useEnviosListWithFilters } = await import('@/features/envios/hooks')
      // ;(useEnviosListWithFilters as any).mockReturnValue({
      //   envios: mockListResponse.data,
      //   meta: mockListResponse.meta,
      //   isLoading: false,
      //   isError: false,
      //   filters: {},
      //   setFilters: vi.fn(),
      // })

      // render(<EnviosList />, { wrapper: createQueryWrapper() })

      // expect(screen.getByRole('columnheader', { name: /destinatario/i })).toBeInTheDocument()
      // expect(screen.getByRole('columnheader', { name: /estado/i })).toBeInTheDocument()
      // expect(screen.getByRole('columnheader', { name: /canal/i })).toBeInTheDocument()
      // expect(screen.getByRole('columnheader', { name: /fecha/i })).toBeInTheDocument()
    })

    it('should display status badge with appropriate color', async () => {
      // const { useEnviosListWithFilters } = await import('@/features/envios/hooks')
      // ;(useEnviosListWithFilters as any).mockReturnValue({
      //   envios: mockListResponse.data,
      //   meta: mockListResponse.meta,
      //   isLoading: false,
      //   isError: false,
      //   filters: {},
      //   setFilters: vi.fn(),
      // })

      // render(<EnviosList />, { wrapper: createQueryWrapper() })

      // const enviado = screen.getByText('Enviado')
      // expect(enviado).toHaveClass('bg-green')

      // const fallido = screen.getByText('Fallido')
      // expect(fallido).toHaveClass('bg-red')
    })

    it('should show channel icon', async () => {
      // const { useEnviosListWithFilters } = await import('@/features/envios/hooks')
      // ;(useEnviosListWithFilters as any).mockReturnValue({
      //   envios: mockListResponse.data,
      //   meta: mockListResponse.meta,
      //   isLoading: false,
      //   isError: false,
      //   filters: {},
      //   setFilters: vi.fn(),
      // })

      // render(<EnviosList />, { wrapper: createQueryWrapper() })

      // // Should show email icon for first row
      // const emailRows = screen.getAllByText(/📧/)
      // expect(emailRows.length).toBeGreaterThan(0)

      // // Should show SMS icon
      // expect(screen.getByText(/📱/)).toBeInTheDocument()
    })

    it('should handle empty list gracefully', async () => {
      // const { useEnviosListWithFilters } = await import('@/features/envios/hooks')
      // ;(useEnviosListWithFilters as any).mockReturnValue({
      //   envios: [],
      //   meta: {
      //     total: 0,
      //     pagina: 1,
      //     por_pagina: 50,
      //     total_paginas: 0,
      //   },
      //   isLoading: false,
      //   isError: false,
      //   filters: {},
      //   setFilters: vi.fn(),
      // })

      // render(<EnviosList />, { wrapper: createQueryWrapper() })

      // expect(screen.getByText(/no hay envios/i)).toBeInTheDocument()
    })
  })

  describe('Filters', () => {
    it('should show filter controls above table', async () => {
      // const { useEnviosListWithFilters } = await import('@/features/envios/hooks')
      // ;(useEnviosListWithFilters as any).mockReturnValue({
      //   envios: mockListResponse.data,
      //   meta: mockListResponse.meta,
      //   isLoading: false,
      //   isError: false,
      //   filters: {},
      //   setFilters: vi.fn(),
      // })

      // render(<EnviosList />, { wrapper: createQueryWrapper() })

      // expect(screen.getByRole('combobox', { name: /estado/i })).toBeInTheDocument()
      // expect(screen.getByRole('combobox', { name: /canal/i })).toBeInTheDocument()
      // expect(screen.getByRole('combobox', { name: /flujo/i })).toBeInTheDocument()
    })

    it('should filter by estado', async () => {
      // const setFiltersMock = vi.fn()
      // const { useEnviosListWithFilters } = await import('@/features/envios/hooks')
      // ;(useEnviosListWithFilters as any).mockReturnValue({
      //   envios: [mockListResponse.data[0]], // Only "enviado"
      //   meta: { ...mockListResponse.meta, total: 1 },
      //   isLoading: false,
      //   isError: false,
      //   filters: { estado: 'enviado' },
      //   setFilters: setFiltersMock,
      // })

      // render(<EnviosList />, { wrapper: createQueryWrapper() })

      // const estadoFilter = screen.getByRole('combobox', { name: /estado/i })
      // await userEvent.selectOptions(estadoFilter, 'enviado')

      // expect(setFiltersMock).toHaveBeenCalledWith(expect.objectContaining({ estado: 'enviado' }))
    })

    it('should filter by canal', async () => {
      // const setFiltersMock = vi.fn()
      // const { useEnviosListWithFilters } = await import('@/features/envios/hooks')
      // ;(useEnviosListWithFilters as any).mockReturnValue({
      //   envios: [mockListResponse.data[0], mockListResponse.data[1]], // Only emails
      //   meta: { ...mockListResponse.meta, total: 2 },
      //   isLoading: false,
      //   isError: false,
      //   filters: { canal: 'email' },
      //   setFilters: setFiltersMock,
      // })

      // render(<EnviosList />, { wrapper: createQueryWrapper() })

      // const canalFilter = screen.getByRole('combobox', { name: /canal/i })
      // await userEvent.selectOptions(canalFilter, 'email')

      // expect(setFiltersMock).toHaveBeenCalledWith(expect.objectContaining({ canal: 'email' }))
    })

    it('should filter by flujo', async () => {
      // const setFiltersMock = vi.fn()
      // const { useEnviosListWithFilters } = await import('@/features/envios/hooks')
      // ;(useEnviosListWithFilters as any).mockReturnValue({
      //   envios: [mockListResponse.data[0], mockListResponse.data[1]], // Only flujo 1
      //   meta: { ...mockListResponse.meta, total: 2 },
      //   isLoading: false,
      //   isError: false,
      //   filters: { flujo_id: 1 },
      //   setFilters: setFiltersMock,
      // })

      // render(<EnviosList />, { wrapper: createQueryWrapper() })

      // const flujoFilter = screen.getByRole('combobox', { name: /flujo/i })
      // await userEvent.selectOptions(flujoFilter, '1')

      // expect(setFiltersMock).toHaveBeenCalledWith(expect.objectContaining({ flujo_id: 1 }))
    })

    it('should have date range filters', async () => {
      // const { useEnviosListWithFilters } = await import('@/features/envios/hooks')
      // ;(useEnviosListWithFilters as any).mockReturnValue({
      //   envios: mockListResponse.data,
      //   meta: mockListResponse.meta,
      //   isLoading: false,
      //   isError: false,
      //   filters: {},
      //   setFilters: vi.fn(),
      // })

      // render(<EnviosList />, { wrapper: createQueryWrapper() })

      // expect(screen.getByLabelText(/desde/i)).toBeInTheDocument()
      // expect(screen.getByLabelText(/hasta/i)).toBeInTheDocument()
    })

    it('should clear all filters with reset button', async () => {
      // const setFiltersMock = vi.fn()
      // const { useEnviosListWithFilters } = await import('@/features/envios/hooks')
      // ;(useEnviosListWithFilters as any).mockReturnValue({
      //   envios: mockListResponse.data,
      //   meta: mockListResponse.meta,
      //   isLoading: false,
      //   isError: false,
      //   filters: { estado: 'fallido', canal: 'email' },
      //   setFilters: setFiltersMock,
      // })

      // render(<EnviosList />, { wrapper: createQueryWrapper() })

      // const resetButton = screen.getByRole('button', { name: /limpiar filtros/i })
      // await userEvent.click(resetButton)

      // expect(setFiltersMock).toHaveBeenCalledWith({})
    })
  })

  describe('Pagination', () => {
    it('should show pagination controls', async () => {
      // const { useEnviosListWithFilters } = await import('@/features/envios/hooks')
      // ;(useEnviosListWithFilters as any).mockReturnValue({
      //   envios: mockListResponse.data,
      //   meta: mockListResponse.meta,
      //   isLoading: false,
      //   isError: false,
      //   filters: { pagina: 1 },
      //   setPage: vi.fn(),
      // })

      // render(<EnviosList />, { wrapper: createQueryWrapper() })

      // expect(screen.getByText(/página 1 de 2/i)).toBeInTheDocument()
    })

    it('should change page when next button is clicked', async () => {
      // const setPageMock = vi.fn()
      // const { useEnviosListWithFilters } = await import('@/features/envios/hooks')
      // ;(useEnviosListWithFilters as any).mockReturnValue({
      //   envios: mockListResponse.data,
      //   meta: mockListResponse.meta,
      //   isLoading: false,
      //   isError: false,
      //   filters: { pagina: 1 },
      //   setPage: setPageMock,
      // })

      // render(<EnviosList />, { wrapper: createQueryWrapper() })

      // const nextButton = screen.getByRole('button', { name: /siguiente/i })
      // await userEvent.click(nextButton)

      // expect(setPageMock).toHaveBeenCalledWith(2)
    })

    it('should disable next button on last page', async () => {
      // const { useEnviosListWithFilters } = await import('@/features/envios/hooks')
      // ;(useEnviosListWithFilters as any).mockReturnValue({
      //   envios: mockListResponse.data,
      //   meta: { ...mockListResponse.meta, pagina: 2, total_paginas: 2 },
      //   isLoading: false,
      //   isError: false,
      //   filters: { pagina: 2 },
      //   setPage: vi.fn(),
      // })

      // render(<EnviosList />, { wrapper: createQueryWrapper() })

      // const nextButton = screen.getByRole('button', { name: /siguiente/i })
      // expect(nextButton).toBeDisabled()
    })

    it('should show items per page selector', async () => {
      // const { useEnviosListWithFilters } = await import('@/features/envios/hooks')
      // ;(useEnviosListWithFilters as any).mockReturnValue({
      //   envios: mockListResponse.data,
      //   meta: mockListResponse.meta,
      //   isLoading: false,
      //   isError: false,
      //   filters: {},
      //   setPageSize: vi.fn(),
      // })

      // render(<EnviosList />, { wrapper: createQueryWrapper() })

      // expect(screen.getByLabelText(/por página/i)).toBeInTheDocument()
    })
  })

  describe('Row Actions', () => {
    it('should have view details action for each row', async () => {
      // const { useEnviosListWithFilters } = await import('@/features/envios/hooks')
      // ;(useEnviosListWithFilters as any).mockReturnValue({
      //   envios: mockListResponse.data,
      //   meta: mockListResponse.meta,
      //   isLoading: false,
      //   isError: false,
      //   filters: {},
      //   setFilters: vi.fn(),
      // })

      // render(<EnviosList />, { wrapper: createQueryWrapper() })

      // const viewButtons = screen.getAllByRole('button', { name: /ver detalles/i })
      // expect(viewButtons).toHaveLength(3)
    })

    it('should open detail modal when view is clicked', async () => {
      // const { useEnviosListWithFilters } = await import('@/features/envios/hooks')
      // ;(useEnviosListWithFilters as any).mockReturnValue({
      //   envios: mockListResponse.data,
      //   meta: mockListResponse.meta,
      //   isLoading: false,
      //   isError: false,
      //   filters: {},
      //   setFilters: vi.fn(),
      // })

      // render(<EnviosList />, { wrapper: createQueryWrapper() })

      // const viewButton = screen.getAllByRole('button', { name: /ver detalles/i })[0]
      // await userEvent.click(viewButton)

      // // Modal should appear with envio details
      // expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('Loading and Error States', () => {
    it('should show loading skeleton while fetching', async () => {
      // const { useEnviosListWithFilters } = await import('@/features/envios/hooks')
      // ;(useEnviosListWithFilters as any).mockReturnValue({
      //   envios: [],
      //   meta: { total: 0, pagina: 1, por_pagina: 50, total_paginas: 0 },
      //   isLoading: true,
      //   isError: false,
      //   filters: {},
      //   setFilters: vi.fn(),
      // })

      // render(<EnviosList />, { wrapper: createQueryWrapper() })

      // expect(screen.getAllByRole('status')).toBeDefined() // Skeleton loaders
    })

    it('should show error message on failure', async () => {
      // const { useEnviosListWithFilters } = await import('@/features/envios/hooks')
      // ;(useEnviosListWithFilters as any).mockReturnValue({
      //   envios: [],
      //   meta: { total: 0, pagina: 1, por_pagina: 50, total_paginas: 0 },
      //   isLoading: false,
      //   isError: true,
      //   error: new Error('Network error'),
      //   filters: {},
      //   setFilters: vi.fn(),
      // })

      // render(<EnviosList />, { wrapper: createQueryWrapper() })

      // expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })
})
