/**
 * Hook para obtener los detalles completos de un flujo
 * Incluye todas las relaciones y estadísticas desde el backend
 */

import { useQuery } from '@tanstack/react-query'
import { flujosService } from '@/api/flujos.service'
import type { FlujoNurturing } from '@/types/flujo'

interface UseFlujosDetailOptions {
  enabled?: boolean
}

export function useFlujosDetail(flujoId: number | null, options?: UseFlujosDetailOptions) {
  return useQuery<FlujoNurturing>({
    queryKey: ['flujos-detail', flujoId],
    queryFn: async () => {
      if (!flujoId) {
        throw new Error('Flujo ID is required')
      }
      return flujosService.getById(flujoId)
    },
    enabled: flujoId !== null && (options?.enabled !== false),
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}
