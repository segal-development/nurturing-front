/**
 * Hook para cargar opciones de filtrado de flujos (orígenes y tipos de deudor)
 * 
 * Principios aplicados:
 * - Single Responsibility: Solo carga opciones de flujos
 * - Naming: Nombre descriptivo que evita conflictos con otros hooks similares
 */

import { useQuery } from '@tanstack/react-query'
import { flujosService } from '@/api/flujos.service'
import type { OpcionesFlujos } from '../types/flujos'

// ============================================================================
// Types
// ============================================================================

interface UseFlujoOpcionesReturn {
  data: OpcionesFlujos | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
}

// ============================================================================
// Query Key
// ============================================================================

export const flujoOpcionesQueryKey = ['flujos-opciones-filtrado'] as const

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook para cargar opciones de filtrado de flujos
 * 
 * @returns Opciones de filtrado (orígenes, tipos de deudor)
 * 
 * @example
 * const { data: opciones, isLoading } = useFlujoOpciones()
 */
export function useFlujoOpciones(): UseFlujoOpcionesReturn {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: flujoOpcionesQueryKey,
    queryFn: () => flujosService.getOpciones(),
    staleTime: 10 * 60 * 1000, // 10 minutos - opciones cambian poco
    gcTime: 30 * 60 * 1000,    // 30 minutos
  })

  return {
    data,
    isLoading,
    isError,
    error: error as Error | null,
  }
}

// Backward compatibility alias
export const useOpciones = useFlujoOpciones
