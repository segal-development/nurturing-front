/**
 * Panel para ver el progreso de ejecución de un flujo en tiempo real
 * Muestra:
 * - Información de la ejecución activa
 * - Progreso general y por etapa
 * - Estadísticas de envíos (enviados, fallidos, pendientes)
 */

import { logger } from '@/lib/logger'
import { useEffect, useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  Clock,
  // Mail,
  // MessageSquare,
  Loader2,
  X,
  Users,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { flowExecutionTrackingService } from '@/api/flowExecutionTracking.service'
import type { ActiveExecutionInfo } from '@/types/flowExecutionTracking'

interface FlujoProgressPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  flujoId: number | null
  flujNombre?: string
  onClose?: () => void
}

type ExecutionStatus = 'pendiente' | 'en_progreso' | 'completado' | 'fallido' | 'pausado' | 'programado' | 'ejecutando'

export function FlujoProgressPanel({
  open,
  onOpenChange,
  flujoId,
  flujNombre = 'Ejecución de Flujo',
  onClose,
}: FlujoProgressPanelProps) {
  // Estado de ejecución
  const [execution, setExecution] = useState<ActiveExecutionInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [noActiveExecution, setNoActiveExecution] = useState(false)

  // Cargar datos de ejecución
  const loadExecution = useCallback(async () => {
    if (!flujoId) return

    try {
      setIsLoading(true)
      setError(null)
      
      const response = await flowExecutionTrackingService.getActiveExecution(flujoId)
      
      if (response.tiene_ejecucion_activa && response.ejecucion) {
        setExecution(response.ejecucion)
        setNoActiveExecution(false)
      } else {
        setExecution(null)
        setNoActiveExecution(true)
      }
    } catch (err) {
      logger.error('Error loading execution data:', err)
      setError('Error al cargar los datos de ejecución')
    } finally {
      setIsLoading(false)
    }
  }, [flujoId])

  useEffect(() => {
    if (!open || !flujoId) return

    loadExecution()

    // Auto-refresh cada 5 segundos si está en progreso
    let interval: ReturnType<typeof setInterval> | undefined
    if (autoRefresh && open) {
      interval = setInterval(loadExecution, 5000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [open, flujoId, autoRefresh, loadExecution])

  const getStatusLabel = (status: ExecutionStatus) => {
    switch (status) {
      case 'ejecutando':
      case 'en_progreso':
        return 'En Progreso'
      case 'completado':
        return 'Completado'
      case 'fallido':
        return 'Fallido'
      case 'pausado':
        return 'Pausado'
      case 'programado':
        return 'Programado'
      case 'pendiente':
        return 'Pendiente'
      default:
        return 'Desconocido'
    }
  }

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case 'ejecutando':
      case 'en_progreso':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      case 'completado':
        return <CheckCircle2 className="h-5 w-5 text-segal-green" />
      case 'fallido':
        return <XCircle className="h-5 w-5 text-segal-red" />
      case 'pausado':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'programado':
        return <Clock className="h-5 w-5 text-blue-600" />
      default:
        return <Clock className="h-5 w-5 text-segal-dark" />
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    onClose?.()
  }

  // Estado de carga inicial
  if (isLoading && !execution) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[70vw] max-h-[85vh] bg-white dark:bg-slate-900 border border-segal-blue/20 dark:border-slate-700 shadow-2xl">
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-segal-blue" />
            <span className="ml-3 text-segal-dark/70">Cargando datos de ejecución...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // No hay ejecución activa
  if (noActiveExecution) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[70vw] max-h-[85vh] bg-white dark:bg-slate-900 border border-segal-blue/20 dark:border-slate-700 shadow-2xl">
          <DialogHeader className="border-b border-segal-blue/10 dark:border-slate-700 pb-4">
            <DialogTitle className="text-2xl font-bold text-segal-dark dark:text-white">
              {flujNombre}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-semibold text-segal-dark dark:text-white mb-2">
              No hay ejecución activa
            </h3>
            <p className="text-segal-dark/60 dark:text-white/60 mb-6">
              Este flujo no tiene ninguna ejecución en progreso. 
              Primero debes ejecutar el flujo para ver su progreso.
            </p>
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Error
  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[70vw] max-h-[85vh] bg-white dark:bg-slate-900 border border-segal-blue/20 dark:border-slate-700 shadow-2xl">
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <XCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-red-600">{error}</p>
            <Button
              variant="outline"
              onClick={loadExecution}
              className="mt-4"
            >
              Reintentar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!execution) {
    return null
  }

  // Datos de progreso
  const progreso = execution.progreso
  const progresoEnvios = execution.progreso_envios
  
  // Calcular porcentaje de progreso
  const progressPercentage = progresoEnvios?.porcentaje ?? progreso?.porcentaje ?? 0
  
  // Stats de envíos
  const totalProspectos = progresoEnvios?.total_prospectos ?? 0
  const procesados = progresoEnvios?.procesados ?? 0
  const exitosos = progresoEnvios?.exitosos ?? 0
  const fallidos = progresoEnvios?.fallidos ?? 0
  const pendientes = progresoEnvios?.pendientes ?? 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[70vw] max-h-[85vh] bg-white dark:bg-slate-900 border border-segal-blue/20 dark:border-slate-700 shadow-2xl overflow-y-auto">
        <DialogHeader className="border-b border-segal-blue/10 dark:border-slate-700 pb-4 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(execution.estado as ExecutionStatus)}
              <div>
                <DialogTitle className="text-2xl font-bold text-segal-dark dark:text-white">
                  {flujNombre}
                </DialogTitle>
                <DialogDescription className="text-segal-dark/70 dark:text-white/60">
                  Estado: {getStatusLabel(execution.estado as ExecutionStatus)}
                  {execution.nodo_actual && ` • Nodo actual: ${execution.nodo_actual}`}
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5 dark:border-slate-700 dark:text-segal-turquoise dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 p-6">
          {/* Progreso General */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-segal-dark dark:text-white">Progreso General</h3>
              <span className="text-2xl font-bold text-segal-blue dark:text-segal-turquoise">
                {progressPercentage.toFixed(1)}%
              </span>
            </div>

            <div className="w-full bg-segal-blue/10 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-segal-blue dark:bg-segal-turquoise h-full transition-all duration-300"
                style={{ width: `${Math.min(100, progressPercentage)}%` }}
              />
            </div>

            <div className="text-sm text-segal-dark/60 dark:text-white/60">
              {procesados.toLocaleString()} de {totalProspectos.toLocaleString()} prospectos procesados
              {progresoEnvios?.tiempo_restante_texto && (
                <span className="ml-2">• {progresoEnvios.tiempo_restante_texto}</span>
              )}
            </div>
          </div>

          {/* Estadísticas principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total */}
            <div className="bg-segal-blue/5 dark:bg-slate-800 rounded-lg p-4 border border-segal-blue/10 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-segal-blue dark:text-segal-turquoise" />
                <p className="text-xs text-segal-dark/60 dark:text-white/60 font-medium">Total</p>
              </div>
              <p className="text-2xl font-bold text-segal-dark dark:text-white">
                {totalProspectos.toLocaleString()}
              </p>
            </div>

            {/* Enviados/Exitosos */}
            <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 border border-green-200 dark:border-green-900">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <p className="text-xs text-green-700 dark:text-green-300 font-medium">Exitosos</p>
              </div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {exitosos.toLocaleString()}
              </p>
            </div>

            {/* Fallidos */}
            <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-4 border border-red-200 dark:border-red-900">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <p className="text-xs text-red-700 dark:text-red-300 font-medium">Fallidos</p>
              </div>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {fallidos.toLocaleString()}
              </p>
            </div>

            {/* Pendientes */}
            <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-4 border border-yellow-200 dark:border-yellow-900">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">Pendientes</p>
              </div>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {pendientes.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Progreso por etapas (si está disponible) */}
          {progreso && (
            <div className="bg-segal-blue/5 dark:bg-slate-800 rounded-lg p-4 border border-segal-blue/10 dark:border-slate-700">
              <h4 className="font-semibold text-segal-dark dark:text-white mb-3">Progreso por Etapas</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-segal-blue">{progreso.completadas}</p>
                  <p className="text-xs text-segal-dark/60">Completadas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-500">{progreso.en_ejecucion}</p>
                  <p className="text-xs text-segal-dark/60">En ejecución</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-500">{progreso.pendientes}</p>
                  <p className="text-xs text-segal-dark/60">Pendientes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-500">{progreso.fallidas}</p>
                  <p className="text-xs text-segal-dark/60">Fallidas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-segal-dark">{progreso.total}</p>
                  <p className="text-xs text-segal-dark/60">Total</p>
                </div>
              </div>
            </div>
          )}

          {/* Información de tiempo */}
          <div className="bg-segal-blue/5 dark:bg-slate-800 rounded-lg p-4 border border-segal-blue/10 dark:border-slate-700 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-segal-dark/60 dark:text-white/60">Inicio:</span>
              <span className="font-medium text-segal-dark dark:text-white">
                {execution.fecha_inicio 
                  ? new Date(execution.fecha_inicio).toLocaleString('es-CL')
                  : 'No disponible'
                }
              </span>
            </div>
            {progresoEnvios?.velocidad_por_hora !== undefined && progresoEnvios.velocidad_por_hora > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-segal-dark/60 dark:text-white/60">Velocidad:</span>
                <span className="font-medium text-segal-dark dark:text-white">
                  ~{progresoEnvios.velocidad_por_hora.toLocaleString()} envíos/hora
                </span>
              </div>
            )}
            {execution.proximo_nodo && execution.fecha_proximo_nodo && (
              <div className="flex justify-between text-sm">
                <span className="text-segal-dark/60 dark:text-white/60">Próximo nodo:</span>
                <span className="font-medium text-segal-dark dark:text-white">
                  {execution.proximo_nodo} - {new Date(execution.fecha_proximo_nodo).toLocaleString('es-CL')}
                </span>
              </div>
            )}
          </div>

          {/* Botones de control */}
          <div className="flex gap-3 pt-4 border-t border-segal-blue/10 dark:border-slate-700">
            <Button
              variant="outline"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="flex-1 border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5 dark:border-slate-700 dark:text-segal-turquoise dark:hover:bg-slate-800"
            >
              {autoRefresh ? '⏸ Pausar actualización' : '▶ Reanudar actualización'}
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5 dark:border-slate-700 dark:text-segal-turquoise dark:hover:bg-slate-800"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
