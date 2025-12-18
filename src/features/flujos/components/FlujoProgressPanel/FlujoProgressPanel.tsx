/**
 * Panel para ver el progreso de ejecución de un flujo en tiempo real
 * Muestra:
 * - Información de la ejecución
 * - Progreso general y por etapa
 * - Estadísticas de envíos (enviados, fallidos, pendientes)
 * - Detalles de cada envío con su estado
 */

import { useEffect, useState } from 'react'
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
  Mail,
  MessageSquare,
  Loader2,
  X,
  Users,
  XCircle,
} from 'lucide-react'
import type { EjecucionFlujo } from '@/types/flujo'

interface FlujoProgressPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  flujoId: number | null
  flujNombre?: string
  onClose?: () => void
}

type ExecutionStatus = 'en_progreso' | 'completado' | 'fallido' | 'pausado'

export function FlujoProgressPanel({
  open,
  onOpenChange,
  flujoId,
  flujNombre = 'Ejecución de Flujo',
  onClose,
}: FlujoProgressPanelProps) {
  // Estado de ejecución
  const [execution, setExecution] = useState<EjecucionFlujo | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Simular carga de datos de ejecución (en producción, esto vendría del backend)
  useEffect(() => {
    if (!open || !flujoId) return

    const loadExecution = async () => {
      try {
        // TODO: Reemplazar con llamada real a flujosService.obtenerProgreso()
        // const data = await flujosService.obtenerProgreso(flujoId)
        // setExecution(data)

        // Datos de ejemplo para demostración
        const mockExecution: EjecucionFlujo = {
          id: 1,
          flujo_id: flujoId,
          estado: 'en_progreso',
          fecha_inicio: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutos atrás
          stats: {
            total_prospectos: 150,
            total_enviados: 87,
            total_fallidos: 5,
            total_pendientes: 58,
            email_enviados: 45,
            email_fallidos: 2,
            sms_enviados: 42,
            sms_fallidos: 3,
            porcentaje_completado: 58,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setExecution(mockExecution)
      } catch (error) {
        console.error('Error loading execution data:', error)
      }
    }

    loadExecution()

    // Auto-refresh cada 5 segundos si está en progreso
    let interval: ReturnType<typeof setInterval> | undefined
    if (autoRefresh && open) {
      interval = setInterval(loadExecution, 5000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [open, flujoId, autoRefresh])

  if (!execution) {
    return null
  }

  const stats = execution.stats
  const progressPercentage = stats.porcentaje_completado

  const getStatusLabel = (status: ExecutionStatus) => {
    switch (status) {
      case 'en_progreso':
        return 'En Progreso'
      case 'completado':
        return 'Completado'
      case 'fallido':
        return 'Fallido'
      case 'pausado':
        return 'Pausado'
      default:
        return 'Desconocido'
    }
  }

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case 'en_progreso':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      case 'completado':
        return <CheckCircle2 className="h-5 w-5 text-segal-green" />
      case 'fallido':
        return <XCircle className="h-5 w-5 text-segal-red" />
      case 'pausado':
        return <Clock className="h-5 w-5 text-yellow-600" />
      default:
        return <CheckCircle2 className="h-5 w-5 text-segal-dark" />
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    onClose?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[70vw] max-h-[85vh] bg-white dark:bg-slate-900 border border-segal-blue/20 dark:border-slate-700 shadow-2xl overflow-y-auto">
        <DialogHeader className="border-b border-segal-blue/10 dark:border-slate-700 pb-4 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(execution.estado)}
              <div>
                <DialogTitle className="text-2xl font-bold text-segal-dark dark:text-white">
                  {flujNombre}
                </DialogTitle>
                <DialogDescription className="text-segal-dark/70 dark:text-white/60">
                  Estado: {getStatusLabel(execution.estado)}
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
              <span className="text-2xl font-bold text-segal-blue dark:text-segal-turquoise">{progressPercentage}%</span>
            </div>

            <div className="w-full bg-segal-blue/10 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-segal-blue dark:bg-segal-turquoise h-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="text-sm text-segal-dark/60 dark:text-white/60">
              {stats.total_enviados} de {stats.total_prospectos} prospectos procesados
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
              <p className="text-2xl font-bold text-segal-dark dark:text-white">{stats.total_prospectos}</p>
            </div>

            {/* Enviados */}
            <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 border border-green-200 dark:border-green-900">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <p className="text-xs text-green-700 dark:text-green-300 font-medium">Enviados</p>
              </div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.total_enviados}</p>
            </div>

            {/* Fallidos */}
            <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-4 border border-red-200 dark:border-red-900">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <p className="text-xs text-red-700 dark:text-red-300 font-medium">Fallidos</p>
              </div>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.total_fallidos}</p>
            </div>

            {/* Pendientes */}
            <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-4 border border-yellow-200 dark:border-yellow-900">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">Pendientes</p>
              </div>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.total_pendientes}</p>
            </div>
          </div>

          {/* Desglose por tipo de mensaje */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-segal-dark dark:text-white">Desglose por Tipo de Mensaje</h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Email */}
              <div className="bg-white dark:bg-slate-800 border border-segal-blue/10 dark:border-slate-700 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-segal-blue dark:text-segal-turquoise" />
                  <h4 className="font-semibold text-segal-dark dark:text-white">Email</h4>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-segal-dark/60 dark:text-white/60">Enviados</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">{stats.email_enviados}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-segal-dark/60 dark:text-white/60">Fallidos</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">{stats.email_fallidos}</span>
                  </div>
                  <div className="pt-2 border-t border-segal-blue/10 dark:border-slate-700">
                    <div className="flex justify-between">
                      <span className="text-segal-dark/60 dark:text-white/60">Total</span>
                      <span className="font-semibold text-segal-dark dark:text-white">
                        {stats.email_enviados + stats.email_fallidos}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SMS */}
              <div className="bg-white dark:bg-slate-800 border border-segal-blue/10 dark:border-slate-700 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-segal-blue dark:text-segal-turquoise" />
                  <h4 className="font-semibold text-segal-dark dark:text-white">SMS</h4>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-segal-dark/60 dark:text-white/60">Enviados</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">{stats.sms_enviados}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-segal-dark/60 dark:text-white/60">Fallidos</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">{stats.sms_fallidos}</span>
                  </div>
                  <div className="pt-2 border-t border-segal-blue/10 dark:border-slate-700">
                    <div className="flex justify-between">
                      <span className="text-segal-dark/60 dark:text-white/60">Total</span>
                      <span className="font-semibold text-segal-dark dark:text-white">
                        {stats.sms_enviados + stats.sms_fallidos}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Información de tiempo */}
          <div className="bg-segal-blue/5 dark:bg-slate-800 rounded-lg p-4 border border-segal-blue/10 dark:border-slate-700 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-segal-dark/60 dark:text-white/60">Inicio:</span>
              <span className="font-medium text-segal-dark dark:text-white">
                {new Date(execution.fecha_inicio).toLocaleString('es-CL')}
              </span>
            </div>
            {execution.fecha_fin && (
              <div className="flex justify-between text-sm">
                <span className="text-segal-dark/60 dark:text-white/60">Fin:</span>
                <span className="font-medium text-segal-dark dark:text-white">
                  {new Date(execution.fecha_fin).toLocaleString('es-CL')}
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
