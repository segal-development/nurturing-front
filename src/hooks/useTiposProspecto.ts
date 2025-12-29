/**
 * Hook for fetching tipos de prospecto (debt categories)
 * Used to dynamically categorize prospects by debt amount
 */

import { tiposProspectoService, type TipoProspecto } from '@/api/tiposProspecto.service'
import { useQuery } from '@tanstack/react-query'

// Query key for caching
const TIPOS_PROSPECTO_KEY = ['tipos-prospecto']

/**
 * Fetch all tipos de prospecto from backend
 * Cached for 5 minutes since these rarely change
 */
export function useTiposProspecto() {
  return useQuery<TipoProspecto[]>({
    queryKey: TIPOS_PROSPECTO_KEY,
    queryFn: () => tiposProspectoService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  })
}

/**
 * Helper to find tipo de prospecto by monto
 */
export function findTipoByMonto(tipos: TipoProspecto[], monto: number): TipoProspecto | undefined {
  return tipos.find((tipo) => {
    const minOk = tipo.monto_min === null || monto >= tipo.monto_min
    const maxOk = tipo.monto_max === null || monto <= tipo.monto_max
    return minOk && maxOk
  })
}
