/**
 * Componente para mostrar el progreso de un lote en tiempo real.
 * 
 * Se muestra como una barra flotante en la parte inferior de la pantalla
 * cuando hay un lote procesándose en background.
 * 
 * Features:
 * - Progreso general del lote (barra de progreso)
 * - Lista de archivos con su estado individual
 * - Se puede minimizar/expandir
 * - Se auto-oculta cuando el lote termina
 */

import { useState } from 'react'
import { 
  ChevronDown, 
  ChevronUp, 
  FileSpreadsheet, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  X,
  FolderOpen
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { useLoteStore, selectLoteActivo } from '@/stores/loteStore'
import type { LoteProgresoImportacion } from '@/types/lote'

/**
 * Formatea número con separador de miles
 */
const formatNumber = (num: number): string => {
  return num.toLocaleString('es-CL')
}

/**
 * Obtiene el ícono según el estado de la importación
 */
const getEstadoIcon = (estado: LoteProgresoImportacion['estado']) => {
  switch (estado) {
    case 'completado':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case 'procesando':
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
    case 'pendiente':
      return <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
    case 'fallido':
      return <AlertCircle className="h-4 w-4 text-red-500" />
    default:
      return <FileSpreadsheet className="h-4 w-4 text-gray-400" />
  }
}



/**
 * Componente de item de importación individual
 */
function ImportacionItem({ importacion }: { importacion: LoteProgresoImportacion }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {getEstadoIcon(importacion.estado)}
        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
          {importacion.nombre_archivo}
        </span>
      </div>
      
      <div className="flex items-center gap-3 shrink-0">
        {importacion.estado === 'procesando' && (
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            {importacion.progreso_porcentaje.toFixed(0)}%
          </span>
        )}
        
        {importacion.estado === 'completado' && (
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
            {formatNumber(importacion.registros_exitosos)} registros
          </span>
        )}
        
        {importacion.estado === 'fallido' && importacion.error && (
          <span className="text-xs text-red-600 dark:text-red-400 font-medium truncate max-w-[150px]" title={importacion.error}>
            Error
          </span>
        )}
        
        {importacion.estado === 'pendiente' && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            En cola
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Componente principal del tracker de lote
 */
export function LoteProgressTracker() {
  const [isExpanded, setIsExpanded] = useState(true)
  const loteActivo = useLoteStore(selectLoteActivo)
  const limpiarLote = useLoteStore(state => state.limpiarLote)
  
  // No mostrar si no hay lote activo
  if (!loteActivo) {
    return null
  }
  
  const {
    nombre,
    estado,
    totalArchivos,
    archivosCompletados,
    archivosProcesando,
    progresoPorcentaje,
    registrosExitosos,
    totalEstimado,
    importaciones,
  } = loteActivo
  
  // No mostrar si el lote ya está completado y limpio
  if (estado === 'completado' && importaciones.length === 0) {
    return null
  }
  
  const isTerminado = estado === 'completado' || estado === 'fallido'
  
  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <div className={`
        rounded-xl shadow-2xl border overflow-hidden
        ${isTerminado 
          ? estado === 'completado' 
            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
            : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
          : 'bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-700'
        }
      `}>
        {/* Header */}
        <div 
          className={`
            flex items-center justify-between px-4 py-3 cursor-pointer
            ${isTerminado 
              ? estado === 'completado'
                ? 'bg-green-100/50 dark:bg-green-900/30'
                : 'bg-red-100/50 dark:bg-red-900/30'
              : 'bg-gray-50 dark:bg-gray-800'
            }
          `}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className={`
              p-2 rounded-lg
              ${isTerminado 
                ? estado === 'completado'
                  ? 'bg-green-200 dark:bg-green-800'
                  : 'bg-red-200 dark:bg-red-800'
                : 'bg-blue-100 dark:bg-blue-900'
              }
            `}>
              {isTerminado ? (
                estado === 'completado' 
                  ? <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  : <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              ) : (
                <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-gray-500" />
                <span className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">
                  {nombre}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isTerminado ? (
                  estado === 'completado' 
                    ? `${formatNumber(registrosExitosos)} registros importados`
                    : 'Proceso con errores'
                ) : (
                  `${archivosCompletados} de ${totalArchivos} archivos • ${progresoPorcentaje.toFixed(0)}%`
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isTerminado && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  limpiarLote()
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Barra de progreso general */}
        {!isTerminado && (
          <div className="px-4 py-2 bg-white dark:bg-gray-900">
            <Progress 
              value={progresoPorcentaje} 
              className="h-2"
            />
          </div>
        )}
        
        {/* Lista de importaciones (expandible) */}
        {isExpanded && importaciones.length > 0 && (
          <div className="px-4 py-3 space-y-2 max-h-64 overflow-y-auto bg-gray-50/50 dark:bg-gray-800/50">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Archivos ({totalArchivos})
            </p>
            {importaciones.map((importacion) => (
              <ImportacionItem key={importacion.id} importacion={importacion} />
            ))}
          </div>
        )}
        
        {/* Footer con estadísticas */}
        {isExpanded && !isTerminado && (
          <div className="px-4 py-2 bg-gray-100/50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>
                {archivosProcesando > 0 && `${archivosProcesando} procesando`}
                {archivosProcesando > 0 && archivosCompletados > 0 && ' • '}
                {archivosCompletados > 0 && `${archivosCompletados} completados`}
              </span>
              <span>
                {formatNumber(registrosExitosos)} / {formatNumber(totalEstimado)} registros
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
