/**
 * Zustand store para tracking global de importaciones en progreso.
 * Permite mostrar el estado de importaciones en cualquier parte de la UI,
 * incluso si el usuario cierra el modal de carga.
 */

import { create } from 'zustand'
import { importacionesService } from '@/api/importaciones.service'
import type { ImportacionProgreso } from '@/types/importacion'
import { toast } from 'sonner'

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
  iniciadoEn: number // timestamp
  error?: string
}

// Callback global que se ejecuta cuando una importación termina
// Se registra desde el componente que necesita invalidar queries
let onImportacionCompleteCallback: ((importacionId: number) => void) | null = null

export const setOnImportacionComplete = (callback: ((importacionId: number) => void) | null) => {
  onImportacionCompleteCallback = callback
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

// Variables para el polling (fuera del store para evitar re-renders)
let pollingInterval: NodeJS.Timeout | null = null
let lastProcessed = 0
let lastTime = Date.now()

export const useImportacionStore = create<ImportacionStore>((set, get) => ({
  importacionActiva: null,
  isPolling: false,

  iniciarImportacion: (id, nombreArchivo, totalEstimado = 0) => {
    set({
      importacionActiva: {
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
      },
    })
    
    // Iniciar polling automáticamente
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
    const { importacionActiva, detenerPolling } = get()
    
    detenerPolling()
    
    if (!importacionActiva) return

    const importacionId = importacionActiva.id

    // Mostrar toast según resultado
    if (estado === 'completado') {
      toast.success('Importación completada', {
        description: `Se importaron ${importacionActiva.registrosExitosos.toLocaleString('es-CL')} registros exitosamente${importacionActiva.registrosFallidos > 0 ? ` (${importacionActiva.registrosFallidos} fallidos)` : ''}.`,
        duration: 8000,
      })
      
      // Ejecutar callback para invalidar queries (si está registrado)
      if (onImportacionCompleteCallback) {
        onImportacionCompleteCallback(importacionId)
      }
    } else {
      toast.error('Importación fallida', {
        description: error || 'Ocurrió un error durante la importación.',
        duration: 10000,
      })
    }

    set((state) => ({
      importacionActiva: state.importacionActiva
        ? { ...state.importacionActiva, estado, error }
        : null,
    }))

    // Limpiar después de 5 segundos si completó
    if (estado === 'completado') {
      setTimeout(() => {
        get().limpiarImportacion()
      }, 5000)
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
        const progreso = await importacionesService.getProgreso(state.importacionActiva.id)
        
        // Calcular velocidad
        const currentTime = Date.now()
        const timeDiff = (currentTime - lastTime) / 1000
        const processedDiff = (progreso.total_registros || 0) - lastProcessed
        const speed = timeDiff > 0 ? Math.round(processedDiff / timeDiff) : 0
        
        // Calcular tiempo restante
        const estimated = progreso.metadata?.total_estimado || state.importacionActiva.totalEstimado
        const remaining = estimated - (progreso.total_registros || 0)
        let tiempoRestante: string | null = null
        
        if (speed > 0 && remaining > 0) {
          const secondsRemaining = Math.round(remaining / speed)
          if (secondsRemaining > 3600) {
            const hours = Math.floor(secondsRemaining / 3600)
            const minutes = Math.floor((secondsRemaining % 3600) / 60)
            tiempoRestante = `${hours}h ${minutes}m`
          } else if (secondsRemaining > 60) {
            const minutes = Math.floor(secondsRemaining / 60)
            const seconds = secondsRemaining % 60
            tiempoRestante = `${minutes}m ${seconds}s`
          } else {
            tiempoRestante = `${secondsRemaining}s`
          }
        }

        lastProcessed = progreso.total_registros || 0
        lastTime = currentTime

        // Actualizar estado
        state.actualizarProgreso({
          estado: progreso.estado,
          progreso: progreso.progreso_porcentaje,
          totalRegistros: progreso.total_registros || 0,
          registrosExitosos: progreso.registros_exitosos || 0,
          registrosFallidos: progreso.registros_fallidos || 0,
          totalEstimado: estimated,
          velocidad: speed > 0 ? speed : state.importacionActiva.velocidad,
          tiempoRestante,
        })

        // Verificar si terminó
        if (progreso.estado === 'completado' || progreso.estado === 'fallido') {
          state.finalizarImportacion(
            progreso.estado,
            progreso.metadata?.error
          )
        }
      } catch (error) {
        console.error('Error en polling de importación:', error)
        // No detener el polling por un error temporal
      }
    }, 2000) // Polling cada 2 segundos
  },

  detenerPolling: () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
    set({ isPolling: false })
  },
}))
