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

// ============================================================================
// Types
// ============================================================================

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
  iniciadoEn: number // timestamp
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

// ============================================================================
// Callbacks globales
// ============================================================================

// Callback que se ejecuta cuando un lote termina completamente
let onLoteCompleteCallback: ((loteId: number) => void) | null = null

export const setOnLoteComplete = (callback: ((loteId: number) => void) | null) => {
  onLoteCompleteCallback = callback
}

// Callback que se ejecuta cuando una importación individual termina
let onImportacionCompleteCallback: ((importacionId: number, loteId: number) => void) | null = null

export const setOnImportacionComplete = (callback: ((importacionId: number, loteId: number) => void) | null) => {
  onImportacionCompleteCallback = callback
}

// ============================================================================
// Variables de polling (fuera del store para evitar re-renders)
// ============================================================================

let pollingInterval: ReturnType<typeof setInterval> | null = null
let importacionesCompletadasPrevias = new Set<number>()

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Transforma la respuesta del API al formato del store
 */
function transformLoteProgreso(data: LoteProgreso, iniciadoEn: number): LoteEnProgreso {
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

/**
 * Formatea número con separador de miles
 */
function formatNumber(num: number): string {
  return num.toLocaleString('es-CL')
}

// ============================================================================
// Store
// ============================================================================

export const useLoteStore = create<LoteStore>((set, get) => ({
  loteActivo: null,
  isPolling: false,

  iniciarTrackingLote: (loteId, nombre) => {
    // Detener cualquier polling anterior
    get().detenerPolling()
    importacionesCompletadasPrevias.clear()
    
    set({
      loteActivo: {
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
        
        iniciadoEn: Date.now(),
        ultimaActualizacion: Date.now(),
      },
    })
    
    // Iniciar polling automáticamente
    get().iniciarPolling()
  },

  actualizarProgreso: (progreso) => {
    const { loteActivo } = get()
    if (!loteActivo) return
    
    // Detectar importaciones que acaban de completarse
    const importacionesCompletadasAhora = new Set(
      progreso.importaciones
        .filter(i => i.estado === 'completado')
        .map(i => i.id)
    )
    
    // Notificar por cada importación que terminó
    importacionesCompletadasAhora.forEach(importacionId => {
      if (!importacionesCompletadasPrevias.has(importacionId)) {
        const importacion = progreso.importaciones.find(i => i.id === importacionId)
        if (importacion && onImportacionCompleteCallback) {
          onImportacionCompleteCallback(importacionId, progreso.id)
        }
        
        // Toast individual por archivo completado
        if (importacion) {
          toast.success(`Archivo procesado`, {
            description: `"${importacion.nombre_archivo}" - ${formatNumber(importacion.registros_exitosos)} registros importados`,
            duration: 5000,
          })
        }
      }
    })
    
    importacionesCompletadasPrevias = importacionesCompletadasAhora
    
    set({
      loteActivo: transformLoteProgreso(progreso, loteActivo.iniciadoEn),
    })
  },

  finalizarLote: () => {
    const { loteActivo, detenerPolling } = get()
    
    detenerPolling()
    
    if (!loteActivo) return
    
    const loteId = loteActivo.id
    const estado = loteActivo.estado
    
    // Mostrar toast según resultado
    if (estado === 'completado') {
      toast.success('Carga completada', {
        description: `"${loteActivo.nombre}" - ${formatNumber(loteActivo.registrosExitosos)} registros importados en ${loteActivo.totalArchivos} archivo(s)`,
        duration: 8000,
      })
      
      // Ejecutar callback para invalidar queries
      if (onLoteCompleteCallback) {
        onLoteCompleteCallback(loteId)
      }
    } else if (estado === 'fallido') {
      const fallidos = loteActivo.archivosFallidos
      toast.error('Carga con errores', {
        description: `"${loteActivo.nombre}" - ${fallidos} archivo(s) fallaron. Revisa los detalles.`,
        duration: 10000,
      })
    }
    
    // Limpiar después de 5 segundos
    setTimeout(() => {
      get().limpiarLote()
    }, 5000)
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
        const response = await lotesService.getProgreso(state.loteActivo.id)
        const progreso = response.data
        
        state.actualizarProgreso(progreso)
        
        // Verificar si el lote terminó
        if (progreso.estado === 'completado' || progreso.estado === 'fallido') {
          state.finalizarLote()
        }
      } catch (error) {
        console.error('Error en polling de lote:', error)
        // No detener el polling por un error temporal
      }
    }, 3000) // Polling cada 3 segundos
  },

  detenerPolling: () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
    set({ isPolling: false })
  },
}))

// ============================================================================
// Selectores útiles (para evitar re-renders innecesarios)
// ============================================================================

export const selectLoteActivo = (state: LoteStore) => state.loteActivo
export const selectIsPolling = (state: LoteStore) => state.isPolling
export const selectHayLoteActivo = (state: LoteStore) => state.loteActivo !== null
export const selectProgresoPorcentaje = (state: LoteStore) => state.loteActivo?.progresoPorcentaje ?? 0
