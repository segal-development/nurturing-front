/**
 * Hook for fetching prospect counts grouped by debt type
 * Returns total count and breakdown by each debt category
 */

import { prospectosService } from '@/api/prospectos.service'
import type { ConteoPorTipoResponse } from '@/types/prospecto'
import { useQuery } from '@tanstack/react-query'

interface UseProspectosConteoPorTipoParams {
  origen?: string
  lote_id?: number
  importacion_id?: number
  estado?: string
  search?: string
  enabled?: boolean
}

/**
 * Fetch prospect counts grouped by tipo_prospecto (debt category)
 * Uses the /prospectos/conteo-por-tipo endpoint
 */
export function useProspectosConteoPorTipo({
  origen,
  lote_id,
  importacion_id,
  estado,
  search,
  enabled = true,
}: UseProspectosConteoPorTipoParams = {}) {
  return useQuery<ConteoPorTipoResponse>({
    queryKey: ['prospectos-conteo-por-tipo', origen, lote_id, importacion_id, estado, search],
    queryFn: () =>
      prospectosService.getConteoPorTipo({
        origen,
        lote_id,
        importacion_id,
        estado,
        search,
      }),
    enabled,
    staleTime: 30 * 1000, // 30 seconds - counts can change as imports process
  })
}
