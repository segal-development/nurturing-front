/**
 * Hook para obtener lotes (batches) de un origen específico
 * Usado en la selección de lotes al crear flujos
 */

import { useQuery } from '@tanstack/react-query'
import { flujosService, type LotesPorOrigenResponse } from '@/api/flujos.service'

interface UseLotesPorOrigenOptions {
  origen: string | null
  enabled?: boolean
}

export function useLotesPorOrigen({ origen, enabled = true }: UseLotesPorOrigenOptions) {
  return useQuery<LotesPorOrigenResponse>({
    queryKey: ['lotes-por-origen', origen],
    queryFn: () => flujosService.getLotesPorOrigen(origen!),
    enabled: enabled && !!origen,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
