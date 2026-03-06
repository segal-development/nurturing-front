/**
 * Hook for fetching unique metadata values from prospectos
 * Used to build dynamic filters (e.g., nivel_deuda dropdown)
 */

import { useQuery } from '@tanstack/react-query'
import { prospectosService, type MetadataValuesResponse } from '@/api/prospectos.service'

/**
 * Fetch unique values for a metadata field
 * Optionally filtered by lote_ids
 *
 * @param campo - The metadata field name (e.g., 'nivel_deuda')
 * @param loteIds - Optional array of lote IDs to filter by
 * @param enabled - Whether the query should run
 */
export function useMetadataValues(
  campo: string,
  loteIds?: number[],
  enabled: boolean = true
) {
  return useQuery<MetadataValuesResponse>({
    queryKey: ['metadata-values', campo, loteIds],
    queryFn: () =>
      prospectosService.getMetadataValues(campo, {
        lote_ids: loteIds,
      }),
    enabled: enabled && !!campo,
    staleTime: 30 * 1000, // 30 seconds - metadata can change with syncs
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to get count of prospectos with metadata filters applied
 */
export function useProspectosCountWithMetadata(params: {
  loteIds?: number[]
  metadataFilters?: Record<string, string | string[]>
  enabled?: boolean
}) {
  const { loteIds, metadataFilters, enabled = true } = params

  return useQuery<number>({
    queryKey: ['prospectos-count', 'with-metadata', loteIds, metadataFilters],
    queryFn: () =>
      prospectosService.getCountWithMetadata({
        lote_ids: loteIds,
        metadata_filters: metadataFilters,
      }),
    enabled,
    staleTime: 10 * 1000, // 10 seconds
  })
}

/**
 * Labels for nivel_deuda values
 */
export const NIVEL_DEUDA_LABELS: Record<string, string> = {
  baja: 'Deuda Baja (< $700k)',
  media: 'Deuda Media ($700k - $1.5M)',
  alta: 'Deuda Alta (> $1.5M)',
  sin_informacion: 'Sin información',
}

/**
 * Colors for nivel_deuda badges
 */
export const NIVEL_DEUDA_COLORS: Record<string, string> = {
  baja: 'bg-green-100 text-green-800 border-green-200',
  media: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  alta: 'bg-red-100 text-red-800 border-red-200',
  sin_informacion: 'bg-gray-100 text-gray-600 border-gray-200',
}
