/**
 * Hook para tracking de asignación de prospectos a flujos.
 *
 * Encapsula la lógica del store y provee una API simple para:
 * - Iniciar tracking cuando se crea un flujo async
 * - Mostrar progreso en tiempo real
 * - Reaccionar a la completación
 *
 * @example
 * const {
 *   flujoActivo,
 *   porcentaje,
 *   mensaje,
 *   iniciarTracking,
 *   hayFlujoActivo
 * } = useFlujoProcesamiento()
 *
 * // Al crear flujo con procesamiento async
 * if (response.resumen.procesamiento_async) {
 *   iniciarTracking(response.data.id, response.data.nombre, total)
 * }
 */

import { useEffect, useRef } from 'react'
import { logger } from '@/lib/logger'
import {
  useFlujoProcesamientoStore,
  selectFlujoActivo,
  selectHayFlujoActivo,
  selectPorcentajeProgreso,
  selectMensajeProgreso,
  selectEstadoProcesamiento,
  selectIsPolling,
  subscribeToFlujoComplete,
  type FlujoEnProcesamiento,
} from '@/stores/flujoProcesamientoStore'
import type { EstadoProcesamientoFlujo } from '@/types/flujoAsignacion'

// =============================================================================
// TIPOS
// =============================================================================

export interface UseFlujoProcesamiento {
  /** Flujo actualmente en procesamiento */
  flujoActivo: FlujoEnProcesamiento | null

  /** ¿Hay un flujo activo? */
  hayFlujoActivo: boolean

  /** ¿Está haciendo polling? */
  isPolling: boolean

  /** Porcentaje de progreso (0-100) */
  porcentaje: number

  /** Mensaje de estado actual */
  mensaje: string

  /** Estado de procesamiento */
  estado: EstadoProcesamientoFlujo | null

  /** Inicia tracking de un nuevo flujo */
  iniciarTracking: (flujoId: number, flujoNombre: string, totalProspectos: number) => void

  /** Detiene el tracking y limpia el estado */
  detenerTracking: () => void
}

export interface UseFlujoProcesaientoOptions {
  /**
   * Callback ejecutado cuando el flujo completa exitosamente.
   * Útil para refrescar datos o redirigir.
   */
  onComplete?: (flujoId: number) => void
}

// =============================================================================
// HOOK
// =============================================================================

export function useFlujoProcesamiento(
  options: UseFlujoProcesaientoOptions = {}
): UseFlujoProcesamiento {
  const { onComplete } = options

  // Selectores del store
  const flujoActivo = useFlujoProcesamientoStore(selectFlujoActivo)
  const hayFlujoActivo = useFlujoProcesamientoStore(selectHayFlujoActivo)
  const isPolling = useFlujoProcesamientoStore(selectIsPolling)
  const porcentaje = useFlujoProcesamientoStore(selectPorcentajeProgreso)
  const mensaje = useFlujoProcesamientoStore(selectMensajeProgreso)
  const estado = useFlujoProcesamientoStore(selectEstadoProcesamiento)

  // Acciones del store
  const storeIniciarTracking = useFlujoProcesamientoStore(
    (state) => state.iniciarTracking
  )
  const storeLimpiarFlujo = useFlujoProcesamientoStore(
    (state) => state.limpiarFlujo
  )

  // Keep a stable ref to onComplete so the useEffect doesn't re-subscribe on every render.
  // This avoids infinite loops when callers pass an inline arrow function.
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  // Suscripción al evento de completación
  useEffect(() => {
    if (!onCompleteRef.current) return

    const unsubscribe = subscribeToFlujoComplete((flujoId: number) => {
      onCompleteRef.current?.(flujoId)
    })

    return unsubscribe
  }, []) // stable — ref handles changes

  // Wrapper con validación
  const iniciarTracking = (flujoId: number, flujoNombre: string, totalProspectos: number) => {
    if (!flujoId || !flujoNombre) {
      logger.error('iniciarTracking: flujoId y flujoNombre son requeridos')
      return
    }

    if (totalProspectos <= 0) {
      logger.warn('iniciarTracking: totalProspectos debe ser > 0')
    }

    storeIniciarTracking(flujoId, flujoNombre, totalProspectos)
  }

  const detenerTracking = () => {
    storeLimpiarFlujo()
  }

  return {
    flujoActivo,
    hayFlujoActivo,
    isPolling,
    porcentaje,
    mensaje,
    estado,
    iniciarTracking,
    detenerTracking,
  }
}

// =============================================================================
// HOOK SIMPLIFICADO PARA SOLO LECTURA
// =============================================================================

/**
 * Hook simplificado para componentes que solo necesitan mostrar el estado.
 * No incluye funciones de control, solo datos.
 *
 * @example
 * const { hayFlujoActivo, porcentaje, mensaje } = useFlujoProcesanientoStatus()
 */
export function useFlujoProcesainientoStatus() {
  const flujoActivo = useFlujoProcesamientoStore(selectFlujoActivo)
  const hayFlujoActivo = useFlujoProcesamientoStore(selectHayFlujoActivo)
  const porcentaje = useFlujoProcesamientoStore(selectPorcentajeProgreso)
  const mensaje = useFlujoProcesamientoStore(selectMensajeProgreso)
  const estado = useFlujoProcesamientoStore(selectEstadoProcesamiento)

  return {
    flujoActivo,
    hayFlujoActivo,
    porcentaje,
    mensaje,
    estado,
  }
}
