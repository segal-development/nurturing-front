/**
 * Zustand store para tracking de asignación de prospectos a flujos.
 *
 * Cuando se crean flujos con >100 prospectos, el backend procesa en background.
 * Este store maneja el polling del progreso y notifica al completar.
 *
 * @see Backend: AsignarProspectosAFlujoJob
 * @see Endpoint: GET /flujos/{flujo}/progreso
 */

import { create } from 'zustand'
import { toast } from 'sonner'
import { flujosService } from '@/api/flujos.service'
import type {
  EstadoProcesamientoFlujo,
  ProgresoAsignacion,
  FlujoProgresoResponse,
} from '@/types/flujoAsignacion'
import {
  isProcesamientoTerminado,
  formatTiempoRestante,
  PROGRESO_ASIGNACION_VACIO,
} from '@/types/flujoAsignacion'

// =============================================================================
// CONFIGURACIÓN
// =============================================================================

const POLLING_INTERVAL_MS = 2000
const CLEANUP_DELAY_MS = 3000

// =============================================================================
// TIPOS
// =============================================================================

/**
 * Flujo actualmente en procesamiento de asignación.
 */
export interface FlujoEnProcesamiento {
  readonly flujoId: number
  readonly flujoNombre: string
  readonly estado: EstadoProcesamientoFlujo
  readonly progreso: ProgresoAsignacion
  readonly mensaje: string
  readonly iniciadoEn: number
  readonly error?: string
}

/**
 * Estado del store.
 */
interface FlujoProcesamientoState {
  /** Flujo actualmente en procesamiento (null si ninguno) */
  flujoActivo: FlujoEnProcesamiento | null
  /** ¿Está el polling activo? */
  isPolling: boolean
}

/**
 * Acciones del store.
 */
interface FlujoProcesamientoActions {
  /** Inicia el tracking de un nuevo flujo */
  iniciarTracking: (flujoId: number, flujoNombre: string, totalProspectos: number) => void
  /** Actualiza el progreso desde el backend */
  actualizarProgreso: (response: FlujoProgresoResponse) => void
  /** Finaliza el tracking (exitoso o fallido) */
  finalizarTracking: (estado: 'completado' | 'fallido', error?: string) => void
  /** Limpia el flujo activo */
  limpiarFlujo: () => void
  /** Inicia el polling */
  iniciarPolling: () => void
  /** Detiene el polling */
  detenerPolling: () => void
}

type FlujoProcesamientoStore = FlujoProcesamientoState & FlujoProcesamientoActions

// =============================================================================
// CALLBACK GLOBAL
// =============================================================================

type OnFlujoCompleteCallback = (flujoId: number) => void

let onFlujoCompleteCallback: OnFlujoCompleteCallback | null = null

/**
 * Registra un callback que se ejecuta cuando un flujo completa su procesamiento.
 * Útil para refrescar tablas o mostrar notificaciones personalizadas.
 */
export function setOnFlujoProcesamientoComplete(
  callback: OnFlujoCompleteCallback | null
): void {
  onFlujoCompleteCallback = callback
}

// =============================================================================
// VARIABLES DE POLLING (fuera del store para evitar re-renders)
// =============================================================================

let pollingInterval: ReturnType<typeof setInterval> | null = null

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function crearFlujoInicial(
  flujoId: number,
  flujoNombre: string,
  totalProspectos: number
): FlujoEnProcesamiento {
  return {
    flujoId,
    flujoNombre,
    estado: 'procesando',
    progreso: {
      ...PROGRESO_ASIGNACION_VACIO,
      total: totalProspectos,
    },
    mensaje: 'Iniciando asignación de prospectos...',
    iniciadoEn: Date.now(),
  }
}

function formatearNumero(num: number): string {
  return num.toLocaleString('es-CL')
}

function construirMensajeCompletado(flujo: FlujoEnProcesamiento): string {
  const { progreso, flujoNombre } = flujo
  const duracion = formatTiempoRestante(progreso.segundos_transcurridos)
  const total = formatearNumero(progreso.procesados)

  return duracion
    ? `${total} prospectos asignados a "${flujoNombre}" en ${duracion}`
    : `${total} prospectos asignados a "${flujoNombre}"`
}

function mostrarToastCompletado(flujo: FlujoEnProcesamiento): void {
  toast.success('Flujo listo', {
    description: construirMensajeCompletado(flujo),
    duration: 6000,
  })
}

function mostrarToastFallido(flujoNombre: string, error?: string): void {
  toast.error('Error en asignación', {
    description: error || `Falló la asignación de prospectos a "${flujoNombre}"`,
    duration: 8000,
  })
}

// =============================================================================
// STORE
// =============================================================================

export const useFlujoProcesamientoStore = create<FlujoProcesamientoStore>(
  (set, get) => ({
    // Estado inicial
    flujoActivo: null,
    isPolling: false,

    // Acciones
    iniciarTracking: (flujoId, flujoNombre, totalProspectos) => {
      // Early return si ya hay un flujo activo
      const { flujoActivo, detenerPolling } = get()
      if (flujoActivo) {
        console.warn(`Ya hay un flujo en procesamiento: ${flujoActivo.flujoId}`)
        detenerPolling()
      }

      set({
        flujoActivo: crearFlujoInicial(flujoId, flujoNombre, totalProspectos),
      })

      get().iniciarPolling()
    },

    actualizarProgreso: (response) => {
      const { data } = response

      set((state) => {
        if (!state.flujoActivo) return state

        return {
          flujoActivo: {
            ...state.flujoActivo,
            estado: data.estado,
            progreso: data.progreso,
            mensaje: data.mensaje,
          },
        }
      })

      // Verificar si terminó
      if (isProcesamientoTerminado(data.estado)) {
        const estado = data.completado ? 'completado' : 'fallido'
        get().finalizarTracking(estado)
      }
    },

    finalizarTracking: (estado, error) => {
      const { flujoActivo, detenerPolling, limpiarFlujo } = get()

      detenerPolling()

      if (!flujoActivo) return

      // Notificaciones
      if (estado === 'completado') {
        mostrarToastCompletado(flujoActivo)
        onFlujoCompleteCallback?.(flujoActivo.flujoId)
      } else {
        mostrarToastFallido(flujoActivo.flujoNombre, error)
      }

      // Actualizar estado final
      set((state) => ({
        flujoActivo: state.flujoActivo
          ? { ...state.flujoActivo, estado, error }
          : null,
      }))

      // Cleanup automático si fue exitoso
      if (estado === 'completado') {
        setTimeout(limpiarFlujo, CLEANUP_DELAY_MS)
      }
    },

    limpiarFlujo: () => {
      get().detenerPolling()
      set({ flujoActivo: null })
    },

    iniciarPolling: () => {
      const { isPolling, flujoActivo } = get()

      // Early returns
      if (isPolling) return
      if (!flujoActivo) return

      set({ isPolling: true })

      pollingInterval = setInterval(async () => {
        const state = get()

        if (!state.flujoActivo) {
          state.detenerPolling()
          return
        }

        try {
          await ejecutarPolling(state)
        } catch (error) {
          console.error('Error en polling de flujo:', error)
          // No detener por errores temporales de red
        }
      }, POLLING_INTERVAL_MS)
    },

    detenerPolling: () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
        pollingInterval = null
      }
      set({ isPolling: false })
    },
  })
)

// =============================================================================
// POLLING LOGIC (extraída para claridad)
// =============================================================================

async function ejecutarPolling(state: FlujoProcesamientoStore): Promise<void> {
  const { flujoActivo, actualizarProgreso } = state

  if (!flujoActivo) return

  const response = await flujosService.getProgresoAsignacion(flujoActivo.flujoId)
  actualizarProgreso(response)
}

// =============================================================================
// SELECTORES
// =============================================================================

/** Selector: flujo activo */
export const selectFlujoActivo = (
  state: FlujoProcesamientoStore
): FlujoEnProcesamiento | null => state.flujoActivo

/** Selector: ¿hay flujo activo? */
export const selectHayFlujoActivo = (state: FlujoProcesamientoStore): boolean =>
  state.flujoActivo !== null

/** Selector: ¿está haciendo polling? */
export const selectIsPolling = (state: FlujoProcesamientoStore): boolean =>
  state.isPolling

/** Selector: porcentaje de progreso */
export const selectPorcentajeProgreso = (state: FlujoProcesamientoStore): number =>
  state.flujoActivo?.progreso.porcentaje ?? 0

/** Selector: mensaje de estado actual */
export const selectMensajeProgreso = (state: FlujoProcesamientoStore): string =>
  state.flujoActivo?.mensaje ?? ''

/** Selector: estado de procesamiento */
export const selectEstadoProcesamiento = (
  state: FlujoProcesamientoStore
): EstadoProcesamientoFlujo | null => state.flujoActivo?.estado ?? null
