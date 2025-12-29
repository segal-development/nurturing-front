/**
 * ExecutionMonitor Component
 * Real-time monitoring of flow execution with metrics and event timeline
 *
 * Features:
 * - Live metrics (enviados, fallidos, pendientes)
 * - Progress bar with percentage
 * - Event timeline
 * - Auto-refresh every 2 seconds
 * - Dark mode support
 * - Responsive design
 */

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Zap,
  X,
  Activity,
} from 'lucide-react'
import { useFlowExecution, useCancelFlowExecution, useBatchingStatus } from '@/features/envios/hooks'
import { BatchingProgress } from '../BatchingProgress/BatchingProgress'

interface ExecutionMonitorProps {
  flujoId: number
  ejecucionId: string
  onComplete?: () => void
}

const formatDuration = (ms: number): string => {
  const segundos = Math.floor(ms / 1000)
  const minutos = Math.floor(segundos / 60)
  const horas = Math.floor(minutos / 60)

  if (horas > 0) return `${horas}h ${minutos % 60}m`
  if (minutos > 0) return `${minutos}m ${segundos % 60}s`
  return `${segundos}s`
}

export function ExecutionMonitor({ flujoId, ejecucionId, onComplete }: ExecutionMonitorProps) {
  const { data, isLoading, isError, error } = useFlowExecution(flujoId, ejecucionId)
  const { mutate: cancelExecution, isPending: isCanceling } = useCancelFlowExecution()
  const { data: batchingData } = useBatchingStatus(flujoId, ejecucionId)
  const [expandTimeline, setExpandTimeline] = useState(false)
  
  const hasBatching = batchingData?.data?.has_batching ?? false

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center p-8"
        role="status"
        aria-label="Cargando estado de ejecución"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-segal-blue" />
          <p className="text-sm text-segal-dark/70 dark:text-slate-400">
            Cargando estado de ejecución...
          </p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            Error al monitorear
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-700 dark:text-red-300">
            {error?.message || 'No se pudo cargar el estado de ejecución'}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!data?.ejecucion) {
    return (
      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-900">
        <CardHeader>
          <CardTitle className="text-yellow-600 dark:text-yellow-400">
            Ejecución no disponible
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  const ejecucion = data.ejecucion
  const metricas = ejecucion.metricas
  const isInProgress = ejecucion.estado === 'en_progreso'
  const isCompleted = ejecucion.estado === 'completado'
  const isFailed = ejecucion.estado === 'error'
  const isCanceled = ejecucion.estado === 'cancelado'

  const porcentajeEnviados =
    metricas.total_prospectos > 0
      ? Math.round((metricas.total_enviados / metricas.total_prospectos) * 100)
      : 0

  const getStatusColor = () => {
    if (isCompleted) return 'text-green-600 dark:text-green-400'
    if (isFailed) return 'text-red-600 dark:text-red-400'
    if (isCanceled) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-blue-600 dark:text-blue-400'
  }

  const getStatusLabel = () => {
    if (isCompleted) return 'Completado'
    if (isFailed) return 'Error'
    if (isCanceled) return 'Cancelado'
    return 'En Progreso'
  }

  const getStatusIcon = () => {
    if (isCompleted) return <CheckCircle className="h-5 w-5" />
    if (isFailed) return <AlertCircle className="h-5 w-5" />
    if (isCanceled) return <X className="h-5 w-5" />
    return <Activity className="h-5 w-5 animate-pulse" />
  }

  const handleCancel = () => {
    if (confirm('¿Estás seguro de que deseas cancelar esta ejecución?')) {
      cancelExecution(
        { flujoId, ejecucionId },
        {
          onSuccess: () => {
            onComplete?.()
          },
        },
      )
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with Status */}
      <Card className="dark:bg-slate-900 dark:border-slate-700">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`${getStatusColor()}`}>{getStatusIcon()}</div>
              <div>
                <CardTitle className="text-segal-dark dark:text-white">
                  {getStatusLabel()}
                </CardTitle>
                <CardDescription className="dark:text-slate-400">
                  Iniciado:{' '}
                  {format(new Date(ejecucion.fecha_inicio), 'dd/MM/yyyy HH:mm:ss', {
                    locale: es,
                  })}
                  {ejecucion.fecha_fin &&
                    ` - Finalizado: ${format(new Date(ejecucion.fecha_fin), 'HH:mm:ss', {
                      locale: es,
                    })}`}
                </CardDescription>
              </div>
            </div>

            {isInProgress && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancel}
                disabled={isCanceling}
                className="dark:bg-red-900 dark:hover:bg-red-800"
              >
                {isCanceling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cancelando...
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Progress Bar */}
      <Card className="dark:bg-slate-900 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-base text-segal-dark dark:text-white">
            Progreso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-segal-dark dark:text-white">
                {porcentajeEnviados}% completado
              </span>
              <span className="text-sm text-segal-dark/60 dark:text-slate-400">
                {metricas.total_enviados} / {metricas.total_prospectos}
              </span>
            </div>
            <div className="w-full bg-segal-blue/10 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-segal-blue to-segal-turquoise h-full transition-all duration-500"
                style={{ width: `${porcentajeEnviados}%` }}
                role="progressbar"
                aria-valuenow={metricas.total_enviados}
                aria-valuemin={0}
                aria-valuemax={metricas.total_prospectos}
              />
            </div>
          </div>

          {/* Time Estimate */}
          {isInProgress && metricas.tiempo_estimado_restante_ms > 0 && (
            <div className="flex items-center gap-2 text-sm p-2 bg-segal-blue/5 dark:bg-slate-800 rounded">
              <Clock className="h-4 w-4 text-segal-blue dark:text-segal-turquoise" />
              <span className="text-segal-dark dark:text-slate-300">
                Tiempo estimado restante:{' '}
                <strong>{formatDuration(metricas.tiempo_estimado_restante_ms)}</strong>
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batching Progress - Only shown when batching is active */}
      {hasBatching && (
        <BatchingProgress flujoId={flujoId} ejecucionId={ejecucionId} />
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total */}
        <Card className="dark:bg-slate-900 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-segal-dark/60 dark:text-slate-400 mb-2">Total</p>
              <p className="text-3xl font-bold text-segal-dark dark:text-white">
                {metricas.total_prospectos}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sent */}
        <Card className="dark:bg-slate-900 dark:border-slate-700 border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-green-600 dark:text-green-400 mb-2">Enviados</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {metricas.total_enviados}
              </p>
              <p className="text-xs text-segal-dark/60 dark:text-slate-500 mt-2">
                {metricas.tasa_exito}%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Failed */}
        <Card className="dark:bg-slate-900 dark:border-slate-700 border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-red-600 dark:text-red-400 mb-2">Fallidos</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {metricas.total_fallidos}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card className="dark:bg-slate-900 dark:border-slate-700 border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-2">Pendientes</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {metricas.total_pendientes}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card className="dark:bg-slate-900 dark:border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-segal-dark dark:text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-segal-blue" />
              Eventos
            </CardTitle>
            {ejecucion.eventos.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandTimeline(!expandTimeline)}
                className="dark:text-slate-300"
              >
                {expandTimeline ? 'Ver menos' : `Ver todos (${ejecucion.eventos.length})`}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ejecucion.eventos
              .slice(0, expandTimeline ? undefined : 5)
              .map((evento, index) => (
                <div key={evento.id} className="flex gap-3">
                  {/* Timeline marker */}
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-segal-blue dark:bg-segal-turquoise mt-1" />
                    {index < ejecucion.eventos.length - 1 && (
                      <div className="w-0.5 h-8 bg-segal-blue/20 dark:bg-slate-700" />
                    )}
                  </div>

                  {/* Event content */}
                  <div className="flex-1 pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-segal-dark dark:text-white">
                          {evento.mensaje}
                        </p>
                        <p className="text-xs text-segal-dark/60 dark:text-slate-400 mt-1">
                          {format(new Date(evento.timestamp), 'HH:mm:ss', { locale: es })}
                        </p>
                      </div>

                      {/* Event type badge */}
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ml-2 ${
                          evento.tipo === 'envio_completado'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : evento.tipo === 'envio_fallido'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}
                      >
                        {evento.tipo}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {ejecucion.eventos.length === 0 && (
            <p className="text-sm text-segal-dark/60 dark:text-slate-400">
              No hay eventos aún...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ExecutionMonitor
