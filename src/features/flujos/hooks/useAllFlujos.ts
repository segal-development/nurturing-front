/**
 * Hook para cargar todos los flujos sin filtro de origen
 * Usado para el selector de flujos en la página principal
 */

import { useQuery } from '@tanstack/react-query'
import { flujosService } from '@/api/flujos.service'
import type { FlujoNurturing } from '@/types/flujo'

export function useAllFlujos() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['flujos-all'],
    queryFn: async () => {
      // Traer todos los flujos sin filtro de origen
      // Usamos un per_page alto para traer todos
      const result = await flujosService.getAll({
        per_page: 1000,
      })
      return result
    },
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
