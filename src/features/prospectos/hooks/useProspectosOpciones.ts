/**
 * Hook para cargar opciones de filtrado de prospectos (importaciones, estados, tipos)
 * 
 * Principios aplicados:
 * - Single Responsibility: Solo carga opciones de prospectos
 * - Naming: Nombre descriptivo que evita conflictos con otros hooks similares
 */

import { useQuery } from '@tanstack/react-query'
import { prospectosService } from '@/api/prospectos.service'
import type { OpcionesFiltrado } from '../types/prospectos'

// ============================================================================
// Types
// ============================================================================

interface UseProspectosOpcionesReturn {
  data: OpcionesFiltrado | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
}

// ============================================================================
// Query Key
// ============================================================================

export const prospectosOpcionesQueryKey = ['prospectos-opciones-filtrado'] as const

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook para cargar opciones de filtrado de prospectos
 * 
 * @returns Opciones de filtrado (importaciones, estados, tipos de prospecto)
 * 
 * @example
 * const { data: opciones, isLoading } = useProspectosOpciones()
 */
export function useProspectosOpciones(): UseProspectosOpcionesReturn {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: prospectosOpcionesQueryKey,
    queryFn: () => prospectosService.getOpciones(),
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
export const useOpciones = useProspectosOpciones
