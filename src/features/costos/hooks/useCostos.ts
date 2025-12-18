/**
 * Hooks for cost management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { costosService } from '@/api/costos.service'

/**
 * Hook to get current pricing configuration
 */
export function usePrecios() {
  return useQuery({
    queryKey: ['costos', 'precios'],
    queryFn: () => costosService.getPrecios(),
    staleTime: 5 * 60 * 1000, // 5 minutes - prices don't change often
  })
}

/**
 * Hook to get estimated cost for a flow
 */
export function useCostoEstimado(flujoId: number | null, cantidadProspectos: number) {
  return useQuery({
    queryKey: ['costos', 'estimado', flujoId, cantidadProspectos],
    queryFn: () => {
      if (!flujoId) throw new Error('flujoId is required')
      return costosService.getCostoEstimado(flujoId, cantidadProspectos)
    },
    enabled: !!flujoId && cantidadProspectos > 0,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook to get cost for a specific execution
 */
export function useCostoEjecucion(ejecucionId: number | null) {
  return useQuery({
    queryKey: ['costos', 'ejecucion', ejecucionId],
    queryFn: () => {
      if (!ejecucionId) throw new Error('ejecucionId is required')
      return costosService.getCostoEjecucion(ejecucionId)
    },
    enabled: !!ejecucionId,
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Hook to get cost dashboard statistics
 */
export function useCostoDashboard(fechaInicio?: string, fechaFin?: string) {
  return useQuery({
    queryKey: ['costos', 'dashboard', fechaInicio, fechaFin],
    queryFn: () => costosService.getDashboard(fechaInicio, fechaFin),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook to recalculate cost for a completed execution
 */
export function useRecalcularCosto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ejecucionId: number) => costosService.recalcularCosto(ejecucionId),
    onSuccess: (_, ejecucionId) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['costos', 'ejecucion', ejecucionId] })
      queryClient.invalidateQueries({ queryKey: ['costos', 'dashboard'] })
    },
  })
}

/**
 * Helper hook to calculate cost for a node based on type
 */
export function useCostoNodo(tipo: 'email' | 'sms') {
  const { data: precios } = usePrecios()

  if (!precios) return null

  return costosService.getCostoNodo(tipo, precios)
}

/**
 * Helper function to format currency (for use outside React)
 */
export const formatCurrency = costosService.formatCurrency
export const formatCurrencyDecimal = costosService.formatCurrencyDecimal
