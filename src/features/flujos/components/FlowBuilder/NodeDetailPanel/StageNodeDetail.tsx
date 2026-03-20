/**
 * StageNodeDetail — full view + edit mode for Stage nodes.
 *
 * Extracted from the old 803-line StageNode inline rendering.
 * Displays: label, active/inactive, wait time, message type, template,
 * cost per prospect, condition verification time, offer, execution stats,
 * aggregated historical stats, cohort badges with progress, paused state,
 * error messages.
 *
 * Edit mode: label, wait days, message type, date picker, template selector,
 * verification time, active checkbox.
 */

import { useLayoutEffect, useState } from 'react'
import { format, parseISO, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Layers,
  Loader2,
  Mail,
  MessageSquare,
  PauseCircle,
  Send,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { DatePicker } from '@/components/ui/date-picker'
import type { StageNodeData } from '../../../types/flowBuilder'
import { PlantillaSelector } from '../components/PlantillaSelector'

interface StageNodeDetailProps {
  nodeId: string
  data: StageNodeData
  onUpdate: (nodeId: string, data: Partial<StageNodeData>) => void
  onDelete: (nodeId: string) => void
  precios?: { email: number; sms: number }
  isReadOnly?: boolean
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

function getMessageIcon(tipo: string) {
  switch (tipo) {
    case 'email':
      return <Mail className="h-4 w-4 text-blue-500" />
    case 'sms':
      return <MessageSquare className="h-4 w-4 text-green-500" />
    case 'ambos':
      return (
        <div className="flex gap-1">
          <Mail className="h-3 w-3 text-blue-500" />
          <MessageSquare className="h-3 w-3 text-green-500" />
        </div>
      )
    default:
      return <Zap className="h-4 w-4 text-gray-400" />
  }
}

function getMessageTypeLabel(tipo?: string): string {
  switch (tipo) {
    case 'email':
      return 'Email'
    case 'sms':
      return 'SMS'
    case 'ambos':
      return 'Email + SMS'
    default:
      return 'Sin tipo'
  }
}

function getCostoNodo(
  precios: { email: number; sms: number } | undefined,
  tipoMensaje?: string
): number | null {
  if (!precios) return null
  const tipo = tipoMensaje || 'email'
  switch (tipo) {
    case 'email':
      return precios.email
    case 'sms':
      return precios.sms
    case 'ambos':
      return precios.email + precios.sms
    default:
      return precios.email
  }
}

function getExecutionStateLabel(state?: string): string {
  switch (state) {
    case 'executing':
      return 'Ejecutando'
    case 'completed':
      return 'Completado'
    case 'failed':
      return 'Fallido'
    case 'pending':
      return 'Pendiente'
    case 'paused':
      return 'Pausada'
    default:
      return ''
  }
}

function getExecutionStateIcon(state?: string) {
  switch (state) {
    case 'executing':
      return <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    case 'failed':
      return <AlertCircle className="h-4 w-4 text-red-600" />
    case 'pending':
      return <Clock className="h-4 w-4 text-gray-400" />
    case 'paused':
      return <PauseCircle className="h-4 w-4 text-orange-500" />
    default:
      return null
  }
}

function getNodeNumber(id: string): string {
  return id.split('-')[1]?.substring(0, 1) || '1'
}

// ---------------------------------------------------------------------------
// Sub-components — View mode sections
// ---------------------------------------------------------------------------

function ExecutionStatsSection({ envios }: { envios: StageNodeData['envios'] }) {
  if (!envios || typeof envios !== 'object') return null

  const items = [
    { value: envios.enviado, label: 'enviados', icon: Send, color: 'text-green-600' },
    { value: envios.fallido, label: 'fallidos', icon: AlertCircle, color: 'text-red-600' },
    { value: envios.pendiente, label: 'pendientes', icon: Clock, color: 'text-amber-600' },
    { value: envios.abierto, label: 'abiertos', icon: Mail, color: 'text-blue-600' },
  ].filter((item) => typeof item.value === 'number' && item.value > 0)

  if (items.length === 0) return null

  return (
    <div className="space-y-2 pt-3 border-t border-segal-blue/10">
      <p className="text-xs font-semibold text-segal-dark">Ejecucion actual</p>
      <div className="grid grid-cols-2 gap-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <item.icon className={cn('h-3 w-3', item.color)} />
            <span className={cn('text-xs font-semibold', item.color)}>
              {item.value} {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AggregatedStatsSection({ stats }: { stats: StageNodeData['aggregatedStats'] }) {
  if (!stats || typeof stats !== 'object') return null
  if (!((stats as any).enviado > 0 || (stats as any).fallido > 0)) return null

  const items = [
    { value: (stats as any).enviado, label: 'enviados', icon: Send, color: 'text-green-600' },
    { value: (stats as any).fallido, label: 'fallidos', icon: AlertCircle, color: 'text-red-600' },
    { value: (stats as any).abierto, label: 'abiertos', icon: Mail, color: 'text-blue-600' },
    { value: (stats as any).clickeado, label: 'clicks', icon: CheckCircle2, color: 'text-purple-600' },
  ].filter((item) => typeof item.value === 'number' && item.value > 0)

  if (items.length === 0) return null

  return (
    <div className="space-y-2 pt-3 border-t border-segal-blue/10">
      <p className="text-xs font-semibold text-segal-dark">Total historico</p>
      <div className="grid grid-cols-2 gap-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <item.icon className={cn('h-3 w-3', item.color)} />
            <span className={cn('text-xs font-semibold', item.color)}>
              {item.value.toLocaleString()} {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CohortSection({ resumen }: { resumen: StageNodeData['cohorteResumen'] }) {
  if (!resumen || resumen.total_cohortes === 0) return null

  const progressPct =
    resumen.total_prospectos > 0
      ? Math.round((resumen.prospectos_procesados / resumen.total_prospectos) * 100)
      : 0

  return (
    <div className="space-y-2 p-2.5 rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200/80">
      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Cohort count */}
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-indigo-100 border border-indigo-300">
          <Layers className="h-3 w-3 text-indigo-600" />
          <span className="text-xs font-semibold text-indigo-700">{resumen.total_cohortes}</span>
          <span className="text-xs text-indigo-600">
            cohorte{resumen.total_cohortes > 1 ? 's' : ''}
          </span>
        </div>

        {/* Prospect count */}
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-violet-100 border border-violet-300">
          <Users className="h-3 w-3 text-violet-600" />
          <span className="text-xs font-semibold text-violet-700">
            {resumen.total_prospectos.toLocaleString()}
          </span>
          <span className="text-xs text-violet-600">prospectos</span>
        </div>
      </div>

      {/* Cohort state breakdown */}
      <div className="flex gap-3 text-xs flex-wrap">
        {resumen.cohortes_completadas > 0 && (
          <span className="text-green-600">✓ {resumen.cohortes_completadas} completadas</span>
        )}
        {resumen.cohortes_procesando > 0 && (
          <span className="text-amber-600">⟳ {resumen.cohortes_procesando} procesando</span>
        )}
        {resumen.cohortes_pendientes > 0 && (
          <span className="text-gray-500">◷ {resumen.cohortes_pendientes} pendientes</span>
        )}
      </div>

      {/* Progress bar */}
      {resumen.total_prospectos > 0 && (
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-indigo-600 font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Progreso
            </span>
            <span className="text-indigo-700 font-semibold">{progressPct}%</span>
          </div>
          <div className="h-1.5 bg-indigo-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-indigo-600/70 mt-1">
            {resumen.prospectos_procesados.toLocaleString()} procesados / {(resumen.total_prospectos - resumen.prospectos_procesados).toLocaleString()} pendientes
          </p>
        </div>
      )}

      {/* Cohort detail breakdown */}
      {resumen.detalle_cohortes.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-indigo-200/50">
          <p className="text-xs font-medium text-indigo-700">
            Detalle por cohorte ({resumen.detalle_cohortes.length})
          </p>
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {resumen.detalle_cohortes.map((cohorte, idx) => (
              <div
                key={cohorte.ejecucion_id || idx}
                className={cn(
                  'flex items-center justify-between gap-2 text-xs p-1.5 rounded',
                  cohorte.estado === 'completed'
                    ? 'bg-green-50'
                    : cohorte.estado === 'executing'
                      ? 'bg-amber-50'
                      : 'bg-gray-50'
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full shrink-0',
                      cohorte.estado === 'completed'
                        ? 'bg-green-400'
                        : cohorte.estado === 'executing'
                          ? 'bg-amber-400'
                          : 'bg-gray-400'
                    )}
                  />
                  <span className="font-medium text-segal-dark">
                    {cohorte.prospectos.toLocaleString()} prospectos
                  </span>
                  <span className="text-segal-dark/50 text-[10px]">
                    {cohorte.created_at
                      ? formatDistanceToNow(parseISO(cohorte.created_at), {
                          addSuffix: true,
                          locale: es,
                        })
                      : 'Sin fecha'}
                  </span>
                </div>
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0',
                    cohorte.estado === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : cohorte.estado === 'executing'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {cohorte.estado === 'completed'
                    ? 'Completado'
                    : cohorte.estado === 'executing'
                      ? 'Procesando'
                      : 'Pendiente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function StageNodeDetail({
  nodeId,
  data,
  onUpdate,
  onDelete,
  precios,
  isReadOnly = false,
}: StageNodeDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [localData, setLocalData] = useState<StageNodeData>({ ...data })

  // Sync localData when data changes externally (execution stats arriving)
  // Only sync when NOT editing to avoid losing user changes
  useLayoutEffect(() => {
    if (!isEditing) {
      setLocalData({ ...data })
    }
  }, [data, isEditing])

  const handleSave = () => {
    onUpdate(nodeId, localData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setLocalData({ ...data })
    setIsEditing(false)
  }

  const handleDelete = () => {
    onDelete(nodeId)
  }

  const costoNodo = getCostoNodo(precios, localData.tipo_mensaje)
  const nodeNumber = getNodeNumber(nodeId)

  return (
    <div className="space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
          {getMessageIcon(data.tipo_mensaje || 'email') || <Zap className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-segal-blue/10 text-[10px] font-bold text-segal-blue">
              {nodeNumber}
            </div>
            <h3 className="font-bold text-sm text-segal-dark truncate">
              {data.label || 'Etapa sin nombre'}
            </h3>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {!data.activo && (
              <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                Inactiva
              </span>
            )}
            {data.executionState && (
              <div className="flex items-center gap-1">
                {getExecutionStateIcon(data.executionState)}
                <span className="text-[10px] text-segal-dark/60">
                  {getExecutionStateLabel(data.executionState)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {!isEditing ? (
        /* ---- VIEW MODE ---- */
        <div className="space-y-3">
          {/* Basic info grid */}
          <div className="space-y-2 text-xs text-segal-dark/70">
            {/* Wait time */}
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-segal-blue/60 shrink-0" />
              <span>Espera: {localData.tiempo_espera ?? 0} dias</span>
            </div>

            {/* Message type */}
            <div className="flex items-center gap-2">
              {getMessageIcon(localData.tipo_mensaje || 'email')}
              <span>{getMessageTypeLabel(localData.tipo_mensaje)}</span>
            </div>

            {/* Condition verification time */}
            {localData.tiempo_verificacion_condicion && (
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-segal-blue/60 shrink-0" />
                <span>Verifica en: {localData.tiempo_verificacion_condicion}h</span>
              </div>
            )}

            {/* Cost per prospect */}
            {costoNodo !== null && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="text-emerald-700 font-medium">
                  ${costoNodo.toLocaleString('es-CL')} por prospecto
                </span>
              </div>
            )}

            {/* Custom date */}
            {localData.fecha_inicio_personalizada && (
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                <span className="text-purple-700">
                  Fecha: {format(parseISO(localData.fecha_inicio_personalizada), 'dd/MM/yyyy')}
                </span>
              </div>
            )}
          </div>

          {/* Template preview */}
          {localData.plantilla_type === 'reference' &&
          (localData.plantilla_id || localData.plantilla_id_email) ? (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-segal-dark">Plantilla</p>
              {localData.plantilla_id && (
                <div className="p-2 rounded bg-green-50 border border-green-200 flex items-center gap-2">
                  <span className="text-green-600 text-xs">📄</span>
                  <span className="text-xs font-medium text-green-800">
                    Plantilla #{localData.plantilla_id}
                  </span>
                </div>
              )}
              {localData.plantilla_id_email && (
                <div className="p-2 rounded bg-purple-50 border border-purple-200 flex items-center gap-2">
                  <span className="text-purple-600 text-xs">📧</span>
                  <span className="text-xs font-medium text-purple-800">
                    Plantilla Email #{localData.plantilla_id_email}
                  </span>
                </div>
              )}
            </div>
          ) : localData.plantilla_mensaje ? (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-segal-dark">Mensaje</p>
              <div className="p-2 rounded bg-segal-blue/5 border border-segal-blue/10">
                <p className="text-xs line-clamp-3 text-segal-dark">
                  "{localData.plantilla_mensaje.substring(0, 100)}
                  {localData.plantilla_mensaje.length > 100 ? '...' : ''}"
                </p>
              </div>
            </div>
          ) : (
            <div className="p-2 rounded bg-yellow-50 border border-yellow-200">
              <p className="text-xs text-yellow-800">⚠️ Sin plantilla configurada</p>
            </div>
          )}

          {/* Offer */}
          {localData.oferta &&
            typeof localData.oferta === 'object' &&
            localData.oferta.titulo && (
              <div className="text-xs text-segal-green font-medium">
                📦 {String(localData.oferta.titulo)}
              </div>
            )}

          {/* Execution stats (active execution) */}
          {data.executionState &&
            data.executionState !== 'pending' && (
              <ExecutionStatsSection envios={data.envios} />
            )}

          {/* Aggregated historical stats */}
          {!data.executionState && (
            <AggregatedStatsSection stats={data.aggregatedStats} />
          )}

          {/* Cohorts */}
          <CohortSection resumen={data.cohorteResumen} />

          {/* Paused state banner */}
          {data.executionState === 'paused' && (
            <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-300">
              <div className="flex items-center gap-2">
                <PauseCircle className="h-4 w-4 text-orange-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-orange-800">Pausada</p>
                  {data.pauseReason && (
                    <p className="text-xs text-orange-700 truncate">
                      {data.pauseReason.service}: {data.pauseReason.message}
                    </p>
                  )}
                  {data.autoResumeAt && (
                    <p className="text-xs text-orange-600 mt-0.5">
                      Se reanudara automaticamente
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {data.errorMessage && typeof data.errorMessage === 'string' && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200">
              <p className="text-xs text-red-600 font-semibold">Error:</p>
              <p className="text-xs text-red-600 line-clamp-3">{data.errorMessage}</p>
            </div>
          )}

          {/* Actions */}
          {!isReadOnly && (
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 px-3 py-1.5 rounded text-xs font-medium text-segal-blue border border-segal-blue/20 hover:bg-segal-blue/5 transition-colors"
              >
                Editar
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 rounded text-xs font-medium text-segal-red border border-segal-red/20 hover:bg-segal-red/5 transition-colors"
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ---- EDIT MODE ---- */
        <div className="space-y-3">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-segal-dark">Nombre de la Etapa</label>
            <input
              type="text"
              value={localData.label || ''}
              onChange={(e) => setLocalData({ ...localData, label: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-segal-blue/30 rounded focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20 focus:outline-none"
              placeholder="Ej: Recordatorio inicial"
            />
          </div>

          {/* Wait days + Message type grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-segal-dark">
                Espera (dias)
              </label>
              <input
                type="number"
                min="0"
                max="365"
                value={localData.tiempo_espera ?? ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? '' : parseInt(e.target.value)
                  setLocalData({ ...localData, tiempo_espera: value as number })
                }}
                onBlur={(e) => {
                  const value = parseInt(e.target.value)
                  setLocalData({
                    ...localData,
                    tiempo_espera: isNaN(value) ? 0 : value,
                  })
                }}
                className="w-full px-2 py-1.5 text-sm border border-segal-blue/30 rounded focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-segal-dark">Tipo</label>
              <select
                value={localData.tipo_mensaje || 'email'}
                onChange={(e) =>
                  setLocalData({
                    ...localData,
                    tipo_mensaje: e.target.value as StageNodeData['tipo_mensaje'],
                  })
                }
                className="w-full px-2 py-1.5 text-sm border border-segal-blue/30 rounded focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20 focus:outline-none"
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="ambos">Ambos</option>
              </select>
            </div>
          </div>

          {/* Condition verification time */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-segal-dark">
              Verificar condicion (horas)
            </label>
            <input
              type="number"
              min="1"
              max="2160"
              value={localData.tiempo_verificacion_condicion ?? ''}
              onChange={(e) => {
                const value = e.target.value === '' ? '' : parseInt(e.target.value)
                setLocalData({
                  ...localData,
                  tiempo_verificacion_condicion: value as number,
                })
              }}
              onBlur={(e) => {
                const value = parseInt(e.target.value)
                setLocalData({
                  ...localData,
                  tiempo_verificacion_condicion: isNaN(value) ? 24 : value,
                })
              }}
              className="w-full px-2 py-1.5 text-sm border border-segal-blue/30 rounded focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20 focus:outline-none"
            />
            <p className="text-xs text-segal-dark/60">
              Se usa cuando hay una condicion despues de esta etapa
            </p>
          </div>

          {/* Custom start date */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-segal-dark">
              Fecha Personalizada (Opcional)
            </label>
            <p className="text-xs text-segal-dark/60">
              Override de la fecha basada en dias
            </p>
            <DatePicker
              date={
                localData.fecha_inicio_personalizada
                  ? parseISO(localData.fecha_inicio_personalizada)
                  : undefined
              }
              onDateChange={(date) =>
                setLocalData({
                  ...localData,
                  fecha_inicio_personalizada: date ? format(date, 'yyyy-MM-dd') : '',
                })
              }
              placeholder="Seleccionar fecha"
              fromDate={new Date()}
              dateFormat="dd/MM/yyyy"
              className="w-full"
            />
          </div>

          {/* Template selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-segal-dark">Plantilla</label>
            <PlantillaSelector
              tipo_mensaje={localData.tipo_mensaje}
              plantilla_id={localData.plantilla_id}
              plantilla_id_email={localData.plantilla_id_email}
              plantilla_mensaje={localData.plantilla_mensaje}
              plantilla_type={localData.plantilla_type}
              onChange={(plantillaData) => {
                setLocalData({ ...localData, ...plantillaData })
              }}
            />
          </div>

          {/* Active toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localData.activo !== false}
              onChange={(e) => setLocalData({ ...localData, activo: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-xs font-medium text-segal-dark">Activo</span>
          </label>

          {/* Save / Cancel */}
          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={handleSave}
              className="flex-1 px-3 py-1.5 bg-segal-green text-white text-xs font-medium rounded hover:bg-segal-green/90 transition-colors"
            >
              Guardar
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-3 py-1.5 border border-segal-blue/20 text-segal-blue text-xs font-medium rounded hover:bg-segal-blue/5 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
