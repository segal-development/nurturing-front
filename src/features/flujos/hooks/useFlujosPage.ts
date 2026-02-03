/**
 * Hook para cargar flujos filtrados por origen y tipo de deudor
 * Diseñado para la arquitectura modularizada de la página de Flujos
 */

import { logger } from '@/lib/logger'
import { useQuery } from '@tanstack/react-query'
import { flujosService } from '@/api/flujos.service'
import type { FlujoNurturing } from '@/types/flujo'

interface UseFlujosPageParams {
  origenId: string | null
  tipoDeudor: string | null
  page: number
  perPage: number
}

export function useFlujosPage({ origenId, tipoDeudor, page, perPage }: UseFlujosPageParams) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['flujos-page', origenId, tipoDeudor, page],
    queryFn: async () => {
      if (!origenId) {
        logger.log('useFlujosPage: No hay origen seleccionado, no cargando flujos')
        return null
      }

      try {
        logger.log('useFlujosPage: Cargando flujos con filtros:', {
          origenId,
          tipoDeudor,
          page,
          perPage,
        })

        const result = await flujosService.getAll({
          origen_id: origenId,
          tipo_deudor: tipoDeudor || undefined,
          page,
          per_page: perPage,
        })

        logger.log('useFlujosPage: Flujos cargados:', result)
        return result
      } catch (err: any) {
        logger.error('useFlujosPage: Error fetching flujos:', {
          status: err.response?.status,
          message: err.response?.data?.message || err.message,
        })
        throw err
      }
    },
    enabled: !!origenId,
  })

  const flujos = data?.data || []
  const total = data?.meta?.total || 0

  return {
    data: flujos as FlujoNurturing[],
    total,
    isLoading,
    isError,
    error,
  }
}
