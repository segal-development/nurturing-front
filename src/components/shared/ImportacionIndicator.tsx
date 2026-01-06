/**
 * Indicador global de importación en progreso.
 * Se muestra en el header cuando hay una importación activa.
 */

import { useState } from 'react'
import { Loader2, CheckCircle2, XCircle, ChevronDown, ChevronUp, X } from 'lucide-react'
import { useImportacionStore } from '@/stores/importacionStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function ImportacionIndicator() {
  const { importacionActiva, limpiarImportacion } = useImportacionStore()
  const [expanded, setExpanded] = useState(false)

  if (!importacionActiva) return null

  const { estado, progreso, totalRegistros, registrosExitosos, registrosFallidos, velocidad, tiempoRestante, nombreArchivo, totalEstimado } = importacionActiva

  const isProcessing = estado === 'procesando' || estado === 'pendiente'
  const isCompleted = estado === 'completado'
  const isFailed = estado === 'fallido'

  return (
    <div className={cn(
      'relative flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all duration-300',
      isProcessing && 'border-segal-blue/30 bg-segal-blue/5 text-segal-blue',
      isCompleted && 'border-segal-green/30 bg-segal-green/5 text-segal-green',
      isFailed && 'border-segal-red/30 bg-segal-red/5 text-segal-red'
    )}>
      {/* Icono de estado */}
      {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
      {isCompleted && <CheckCircle2 className="h-4 w-4" />}
      {isFailed && <XCircle className="h-4 w-4" />}

      {/* Info básica */}
      <div className="flex items-center gap-2">
        <span className="font-medium">
          {isProcessing && 'Importando...'}
          {isCompleted && 'Importación completada'}
          {isFailed && 'Importación fallida'}
        </span>
        
        {isProcessing && (
          <>
            <span className="text-xs opacity-70">
              {totalRegistros.toLocaleString('es-CL')} registros
            </span>
            <div className="h-4 w-px bg-current opacity-20" />
            <span className="font-bold">{progreso}%</span>
          </>
        )}
      </div>

      {/* Botón expandir/colapsar */}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 hover:bg-transparent"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {/* Botón cerrar (solo si completado o fallido) */}
      {!isProcessing && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-transparent"
          onClick={limpiarImportacion}
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {/* Panel expandido */}
      {expanded && (
        <div className={cn(
          'absolute top-full left-0 right-0 mt-2 rounded-lg border p-4 shadow-lg z-50 min-w-[320px]',
          'bg-white dark:bg-slate-900',
          isProcessing && 'border-segal-blue/20',
          isCompleted && 'border-segal-green/20',
          isFailed && 'border-segal-red/20'
        )}>
          {/* Nombre del archivo */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 truncate">
            {nombreArchivo}
          </p>

          {/* Barra de progreso */}
          {isProcessing && (
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span>{totalRegistros.toLocaleString('es-CL')} de ~{totalEstimado.toLocaleString('es-CL')}</span>
                <span>{progreso}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-segal-blue to-segal-turquoise rounded-full transition-all duration-300"
                  style={{ width: `${progreso}%` }}
                />
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-lg bg-segal-green/10 p-2">
              <p className="text-lg font-bold text-segal-green">
                {registrosExitosos.toLocaleString('es-CL')}
              </p>
              <p className="text-xs text-gray-500">Exitosos</p>
            </div>
            <div className="rounded-lg bg-segal-red/10 p-2">
              <p className="text-lg font-bold text-segal-red">
                {registrosFallidos.toLocaleString('es-CL')}
              </p>
              <p className="text-xs text-gray-500">Fallidos</p>
            </div>
          </div>

          {/* Velocidad y tiempo restante */}
          {isProcessing && (
            <div className="mt-3 flex justify-between text-xs text-gray-500">
              <span>{velocidad > 0 ? `${velocidad.toLocaleString('es-CL')}/s` : '--'}</span>
              {tiempoRestante && <span>~{tiempoRestante} restante</span>}
            </div>
          )}

          {/* Mensaje de error */}
          {isFailed && importacionActiva.error && (
            <p className="mt-3 text-xs text-segal-red bg-segal-red/10 p-2 rounded">
              {importacionActiva.error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
