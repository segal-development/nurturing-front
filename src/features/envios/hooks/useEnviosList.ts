/**
 * Hooks for fetching and managing Envios list
 *
 * Provides:
 * - useEnviosList: Fetch paginated list with filtering
 * - useEnviosFilters: Manage filter state
 */

import { useQuery } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import type { EnviosFilters } from '@/types/envios'
import { enviosService } from '@/api/envios.service'

/**
 * Default filters for initial state
 */
const DEFAULT_FILTERS: EnviosFilters = {
  pagina: 1,
  por_pagina: 50,
}

/**
 * Hook to fetch paginated list of envios with filtering
 *
 * @param filters - Filter options (estado, canal, flujo_id, fecha_desde, fecha_hasta, pagina, por_pagina)
 * @returns Query result with envios list and metadata
 *
 * @example
 * const { data, isLoading } = useEnviosList({
 *   estado: 'enviado',
 *   canal: 'email',
 *   pagina: 1
 * })
 *
 * if (isLoading) return <div>Loading...</div>
 * return (
 *   <div>
 *     {data?.data.map(envio => (
 *       <div key={envio.id}>{envio.metadata.destinatario}</div>
 *     ))}
 *   </div>
 * )
 */
export function useEnviosList(filters: EnviosFilters = DEFAULT_FILTERS) {
  return useQuery({
    queryKey: ['envios', 'list', filters],
    queryFn: () => enviosService.list(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook to manage filter state and provide filter controls
 *
 * Returns an object with:
 * - filters: Current filter object
 * - setFilters: Update one or more filters
 * - resetFilters: Reset to default filters
 * - setPage: Change current page
 * - setPageSize: Change items per page
 *
 * @returns Filter state and control functions
 *
 * @example
 * const {
 *   filters,
 *   setFilters,
 *   resetFilters,
 *   setPage,
 *   setPageSize
 * } = useEnviosFilters()
 *
 * // Update multiple filters at once
 * setFilters({ estado: 'fallido', canal: 'email' })
 *
 * // Go to page 2
 * setPage(2)
 *
 * // Change items per page to 100
 * setPageSize(100)
 *
 * // Reset all filters
 * resetFilters()
 */
export function useEnviosFilters() {
  const [filters, setFiltersState] = useState<EnviosFilters>(DEFAULT_FILTERS)

  const setFilters = useCallback((newFilters: Partial<EnviosFilters>) => {
    setFiltersState((prevFilters) => ({
      ...prevFilters,
      ...newFilters,
      pagina: 1, // Reset to first page when filters change
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS)
  }, [])

  const setPage = useCallback((pagina: number) => {
    setFiltersState((prevFilters) => ({
      ...prevFilters,
      pagina,
    }))
  }, [])

  const setPageSize = useCallback((por_pagina: number) => {
    setFiltersState((prevFilters) => ({
      ...prevFilters,
      por_pagina,
      pagina: 1, // Reset to first page
    }))
  }, [])

  return {
    filters,
    setFilters,
    resetFilters,
    setPage,
    setPageSize,
  }
}

/**
 * Combined hook for list with integrated filter management
 *
 * This hook combines useEnviosList and useEnviosFilters for convenience
 *
 * @returns Object with envios list data, metadata, filters, and control functions
 *
 * @example
 * const {
 *   envios,
 *   meta,
 *   isLoading,
 *   filters,
 *   setFilters,
 *   setPage
 * } = useEnviosListWithFilters()
 *
 * return (
 *   <div>
 *     <Filter
 *       estado={filters.estado}
 *       onEstadoChange={(estado) => setFilters({ estado })}
 *     />
 *     {isLoading ? <Spinner /> : (
 *       <>
 *         <EnviosTable envios={envios} />
 *         <Pagination
 *           current={meta.pagina}
 *           total={meta.total_paginas}
 *           onChange={setPage}
 *         />
 *       </>
 *     )}
 *   </div>
 * )
 */
export function useEnviosListWithFilters() {
  const filterState = useEnviosFilters()
  const listQuery = useEnviosList(filterState.filters)

  return {
    envios: listQuery.data?.data ?? [],
    meta: listQuery.data?.meta ?? {
      total: 0,
      pagina: 1,
      por_pagina: 50,
      total_paginas: 0,
    },
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    error: listQuery.error,
    ...filterState,
  }
}
