/**
 * Zustand store para tracking global de lotes en progreso.
 * 
 * ARQUITECTURA:
 * - Trackea el LOTE completo, no importaciones individuales
 * - Un lote puede tener múltiples importaciones procesándose en paralelo
 * - El polling consulta el endpoint de progreso del lote
 * - Cuando todas las importaciones del lote terminan, se notifica
 * 
 * SOLID Principles:
 * - Single Responsibility: Solo maneja estado de tracking de lotes
 * - Open/Closed: Extensible sin modificar (callbacks, eventos)
 */

import { create } from 'zustand'
import { lotesService } from '@/api/lotes.service'
import { toast } from 'sonner'
import type { LoteProgreso, LoteProgresoImportacion } from '@/types/lote'

// =============================================================================
// CONFIGURACION
// =============================================================================

const POLLING_INTERVAL_MS = 3000
const CLEANUP_DELAY_MS = 5000

// =============================================================================
// TIPOS
// =============================================================================

export interface LoteEnProgreso {
  id: number
  nombre: string
  estado: 'abierto' | 'procesando' | 'completado' | 'fallido'
  
  // Contadores de archivos
  totalArchivos: number
  archivosCompletados: number
  archivosProcesando: number
  archivosPendientes: number
  archivosFallidos: number
  
  // Contadores de registros
  totalRegistros: number
  registrosExitosos: number
  registrosFallidos: number
  totalEstimado: number
  progresoPorcentaje: number
  
  // Importaciones individuales
  importaciones: LoteProgresoImportacion[]
  
  // Metadata
  iniciadoEn: number
  ultimaActualizacion: number
}

interface LoteStore {
  // Estado
  loteActivo: LoteEnProgreso | null
  isPolling: boolean
  
  // Acciones
  iniciarTrackingLote: (loteId: number, nombre: string) => void
  actualizarProgreso: (progreso: LoteProgreso) => void
  finalizarLote: () => void
  limpiarLote: () => void
  
  // Polling
  iniciarPolling: () => void
  detenerPolling: () => void
}

// =============================================================================
// CALLBACKS GLOBALES
// =============================================================================

let onLoteCompleteCallback: ((loteId: number) => void) | null = null
let onImportacionCompleteCallback: ((importacionId: number, loteId: number) => void) | null = null

export const setOnLoteComplete = (callback: ((loteId: number) => void) | null) => {
  onLoteCompleteCallback = callback
}

export const setOnImportacionComplete = (callback: ((importacionId: number, loteId: number) => void) | null) => {
  onImportacionCompleteCallback = callback
}

// =============================================================================
// VARIABLES DE POLLING (fuera del store para evitar re-renders)
// =============================================================================

let pollingInterval: ReturnType<typeof setInterval> | null = null
let importacionesCompletadasPrevias = new Set<number>()

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatearNumero(num: number): string {
  return num.toLocaleString('es-CL')
}

function crearLoteInicial(loteId: number, nombre: string): LoteEnProgreso {
  const ahora = Date.now()
  return {
    id: loteId,
    nombre,
    estado: 'abierto',
    
    totalArchivos: 0,
    archivosCompletados: 0,
    archivosProcesando: 0,
    archivosPendientes: 0,
    archivosFallidos: 0,
    
    totalRegistros: 0,
    registrosExitosos: 0,
    registrosFallidos: 0,
    totalEstimado: 0,
    progresoPorcentaje: 0,
    
    importaciones: [],
    
    iniciadoEn: ahora,
    ultimaActualizacion: ahora,
  }
}

function transformarLoteProgreso(data: LoteProgreso, iniciadoEn: number): LoteEnProgreso {
  return {
    id: data.id,
    nombre: data.nombre,
    estado: data.estado,
    
    totalArchivos: data.total_archivos,
    archivosCompletados: data.archivos_completados,
    archivosProcesando: data.archivos_procesando,
    archivosPendientes: data.archivos_pendientes,
    archivosFallidos: data.archivos_fallidos,
    
    totalRegistros: data.total_registros,
    registrosExitosos: data.registros_exitosos,
    registrosFallidos: data.registros_fallidos,
    totalEstimado: data.total_estimado,
    progresoPorcentaje: data.progreso_porcentaje,
    
    importaciones: data.importaciones,
    
    iniciadoEn,
    ultimaActualizacion: Date.now(),
  }
}

// =============================================================================
// NOTIFICACIONES
// =============================================================================

function notificarImportacionCompletada(
  importacion: LoteProgresoImportacion,
  loteId: number
): void {
  onImportacionCompleteCallback?.(importacion.id, loteId)
  
  toast.success('Archivo procesado', {
    description: `"${importacion.nombre_archivo}" - ${formatearNumero(importacion.registros_exitosos)} registros importados`,
    duration: 5000,
  })
}

function notificarLoteCompletado(lote: LoteEnProgreso): void {
  toast.success('Carga completada', {
    description: `"${lote.nombre}" - ${formatearNumero(lote.registrosExitosos)} registros importados en ${lote.totalArchivos} archivo(s)`,
    duration: 8000,
  })
  
  onLoteCompleteCallback?.(lote.id)
}

function notificarLoteFallido(lote: LoteEnProgreso): void {
  toast.error('Carga con errores', {
    description: `"${lote.nombre}" - ${lote.archivosFallidos} archivo(s) fallaron. Revisa los detalles.`,
    duration: 10000,
  })
}

// =============================================================================
// DETECCION DE IMPORTACIONES COMPLETADAS
// =============================================================================

function detectarImportacionesCompletadas(
  progreso: LoteProgreso
): Set<number> {
  return new Set(
    progreso.importaciones
      .filter(i => i.estado === 'completado')
      .map(i => i.id)
  )
}

function procesarImportacionesRecienCompletadas(
  progreso: LoteProgreso,
  completadasAhora: Set<number>
): void {
  completadasAhora.forEach(importacionId => {
    if (importacionesCompletadasPrevias.has(importacionId)) return
    
    const importacion = progreso.importaciones.find(i => i.id === importacionId)
    if (importacion) {
      notificarImportacionCompletada(importacion, progreso.id)
    }
  })
  
  importacionesCompletadasPrevias = completadasAhora
}

// =============================================================================
// STORE
// =============================================================================

export const useLoteStore = create<LoteStore>((set, get) => ({
  loteActivo: null,
  isPolling: false,

  iniciarTrackingLote: (loteId, nombre) => {
    get().detenerPolling()
    importacionesCompletadasPrevias.clear()
    
    set({ loteActivo: crearLoteInicial(loteId, nombre) })
    get().iniciarPolling()
  },

  actualizarProgreso: (progreso) => {
    const { loteActivo } = get()
    if (!loteActivo) return
    
    const completadasAhora = detectarImportacionesCompletadas(progreso)
    procesarImportacionesRecienCompletadas(progreso, completadasAhora)
    
    set({
      loteActivo: transformarLoteProgreso(progreso, loteActivo.iniciadoEn),
    })
  },

  finalizarLote: () => {
    const { loteActivo, detenerPolling, limpiarLote } = get()
    
    detenerPolling()
    
    if (!loteActivo) return
    
    if (loteActivo.estado === 'completado') {
      notificarLoteCompletado(loteActivo)
    } else if (loteActivo.estado === 'fallido') {
      notificarLoteFallido(loteActivo)
    }
    
    setTimeout(limpiarLote, CLEANUP_DELAY_MS)
  },

  limpiarLote: () => {
    get().detenerPolling()
    importacionesCompletadasPrevias.clear()
    set({ loteActivo: null })
  },

  iniciarPolling: () => {
    const { isPolling, loteActivo } = get()
    
    if (isPolling || !loteActivo) return
    
    set({ isPolling: true })

    pollingInterval = setInterval(async () => {
      const state = get()
      if (!state.loteActivo) {
        state.detenerPolling()
        return
      }

      try {
        await procesarPolling(state)
      } catch (error) {
        console.error('Error en polling de lote:', error)
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
// POLLING LOGIC (extraida para claridad)
// =============================================================================

async function procesarPolling(state: LoteStore): Promise<void> {
  const { loteActivo } = state
  if (!loteActivo) return

  const response = await lotesService.getProgreso(loteActivo.id)
  const progreso = response.data
  
  state.actualizarProgreso(progreso)
  
  if (progreso.estado === 'completado' || progreso.estado === 'fallido') {
    state.finalizarLote()
  }
}

// =============================================================================
// SELECTORES
// =============================================================================

export const selectLoteActivo = (state: LoteStore) => state.loteActivo
export const selectIsPolling = (state: LoteStore) => state.isPolling
export const selectHayLoteActivo = (state: LoteStore) => state.loteActivo !== null
export const selectProgresoPorcentaje = (state: LoteStore) => state.loteActivo?.progresoPorcentaje ?? 0
