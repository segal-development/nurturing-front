/**
 * Hook para cargar prospectos filtrados por lote, importación, estado y tipo
 * Solo carga si hay un lote o importación seleccionada
 */

import { useQuery } from '@tanstack/react-query'
import { logger } from '@/lib/logger'
import { prospectosService } from '@/api/prospectos.service'
import type { Prospecto } from '../types/prospectos'
import type { PaginatedResponse } from '@/types'

interface UseProspectosParams {
  loteId?: number | null
  importacionId?: number | null
  estado: string | null
  tipoProspectoId: number | null
  page: number
  perPage: number
}

export function useProspectos({
  loteId,
  importacionId,
  estado,
  tipoProspectoId,
  page,
  perPage,
}: UseProspectosParams) {
  const hasFilter = !!loteId || !!importacionId
  
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['prospectos', loteId, importacionId, estado, tipoProspectoId, page],
    queryFn: async () => {
      if (!hasFilter) {
        logger.log('useProspectos: No hay lote/importación seleccionada, no cargando prospectos')
        return null
      }

      try {
        logger.log('useProspectos: Cargando prospectos con filtros:', {
          loteId,
          importacionId,
          estado,
          tipoProspectoId,
          page,
          perPage,
        })

        const result = await prospectosService.getAll({
          lote_id: loteId || undefined,
          importacion_id: importacionId || undefined,
          estado: estado || undefined,
          tipo_prospecto_id: tipoProspectoId || undefined,
          page,
          per_page: perPage,
        })

        logger.log('useProspectos: Prospectos cargados:', result)
        return result
      } catch (err: any) {
        logger.error('useProspectos: Error fetching prospectos:', {
          status: err.response?.status,
          message: err.response?.data?.message || err.message,
        })
        throw err
      }
    },
    enabled: hasFilter, // Solo cargar si hay filtro
  })

  const prospectos = (data as PaginatedResponse<Prospecto> | null)?.data || []
  const total = (data as PaginatedResponse<Prospecto> | null)?.meta?.total || 0

  return {
    data: prospectos,
    total,
    isLoading,
    isError,
    error,
  }
}
