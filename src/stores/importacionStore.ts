/**
 * Zustand store para tracking global de importaciones en progreso.
 * 
 * Permite mostrar el estado de importaciones en cualquier parte de la UI,
 * incluso si el usuario cierra el modal de carga.
 * 
 * NOTA: Este store se usa para importaciones INDIVIDUALES (legacy).
 * Para lotes con múltiples archivos, usar loteStore.ts
 */

import { create } from 'zustand'
import { importacionesService } from '@/api/importaciones.service'
import { toast } from 'sonner'

// =============================================================================
// CONFIGURACIÓN
// =============================================================================

const POLLING_INTERVAL_MS = 2000
const CLEANUP_DELAY_MS = 5000

// =============================================================================
// TIPOS
// =============================================================================

export interface ImportacionEnProgreso {
  id: number
  nombreArchivo: string
  estado: 'pendiente' | 'procesando' | 'completado' | 'fallido'
  progreso: number
  totalRegistros: number
  registrosExitosos: number
  registrosFallidos: number
  totalEstimado: number
  velocidad: number
  tiempoRestante: string | null
  iniciadoEn: number
  error?: string
}

interface ImportacionStore {
  // Estado
  importacionActiva: ImportacionEnProgreso | null
  isPolling: boolean
  
  // Acciones
  iniciarImportacion: (id: number, nombreArchivo: string, totalEstimado?: number) => void
  actualizarProgreso: (progreso: Partial<ImportacionEnProgreso>) => void
  finalizarImportacion: (estado: 'completado' | 'fallido', error?: string) => void
  limpiarImportacion: () => void
  
  // Polling
  iniciarPolling: () => void
  detenerPolling: () => void
}

// =============================================================================
// CALLBACK GLOBAL
// =============================================================================

let onImportacionCompleteCallback: ((importacionId: number) => void) | null = null

export const setOnImportacionComplete = (callback: ((importacionId: number) => void) | null) => {
  onImportacionCompleteCallback = callback
}

// =============================================================================
// VARIABLES DE POLLING (fuera del store para evitar re-renders)
// =============================================================================

let pollingInterval: ReturnType<typeof setInterval> | null = null
let lastProcessed = 0
let lastTime = Date.now()

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function crearImportacionInicial(
  id: number,
  nombreArchivo: string,
  totalEstimado: number
): ImportacionEnProgreso {
  return {
    id,
    nombreArchivo,
    estado: 'pendiente',
    progreso: 0,
    totalRegistros: 0,
    registrosExitosos: 0,
    registrosFallidos: 0,
    totalEstimado,
    velocidad: 0,
    tiempoRestante: null,
    iniciadoEn: Date.now(),
  }
}

function calcularVelocidad(processedDiff: number, timeDiffMs: number): number {
  const timeDiffSeconds = timeDiffMs / 1000
  return timeDiffSeconds > 0 ? Math.round(processedDiff / timeDiffSeconds) : 0
}

function formatearTiempoRestante(segundos: number): string {
  if (segundos > 3600) {
    const hours = Math.floor(segundos / 3600)
    const minutes = Math.floor((segundos % 3600) / 60)
    return `${hours}h ${minutes}m`
  }
  
  if (segundos > 60) {
    const minutes = Math.floor(segundos / 60)
    const secs = segundos % 60
    return `${minutes}m ${secs}s`
  }
  
  return `${segundos}s`
}

function calcularTiempoRestante(
  speed: number,
  estimated: number,
  totalRegistros: number
): string | null {
  if (speed <= 0) return null
  
  const remaining = estimated - totalRegistros
  if (remaining <= 0) return null
  
  const secondsRemaining = Math.round(remaining / speed)
  return formatearTiempoRestante(secondsRemaining)
}

function formatearNumero(num: number): string {
  return num.toLocaleString('es-CL')
}

function mostrarToastCompletado(importacion: ImportacionEnProgreso): void {
  const fallidos = importacion.registrosFallidos
  const mensaje = fallidos > 0
    ? `Se importaron ${formatearNumero(importacion.registrosExitosos)} registros exitosamente (${fallidos} fallidos).`
    : `Se importaron ${formatearNumero(importacion.registrosExitosos)} registros exitosamente.`
  
  toast.success('Importacion completada', {
    description: mensaje,
    duration: 8000,
  })
}

function mostrarToastFallido(error?: string): void {
  toast.error('Importacion fallida', {
    description: error || 'Ocurrio un error durante la importacion.',
    duration: 10000,
  })
}

// =============================================================================
// STORE
// =============================================================================

export const useImportacionStore = create<ImportacionStore>((set, get) => ({
  importacionActiva: null,
  isPolling: false,

  iniciarImportacion: (id, nombreArchivo, totalEstimado = 0) => {
    set({
      importacionActiva: crearImportacionInicial(id, nombreArchivo, totalEstimado),
    })
    get().iniciarPolling()
  },

  actualizarProgreso: (progreso) => {
    set((state) => ({
      importacionActiva: state.importacionActiva
        ? { ...state.importacionActiva, ...progreso }
        : null,
    }))
  },

  finalizarImportacion: (estado, error) => {
    const { importacionActiva, detenerPolling, limpiarImportacion } = get()
    
    detenerPolling()
    
    if (!importacionActiva) return

    if (estado === 'completado') {
      mostrarToastCompletado(importacionActiva)
      onImportacionCompleteCallback?.(importacionActiva.id)
    } else {
      mostrarToastFallido(error)
    }

    set((state) => ({
      importacionActiva: state.importacionActiva
        ? { ...state.importacionActiva, estado, error }
        : null,
    }))

    if (estado === 'completado') {
      setTimeout(limpiarImportacion, CLEANUP_DELAY_MS)
    }
  },

  limpiarImportacion: () => {
    get().detenerPolling()
    set({ importacionActiva: null })
  },

  iniciarPolling: () => {
    const { isPolling, importacionActiva } = get()
    
    if (isPolling || !importacionActiva) return
    
    set({ isPolling: true })
    lastProcessed = 0
    lastTime = Date.now()

    pollingInterval = setInterval(async () => {
      const state = get()
      if (!state.importacionActiva) {
        state.detenerPolling()
        return
      }

      try {
        await procesarPolling(state)
      } catch (error) {
        console.error('Error en polling de importacion:', error)
        // No detener el polling por un error temporal
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
}))

// =============================================================================
// POLLING LOGIC (extraída para claridad)
// =============================================================================

async function procesarPolling(state: ImportacionStore): Promise<void> {
  const { importacionActiva } = state
  if (!importacionActiva) return

  const progreso = await importacionesService.getProgreso(importacionActiva.id)
  
  const currentTime = Date.now()
  const timeDiff = currentTime - lastTime
  const processedDiff = (progreso.total_registros || 0) - lastProcessed
  const speed = calcularVelocidad(processedDiff, timeDiff)
  
  const estimated = progreso.metadata?.total_estimado || importacionActiva.totalEstimado
  const tiempoRestante = calcularTiempoRestante(speed, estimated, progreso.total_registros || 0)

  lastProcessed = progreso.total_registros || 0
  lastTime = currentTime

  state.actualizarProgreso({
    estado: progreso.estado,
    progreso: progreso.progreso_porcentaje,
    totalRegistros: progreso.total_registros || 0,
    registrosExitosos: progreso.registros_exitosos || 0,
    registrosFallidos: progreso.registros_fallidos || 0,
    totalEstimado: estimated,
    velocidad: speed > 0 ? speed : importacionActiva.velocidad,
    tiempoRestante,
  })

  if (progreso.estado === 'completado' || progreso.estado === 'fallido') {
    state.finalizarImportacion(progreso.estado, progreso.metadata?.error)
  }
}

// =============================================================================
// SELECTORES
// =============================================================================

export const selectImportacionActiva = (state: ImportacionStore) => state.importacionActiva
export const selectIsPolling = (state: ImportacionStore) => state.isPolling
export const selectHayImportacionActiva = (state: ImportacionStore) => state.importacionActiva !== null
