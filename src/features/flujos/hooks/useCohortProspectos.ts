/**
 * useCohortProspectos
 *
 * React Query hook for fetching paginated prospects within a flow execution cohort.
 * Supports filtering by stage (node_id), send status (envio_estado), and search.
 *
 * Uses useInfiniteQuery for infinite scroll pagination support.
 *
 * @module useCohortProspectos
 */

import { useInfiniteQuery } from '@tanstack/react-query'

import { flowExecutionTrackingService } from '@/api/flowExecutionTracking.service'
import type {
  CohortProspectFilters,
  CohortProspectosResponse,
} from '@/types/flowExecutionTracking'

// ============================================================================
// Types
// ============================================================================

export interface UseCohortProspectosParams {
  flujoId: number
  ejecucionId: number
  filters: CohortProspectFilters
  enabled?: boolean
  perPage?: number
}

export interface UseCohortProspectosResult {
  /** Flattened array of all loaded prospects */
  prospects: CohortProspectosResponse['data']
  /** Total count of prospects matching current filters */
  total: number
  /** Whether initial data is loading */
  isLoading: boolean
  /** Whether there was an error */
  isError: boolean
  /** Error object if any */
  error: Error | null
  /** Whether next page is being fetched */
  isFetchingNextPage: boolean
  /** Whether there are more pages to load */
  hasNextPage: boolean
  /** Function to load next page */
  fetchNextPage: () => void
  /** Function to refetch all data */
  refetch: () => void
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_PER_PAGE = 50
const STALE_TIME = 30_000 // 30 seconds
const GC_TIME = 5 * 60_000 // 5 minutes

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for fetching cohort prospects with infinite scroll pagination
 *
 * @param params - Hook parameters
 * @returns Query result with prospects, loading states, and pagination helpers
 *
 * @example
 * const { prospects, isLoading, hasNextPage, fetchNextPage } = useCohortProspectos({
 *   flujoId: 1,
 *   ejecucionId: 123,
 *   filters: { node_id: 'stage_2', envio_estado: 'fallido' },
 * })
 */
export function useCohortProspectos({
  flujoId,
  ejecucionId,
  filters,
  enabled = true,
  perPage = DEFAULT_PER_PAGE,
}: UseCohortProspectosParams): UseCohortProspectosResult {
  const query = useInfiniteQuery({
    queryKey: ['cohort-prospectos', flujoId, ejecucionId, filters],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await flowExecutionTrackingService.getCohortProspectos(
        flujoId,
        ejecucionId,
        {
          page: pageParam,
          per_page: perPage,
          ...filters,
        },
      )
      return response
    },
    getNextPageParam: (lastPage) => {
      const { current_page, last_page } = lastPage.meta
      return current_page < last_page ? current_page + 1 : undefined
    },
    initialPageParam: 1,
    enabled: enabled && !!flujoId && !!ejecucionId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })

  // Flatten all pages into a single array of prospects
  const prospects = query.data?.pages.flatMap((page) => page.data) ?? []

  // Get total from the first page (most recent data)
  const total = query.data?.pages[0]?.meta.total ?? 0

  return {
    prospects,
    total,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  }
}
