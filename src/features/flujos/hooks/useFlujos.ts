/**
 * Hooks para gestión de flujos de nurturing
 * 
 * Principios SOLID aplicados:
 * - Single Responsibility: Cada hook tiene una única responsabilidad
 * - Open/Closed: Fácil de extender sin modificar
 * - Dependency Inversion: Depende de abstracciones (service layer)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { flujosService } from '@/api/flujos.service'
import type { FlujoNurturing, FlujoFormData } from '@/types/flujo'

// ============================================================================
// Types
// ============================================================================

interface FlujoFilters {
  origen_id?: string
  tipo_deudor?: string
  page?: number
  per_page?: number
}

interface FlujoListResponse {
  data: FlujoNurturing[]
  meta: {
    total: number
    per_page: number
    current_page: number
    last_page: number
  }
}

// ============================================================================
// Query Keys (centralized for consistency)
// ============================================================================

export const flujoQueryKeys = {
  all: ['flujos'] as const,
  lists: () => [...flujoQueryKeys.all, 'list'] as const,
  list: (filters?: FlujoFilters) => [...flujoQueryKeys.lists(), filters] as const,
  details: () => [...flujoQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...flujoQueryKeys.details(), id] as const,
} as const

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook para obtener lista paginada de flujos con filtros opcionales
 * 
 * @param filters - Filtros opcionales (origen_id, tipo_deudor, page, per_page)
 * @returns Query result con data, isLoading, isError, etc.
 * 
 * @example
 * const { data, isLoading } = useFlujos({ origen_id: '1', page: 1 })
 */
export function useFlujos(filters?: FlujoFilters) {
  return useQuery<FlujoListResponse>({
    queryKey: flujoQueryKeys.list(filters),
    queryFn: () => flujosService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes (garbage collection)
  })
}

/**
 * Hook para obtener un flujo específico por ID
 * 
 * @param id - ID del flujo (null para deshabilitar la query)
 * @returns Query result con el flujo
 * 
 * @example
 * const { data: flujo } = useFlujo(selectedId)
 */
export function useFlujo(id: number | null) {
  return useQuery<FlujoNurturing>({
    queryKey: flujoQueryKeys.detail(id ?? 0),
    queryFn: async () => {
      if (id === null || id <= 0) {
        throw new Error('ID de flujo inválido')
      }
      return flujosService.getById(id)
    },
    enabled: id !== null && id > 0,
    staleTime: 5 * 60 * 1000,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook para crear un nuevo flujo
 * Invalida automáticamente la lista de flujos al crear exitosamente
 * 
 * @returns Mutation con mutate/mutateAsync
 * 
 * @example
 * const createFlujo = useCreateFlujo()
 * createFlujo.mutate({ nombre: 'Nuevo Flujo', ... })
 */
export function useCreateFlujo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: FlujoFormData) => flujosService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flujoQueryKeys.lists() })
    },
  })
}

/**
 * Hook para actualizar un flujo existente
 * Actualiza el caché del flujo específico y la lista
 * 
 * @param id - ID del flujo a actualizar
 * @returns Mutation con mutate/mutateAsync
 * 
 * @example
 * const updateFlujo = useUpdateFlujo(flujoId)
 * updateFlujo.mutate({ nombre: 'Nombre actualizado' })
 */
export function useUpdateFlujo(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<FlujoFormData>) => flujosService.update(id, data),
    onSuccess: (updatedFlujo) => {
      // Optimistic update del detalle
      queryClient.setQueryData(flujoQueryKeys.detail(id), updatedFlujo)
      // Invalidar lista para refetch
      queryClient.invalidateQueries({ queryKey: flujoQueryKeys.lists() })
    },
  })
}

/**
 * Hook para eliminar un flujo
 * Remueve del caché e invalida la lista
 * 
 * @param id - ID del flujo a eliminar
 * @returns Mutation con mutate/mutateAsync
 * 
 * @example
 * const deleteFlujo = useDeleteFlujo(flujoId)
 * deleteFlujo.mutate()
 */
export function useDeleteFlujo(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => flujosService.delete(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: flujoQueryKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: flujoQueryKeys.lists() })
    },
  })
}
