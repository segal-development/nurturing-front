/**
 * Panel de historial de ejecuciones del flujo
 * Muestra las últimas 50 ejecuciones con logs y estado
 */

import { Clock, CheckCircle2, AlertCircle, Pause, XCircle } from 'lucide-react'
import type { EjecucionFlujo } from '@/types/flujo'

interface ExecutionHistoryPanelProps {
  ejecuciones: EjecucionFlujo[] | undefined
}

function getEstadoColor(estado: string) {
  switch (estado) {
    case 'completado':
      return 'bg-segal-green/10 border-segal-green/30 text-segal-green'
    case 'en_progreso':
      return 'bg-blue-50 border-blue-200 text-blue-600'
    case 'pausado':
      return 'bg-yellow-50 border-yellow-200 text-yellow-600'
    case 'fallido':
      return 'bg-red-50 border-red-200 text-red-600'
    default:
      return 'bg-segal-blue/5 border-segal-blue/10 text-segal-dark'
  }
}

function getEstadoIcon(estado: string) {
  switch (estado) {
    case 'completado':
      return <CheckCircle2 className="h-5 w-5" />
    case 'en_progreso':
      return <Clock className="h-5 w-5" />
    case 'pausado':
      return <Pause className="h-5 w-5" />
    case 'fallido':
      return <XCircle className="h-5 w-5" />
    default:
      return <AlertCircle className="h-5 w-5" />
  }
}

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function calcularDuracion(inicio: string, fin?: string): string {
  const fechaInicio = new Date(inicio)
  const fechaFin = fin ? new Date(fin) : new Date()
  const duracion = fechaFin.getTime() - fechaInicio.getTime()
  const minutos = Math.floor(duracion / 60000)
  const horas = Math.floor(minutos / 60)
  const dias = Math.floor(horas / 24)

  if (dias > 0) return `${dias}d ${horas % 24}h`
  if (horas > 0) return `${horas}h ${minutos % 60}m`
  return `${minutos}m`
}

export function ExecutionHistoryPanel({ ejecuciones }: ExecutionHistoryPanelProps) {
  if (!ejecuciones || ejecuciones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-segal-blue/5 rounded-lg border border-segal-blue/10">
        <Clock className="h-12 w-12 text-segal-blue/40 mb-3" />
        <p className="text-segal-dark/60 font-medium">No hay ejecuciones registradas</p>
        <p className="text-sm text-segal-dark/40 mt-1">Este flujo aún no ha sido ejecutado</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-segal-dark">Historial de Ejecuciones</h3>
        <span className="text-sm text-segal-dark/60">Últimas {ejecuciones.length} ejecuciones</span>
      </div>

      <div className="space-y-3">
        {ejecuciones.map((ejecucion) => {
          const colorClase = getEstadoColor(ejecucion.estado)
          const icono = getEstadoIcon(ejecucion.estado)
          const duracion = calcularDuracion(ejecucion.fecha_inicio, ejecucion.fecha_fin)

          return (
            <div
              key={ejecucion.id}
              className="border border-segal-blue/10 rounded-lg p-4 hover:border-segal-blue/30 transition-colors bg-white"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-lg border ${colorClase}`}>{icono}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-segal-dark">
                      Ejecución #{ejecucion.id}
                    </p>
                    <p className="text-sm text-segal-dark/60">
                      {formatearFecha(ejecucion.fecha_inicio)}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${colorClase}`}>
                  {ejecucion.estado.charAt(0).toUpperCase() + ejecucion.estado.slice(1).replace('_', ' ')}
                </span>
              </div>

              {/* Estadísticas de la ejecución */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <div className="bg-segal-blue/5 rounded p-2">
                  <p className="text-xs text-segal-dark/60">Procesados</p>
                  <p className="text-sm font-bold text-segal-dark">
                    {ejecucion.stats?.total_enviados || 0}
                  </p>
                </div>

                <div className="bg-red-50 rounded p-2">
                  <p className="text-xs text-red-600">Fallidos</p>
                  <p className="text-sm font-bold text-red-600">
                    {ejecucion.stats?.total_fallidos || 0}
                  </p>
                </div>

                <div className="bg-yellow-50 rounded p-2">
                  <p className="text-xs text-yellow-600">Pendientes</p>
                  <p className="text-sm font-bold text-yellow-600">
                    {ejecucion.stats?.total_pendientes || 0}
                  </p>
                </div>

                <div className="bg-segal-green/5 rounded p-2">
                  <p className="text-xs text-segal-green/70">Total</p>
                  <p className="text-sm font-bold text-segal-green">
                    {ejecucion.stats?.total_prospectos || 0}
                  </p>
                </div>

                <div className="bg-segal-blue/5 rounded p-2">
                  <p className="text-xs text-segal-dark/60">Duración</p>
                  <p className="text-sm font-bold text-segal-dark">{duracion}</p>
                </div>
              </div>

              {/* Desglose por canal */}
              {(ejecucion.stats?.email_enviados || 0) > 0 ||
              (ejecucion.stats?.sms_enviados || 0) > 0 ? (
                <div className="mt-3 pt-3 border-t border-segal-blue/10 flex gap-4 text-xs">
                  {(ejecucion.stats?.email_enviados || 0) > 0 && (
                    <span className="text-segal-dark/60">
                      📧 Email: {ejecucion.stats?.email_enviados} enviados
                      {ejecucion.stats?.email_fallidos > 0 && ` / ${ejecucion.stats.email_fallidos} fallidos`}
                    </span>
                  )}
                  {(ejecucion.stats?.sms_enviados || 0) > 0 && (
                    <span className="text-segal-dark/60">
                      📱 SMS: {ejecucion.stats?.sms_enviados} enviados
                      {ejecucion.stats?.sms_fallidos > 0 && ` / ${ejecucion.stats.sms_fallidos} fallidos`}
                    </span>
                  )}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
