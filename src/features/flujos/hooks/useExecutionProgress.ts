/**
 * Hook para obtener progreso de ejecución de flujo con optimismo
 * Implementa React 19 useOptimistic para mejor UX
 * - Actualización inmediata en UI
 * - Fallback a datos previos si hay error
 * - Auto-refresh configurable
 */

import { useCallback, useEffect, useOptimistic, useRef, useState } from 'react'
import { flujosService } from '@/api/flujos.service'
import type { EjecucionFlujo } from '@/types/flujo'

interface ExecutionProgressState {
  isLoading: boolean
  isError: boolean
  errorMessage: string | null
}

interface UseExecutionProgressParams {
  flujoId: number | null
  ejecucionId: number | null
  enableAutoRefresh?: boolean
  refreshIntervalMs?: number
}

interface UseExecutionProgressReturn {
  execution: EjecucionFlujo | null
  optimisticExecution: EjecucionFlujo | null
  state: ExecutionProgressState
  refresh: () => Promise<void>
  toggleAutoRefresh: () => void
  isAutoRefreshEnabled: boolean
}

/**
 * Valor inicial para optimismo
 */
const createInitialExecution = (flujoId: number): EjecucionFlujo => ({
  id: 0,
  flujo_id: flujoId,
  estado: 'en_progreso' as const,
  fecha_inicio: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  stats: {
    total_prospectos: 0,
    total_enviados: 0,
    total_fallidos: 0,
    total_pendientes: 0,
    email_enviados: 0,
    email_fallidos: 0,
    sms_enviados: 0,
    sms_fallidos: 0,
    porcentaje_completado: 0,
  },
})

export function useExecutionProgress({
  flujoId,
  ejecucionId,
  enableAutoRefresh = true,
  refreshIntervalMs = 5000,
}: UseExecutionProgressParams): UseExecutionProgressReturn {
  // Validación de entrada
  const hasValidIds = flujoId !== null && ejecucionId !== null
  const initialExecution = hasValidIds ? createInitialExecution(flujoId) : null

  // Estado real del servidor
  const [execution, setExecution] = useState<EjecucionFlujo | null>(initialExecution)

  // Estado de UI
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(enableAutoRefresh)

  // Ref para cleanup de intervals
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Optimismo: muestra datos previos mientras carga
  const [optimisticExecution] = useOptimistic(
    execution,
    (currentExecution) => currentExecution
  )

  /**
   * Valida si la ejecución está completa
   */
  const isExecutionComplete = useCallback((exec: EjecucionFlujo | null): boolean => {
    if (!exec) return false
    return exec.estado === 'completado' || exec.estado === 'fallido'
  }, [])

  /**
   * Obtiene datos de progreso del backend
   * Manejo robusto de errores con early returns
   */
  const fetchExecutionProgress = useCallback(async () => {
    // Early return: IDs inválidos
    if (!hasValidIds || !flujoId || !ejecucionId) {
      return
    }

    setIsLoading(true)
    setIsError(false)
    setErrorMessage(null)

    try {
      const data = await flujosService.obtenerProgreso(ejecucionId)
      setExecution(data)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      setErrorMessage(`Error al obtener progreso: ${errorMsg}`)
      setIsError(true)
      console.error('❌ Error fetching execution progress:', { flujoId, ejecucionId, error })
    } finally {
      setIsLoading(false)
    }
  }, [flujoId, ejecucionId, hasValidIds])

  /**
   * Maneja auto-refresh con limpieza apropiada
   */
  useEffect(() => {
    // Early return si no hay IDs válidos
    if (!hasValidIds) {
      return
    }

    // Fetch inicial
    fetchExecutionProgress()

    // Configurar interval solo si auto-refresh está habilitado y no está completo
    if (autoRefreshEnabled && !isExecutionComplete(execution)) {
      refreshIntervalRef.current = setInterval(() => {
        fetchExecutionProgress()
      }, refreshIntervalMs)
    }

    // Cleanup
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [hasValidIds, autoRefreshEnabled, execution, fetchExecutionProgress, refreshIntervalMs, isExecutionComplete])

  /**
   * Obtiene datos manualmente (útil para botones de refresh)
   */
  const refresh = useCallback(async () => {
    await fetchExecutionProgress()
  }, [fetchExecutionProgress])

  /**
   * Alterna auto-refresh
   */
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled((prev) => !prev)
  }, [])

  return {
    execution,
    optimisticExecution: optimisticExecution || execution,
    state: {
      isLoading,
      isError,
      errorMessage,
    },
    refresh,
    toggleAutoRefresh,
    isAutoRefreshEnabled: autoRefreshEnabled,
  }
}
