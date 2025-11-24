import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { OfertaFormData } from '@/types/oferta'
import { ofertaApi } from '@/api/ofertas'

interface OfertaFilters {
  activa?: boolean
}

/**
 * Query hook to fetch all ofertas with optional filters
 * Automatically cached and refetched based on staleTime
 */
export function useOfertas(filters?: OfertaFilters) {
  return useQuery({
    queryKey: ['ofertas', filters],
    queryFn: () => ofertaApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  })
}

/**
 * Query hook to fetch a single oferta by ID
 */
export function useOferta(id: number | null) {
  return useQuery({
    queryKey: ['oferta', id],
    queryFn: () => (id ? ofertaApi.getById(id) : Promise.reject(new Error('No ID provided'))),
    enabled: id !== null,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Mutation hook to create a new oferta
 */
export function useCreateOferta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: OfertaFormData) => ofertaApi.create(data),
    onSuccess: () => {
      // Invalidate all ofertas queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['ofertas'] })
    },
  })
}

/**
 * Mutation hook to update an existing oferta
 */
export function useUpdateOferta(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<OfertaFormData>) => ofertaApi.update(id, data),
    onSuccess: (updatedOferta) => {
      // Update specific oferta in cache
      queryClient.setQueryData(['oferta', id], updatedOferta)
      // Invalidate list to refetch
      queryClient.invalidateQueries({ queryKey: ['ofertas'] })
    },
  })
}

/**
 * Mutation hook to delete an oferta
 */
export function useDeleteOferta(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => ofertaApi.delete(id),
    onSuccess: () => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['oferta', id] })
      // Invalidate list to refetch
      queryClient.invalidateQueries({ queryKey: ['ofertas'] })
    },
  })
}
