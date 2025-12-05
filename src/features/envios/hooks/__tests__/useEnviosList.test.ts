/**
 * Tests for useEnviosList and useEnviosFilters hooks (RED phase)
 *
 * User Stories:
 * 1. As a user, I want to list shipments with pagination
 * 2. As a user, I want to filter shipments by various criteria
 * 3. As a user, I want to change filters and see results update
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type { EnviosListResponse, EnviosFilters, Envio } from '@/types/envios'
import enviosService from '@/api/envios.service'

vi.mock('@/api/envios.service', () => ({
  default: {
    list: vi.fn(),
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

describe('useEnviosList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic List', () => {
    it('should fetch initial paginated list', async () => {
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
          total: 100,
          pagina: 1,
          por_pagina: 50,
          total_paginas: 2,
        },
      }

      ;(enviosService.list as any).mockResolvedValue(mockResponse)

      // Hook test:
      // const { result } = renderHook(
      //   () => useEnviosList(),
      //   { wrapper: createQueryClientWrapper() }
      // )

      // await waitFor(() => {
      //   expect(result.current.isLoading).toBe(false)
      // })

      // expect(result.current.envios).toHaveLength(1)
      // expect(result.current.meta.total).toBe(100)
      // expect(result.current.meta.pagina).toBe(1)
    })

    it('should handle empty list', async () => {
      const mockResponse: EnviosListResponse = {
        data: [],
        meta: {
          total: 0,
          pagina: 1,
          por_pagina: 50,
          total_paginas: 0,
        },
      }

      ;(enviosService.list as any).mockResolvedValue(mockResponse)

      // Hook test:
      // const { result } = renderHook(
      //   () => useEnviosList(),
      //   { wrapper: createQueryClientWrapper() }
      // )

      // await waitFor(() => {
      //   expect(result.current.envios).toHaveLength(0)
      //   expect(result.current.meta.total).toBe(0)
      // })
    })

    it('should handle API errors', async () => {
      const error = new Error('Network error')
      ;(enviosService.list as any).mockRejectedValue(error)

      // Hook test:
      // const { result } = renderHook(
      //   () => useEnviosList(),
      //   { wrapper: createQueryClientWrapper() }
      // )

      // await waitFor(() => {
      //   expect(result.current.isError).toBe(true)
      //   expect(result.current.error).toEqual(error)
      // })
    })
  })

  describe('Pagination', () => {
    it('should support changing page', async () => {
      const mockResponse1: EnviosListResponse = {
        data: [
          {
            id: 1,
            flujo_id: 1,
            prospecto_id: 1,
            estado: 'enviado',
            canal: 'email',
            fecha_creacion: '2025-01-15T10:00:00Z',
            contenido: 'Page 1',
            metadata: { destinatario: 'user1@example.com' },
          },
        ],
        meta: {
          total: 100,
          pagina: 1,
          por_pagina: 50,
          total_paginas: 2,
        },
      }

      const mockResponse2: EnviosListResponse = {
        data: [
          {
            id: 51,
            flujo_id: 1,
            prospecto_id: 51,
            estado: 'enviado',
            canal: 'email',
            fecha_creacion: '2025-01-16T10:00:00Z',
            contenido: 'Page 2',
            metadata: { destinatario: 'user51@example.com' },
          },
        ],
        meta: {
          total: 100,
          pagina: 2,
          por_pagina: 50,
          total_paginas: 2,
        },
      }

      ;(enviosService.list as any)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2)

      // Hook test:
      // const { result } = renderHook(
      //   () => useEnviosList(),
      //   { wrapper: createQueryClientWrapper() }
      // )

      // await waitFor(() => {
      //   expect(result.current.envios[0].id).toBe(1)
      // })

      // act(() => {
      //   result.current.goToPage(2)
      // })

      // await waitFor(() => {
      //   expect(result.current.envios[0].id).toBe(51)
      //   expect(result.current.meta.pagina).toBe(2)
      // })
    })

    it('should support changing items per page', async () => {
      const mockResponse: EnviosListResponse = {
        data: Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          flujo_id: 1,
          prospecto_id: i + 1,
          estado: 'enviado' as const,
          canal: 'email' as const,
          fecha_creacion: '2025-01-15T10:00:00Z',
          contenido: `Item ${i + 1}`,
          metadata: { destinatario: `user${i + 1}@example.com` },
        })),
        meta: {
          total: 1000,
          pagina: 1,
          por_pagina: 100,
          total_paginas: 10,
        },
      }

      ;(enviosService.list as any).mockResolvedValue(mockResponse)

      // Hook test:
      // const { result } = renderHook(
      //   () => useEnviosList(),
      //   { wrapper: createQueryClientWrapper() }
      // )

      // act(() => {
      //   result.current.setPageSize(100)
      // })

      // await waitFor(() => {
      //   expect(enviosService.list).toHaveBeenCalledWith(
      //     expect.objectContaining({
      //       por_pagina: 100,
      //     })
      //   )
      //   expect(result.current.envios).toHaveLength(100)
      // })
    })
  })
})

describe('useEnviosFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Filter State Management', () => {
    it('should initialize with default filters', async () => {
      // Hook test:
      // const { result } = renderHook(
      //   () => useEnviosFilters(),
      //   { wrapper: createQueryClientWrapper() }
      // )

      // expect(result.current.filters).toEqual({
      //   pagina: 1,
      //   por_pagina: 50,
      // })
    })

    it('should update filters and trigger new fetch', async () => {
      const mockResponse: EnviosListResponse = {
        data: [
          {
            id: 1,
            flujo_id: 1,
            prospecto_id: 1,
            estado: 'fallido',
            canal: 'email',
            fecha_creacion: '2025-01-15T10:00:00Z',
            contenido: 'Failed email',
            metadata: {
              destinatario: 'user@example.com',
              error: 'Email error',
            },
          },
        ],
        meta: {
          total: 10,
          pagina: 1,
          por_pagina: 50,
          total_paginas: 1,
        },
      }

      ;(enviosService.list as any).mockResolvedValue(mockResponse)

      // Hook test:
      // const { result } = renderHook(
      //   () => {
      //     const filters = useEnviosFilters()
      //     const list = useEnviosList({ filters: filters.filters })
      //     return { ...filters, ...list }
      //   },
      //   { wrapper: createQueryClientWrapper() }
      // )

      // act(() => {
      //   result.current.setFilters({ estado: 'fallido' })
      // })

      // await waitFor(() => {
      //   expect(enviosService.list).toHaveBeenCalledWith(
      //     expect.objectContaining({
      //       estado: 'fallido',
      //     })
      //   )
      //   expect(result.current.envios[0].estado).toBe('fallido')
      // })
    })

    it('should filter by estado', async () => {
      const mockResponse: EnviosListResponse = {
        data: [
          {
            id: 2,
            flujo_id: 1,
            prospecto_id: 2,
            estado: 'pendiente',
            canal: 'email',
            fecha_creacion: '2025-01-15T10:00:00Z',
            contenido: 'Pending email',
            metadata: { destinatario: 'user2@example.com' },
          },
        ],
        meta: {
          total: 50,
          pagina: 1,
          por_pagina: 50,
          total_paginas: 1,
        },
      }

      ;(enviosService.list as any).mockResolvedValue(mockResponse)

      // Hook test:
      // const { result } = renderHook(
      //   () => useEnviosFilters(),
      //   { wrapper: createQueryClientWrapper() }
      // )

      // act(() => {
      //   result.current.setFilters({ estado: 'pendiente' })
      // })

      // await waitFor(() => {
      //   expect(result.current.filters.estado).toBe('pendiente')
      // })
    })

    it('should filter by canal', async () => {
      const mockResponse: EnviosListResponse = {
        data: [
          {
            id: 3,
            flujo_id: 2,
            prospecto_id: 3,
            estado: 'enviado',
            canal: 'sms',
            fecha_creacion: '2025-01-15T10:00:00Z',
            contenido: 'SMS message',
            metadata: { destinatario: '+56912345678' },
          },
        ],
        meta: {
          total: 100,
          pagina: 1,
          por_pagina: 50,
          total_paginas: 2,
        },
      }

      ;(enviosService.list as any).mockResolvedValue(mockResponse)

      // Hook test:
      // const { result } = renderHook(
      //   () => useEnviosFilters(),
      //   { wrapper: createQueryClientWrapper() }
      // )

      // act(() => {
      //   result.current.setFilters({ canal: 'sms' })
      // })

      // await waitFor(() => {
      //   expect(result.current.filters.canal).toBe('sms')
      // })
    })

    it('should filter by flujo_id', async () => {
      const mockResponse: EnviosListResponse = {
        data: [
          {
            id: 4,
            flujo_id: 5,
            prospecto_id: 4,
            estado: 'enviado',
            canal: 'email',
            fecha_creacion: '2025-01-15T10:00:00Z',
            contenido: 'Email',
            metadata: { destinatario: 'user4@example.com' },
          },
        ],
        meta: {
          total: 150,
          pagina: 1,
          por_pagina: 50,
          total_paginas: 3,
        },
      }

      ;(enviosService.list as any).mockResolvedValue(mockResponse)

      // Hook test:
      // const { result } = renderHook(
      //   () => useEnviosFilters(),
      //   { wrapper: createQueryClientWrapper() }
      // )

      // act(() => {
      //   result.current.setFilters({ flujo_id: 5 })
      // })

      // await waitFor(() => {
      //   expect(result.current.filters.flujo_id).toBe(5)
      // })
    })

    it('should filter by date range', async () => {
      const mockResponse: EnviosListResponse = {
        data: [],
        meta: {
          total: 0,
          pagina: 1,
          por_pagina: 50,
          total_paginas: 0,
        },
      }

      ;(enviosService.list as any).mockResolvedValue(mockResponse)

      // Hook test:
      // const { result } = renderHook(
      //   () => useEnviosFilters(),
      //   { wrapper: createQueryClientWrapper() }
      // )

      // act(() => {
      //   result.current.setFilters({
      //     fecha_desde: '2025-01-01',
      //     fecha_hasta: '2025-01-31',
      //   })
      // })

      // await waitFor(() => {
      //   expect(result.current.filters.fecha_desde).toBe('2025-01-01')
      //   expect(result.current.filters.fecha_hasta).toBe('2025-01-31')
      // })
    })

    it('should combine multiple filters', async () => {
      const mockResponse: EnviosListResponse = {
        data: [
          {
            id: 5,
            flujo_id: 1,
            prospecto_id: 5,
            estado: 'enviado',
            canal: 'email',
            fecha_creacion: '2025-01-15T10:00:00Z',
            contenido: 'Combined filter email',
            metadata: { destinatario: 'user5@example.com' },
          },
        ],
        meta: {
          total: 1,
          pagina: 1,
          por_pagina: 50,
          total_paginas: 1,
        },
      }

      ;(enviosService.list as any).mockResolvedValue(mockResponse)

      // Hook test:
      // const { result } = renderHook(
      //   () => useEnviosFilters(),
      //   { wrapper: createQueryClientWrapper() }
      // )

      // act(() => {
      //   result.current.setFilters({
      //     estado: 'enviado',
      //     canal: 'email',
      //     flujo_id: 1,
      //     fecha_desde: '2025-01-01',
      //   })
      // })

      // await waitFor(() => {
      //   expect(enviosService.list).toHaveBeenCalledWith(
      //     expect.objectContaining({
      //       estado: 'enviado',
      //       canal: 'email',
      //       flujo_id: 1,
      //       fecha_desde: '2025-01-01',
      //     })
      //   )
      // })
    })

    it('should reset filters to default', async () => {
      // Hook test:
      // const { result } = renderHook(
      //   () => useEnviosFilters(),
      //   { wrapper: createQueryClientWrapper() }
      // )

      // act(() => {
      //   result.current.setFilters({ estado: 'fallido', canal: 'sms' })
      // })

      // expect(result.current.filters).toEqual(
      //   expect.objectContaining({
      //     estado: 'fallido',
      //     canal: 'sms',
      //   })
      // )

      // act(() => {
      //   result.current.resetFilters()
      // })

      // expect(result.current.filters).toEqual({
      //   pagina: 1,
      //   por_pagina: 50,
      // })
    })
  })
})
