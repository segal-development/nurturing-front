import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { FlujoFormData } from '@/types/flujo'
import { flujoApi } from '@/api/flujos'

interface FlujoFilters {
  tipoProspecto?: string
  activo?: boolean
}

/**
 * Query hook to fetch all flujos with optional filters
 * Automatically cached and refetched based on staleTime
 */
export function useFlujos(filters?: FlujoFilters) {
  return useQuery({
    queryKey: ['flujos', filters],
    queryFn: () => flujoApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  })
}

/**
 * Query hook to fetch a single flujo by ID
 */
export function useFlujo(id: number | null) {
  return useQuery({
    queryKey: ['flujo', id],
    queryFn: () => (id ? flujoApi.getById(id) : Promise.reject(new Error('No ID provided'))),
    enabled: id !== null,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Mutation hook to create a new flujo
 */
export function useCreateFlujo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: FlujoFormData) => flujoApi.create(data),
    onSuccess: () => {
      // Invalidate all flujos queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['flujos'] })
    },
  })
}

/**
 * Mutation hook to update an existing flujo
 */
export function useUpdateFlujo(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<FlujoFormData>) => flujoApi.update(id, data),
    onSuccess: (updatedFlujo) => {
      // Update specific flujo in cache
      queryClient.setQueryData(['flujo', id], updatedFlujo)
      // Invalidate list to refetch
      queryClient.invalidateQueries({ queryKey: ['flujos'] })
    },
  })
}

/**
 * Mutation hook to delete a flujo
 */
export function useDeleteFlujo(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => flujoApi.delete(id),
    onSuccess: () => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['flujo', id] })
      // Invalidate list to refetch
      queryClient.invalidateQueries({ queryKey: ['flujos'] })
    },
  })
}
