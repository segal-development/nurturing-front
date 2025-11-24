/**
 * Hook para cargar prospectos filtrados por importación, estado y tipo
 * Solo carga si hay una importación seleccionada
 */

import { useQuery } from '@tanstack/react-query'
import { prospectosService } from '@/api/prospectos.service'
import type { Prospecto } from '../types/prospectos'
import type { PaginatedResponse } from '@/types/prospecto'

interface UseProspectosParams {
  importacionId: number | null
  estado: string | null
  tipoProspectoId: number | null
  page: number
  perPage: number
}

export function useProspectos({
  importacionId,
  estado,
  tipoProspectoId,
  page,
  perPage,
}: UseProspectosParams) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['prospectos', importacionId, estado, tipoProspectoId, page],
    queryFn: async () => {
      if (!importacionId) {
        console.log('⚠️ useProspectos: No hay importación seleccionada, no cargando prospectos')
        return null
      }

      try {
        console.log('📡 useProspectos: Cargando prospectos con filtros:', {
          importacionId,
          estado,
          tipoProspectoId,
          page,
          perPage,
        })

        const result = await prospectosService.getAll({
          importacion_id: importacionId,
          estado: estado || undefined,
          tipo_prospecto_id: tipoProspectoId || undefined,
          page,
          per_page: perPage,
        })

        console.log('✅ useProspectos: Prospectos cargados:', result)
        return result
      } catch (err: any) {
        console.error('❌ useProspectos: Error fetching prospectos:', {
          status: err.response?.status,
          message: err.response?.data?.message || err.message,
        })
        throw err
      }
    },
    enabled: !!importacionId, // Solo cargar si hay importación seleccionada
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
