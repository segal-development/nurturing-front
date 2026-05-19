/**
 * EtapasHistoryTimeline
 *
 * Displays a detailed timeline of stages for a cohort/execution showing
 * send statistics for each stage: prospectos alcanzados, % abiertos, % clicks.
 *
 * Features:
 * - Lazy loads execution detail when rendered
 * - Shows stage status with visual indicators (✓ completed, ● in progress, ○ pending)
 * - Displays metrics for completed/in-progress stages (using unique prospectos, not total envío records)
 * - Shows fecha_programada for pending stages
 * - Resolves stage labels from config_structure
 *
 * @module EtapasHistoryTimeline
 */

import { Check, Circle, Clock, Loader2, AlertTriangle, Users, Mail, Eye, MousePointer, HelpCircle, Smartphone } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { CanalEnvio, ConfigStructure } from '@/types/flujo'
import { inferirCanalEnvioDesdeEtapas } from '@/types/flujo'
import type {
  StageExecution,
  StageExecutionState,
  MetricasSync,
  MetricasNuevosPorEtapa,
} from '@/types/flowExecutionTracking'
import { useFlowExecutionDetail } from '../../hooks/useFlowExecutionTracking'

// ============================================================================
// Types
// ============================================================================

interface EtapasHistoryTimelineProps {
  flujoId: number
  ejecucionId: number
  configStructure?: ConfigStructure
  /** Message type for channel breakdown display. If not provided, inferred from configStructure.stages */
  tipoMensaje?: CanalEnvio
  /** Si el flujo es perpetuo, todas las etapas ejecutadas se muestran como "♾️ Recurrente" */
  esPerpetuo?: boolean
}

interface StageTimelineItemProps {
  stage: StageExecution
  stageLabel: string
  isLast: boolean
  metricasNuevos?: MetricasNuevosPorEtapa
  tipoMensaje?: 'email' | 'sms' | 'ambos'
  esPerpetuo?: boolean
}

/**
 * Stage data from config_structure - can be either legacy EtapaFlujo or new StageData
 * We need to handle both formats for backward compatibility
 */
interface ConfigStageData {
  id: string | number
  node_id?: string
  label?: string
  tiempo_espera?: number
  dia_envio?: number
}

/**
 * Calculated metrics for a stage
 */
interface StageMetrics {
  alcanzados: number // prospectos_alcanzados - unique prospectos
  porcentajeAbiertos: number
  porcentajeClicks: number
}

// ============================================================================
// Constants
// ============================================================================

const STAGE_STATUS = {
  COMPLETED: 'completed',
  EXECUTING: 'executing',
  PENDING: 'pending',
  FAILED: 'failed',
  PAUSED: 'paused',
} as const

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Resolves tiempo_espera (days) to a human-readable label "DIA X"
 * For the first stage (tiempo_espera = 0), returns "DIA 0"
 *
 * NOTE: The stages in config_structure may have tiempo_espera in days
 * relative to the previous stage, so we need to accumulate them.
 */
function resolveStageDayLabel(
  cumulativeDays: number,
): string {
  return `DIA ${cumulativeDays}`
}

/**
 * Calculates send metrics from StageExecution.envios
 * Uses prospectos_alcanzados (unique prospectos) for percentages.
 * Returns percentages as whole numbers (0-100)
 */
function calculateStageMetrics(
  envios: StageExecution['envios'],
): StageMetrics | null {
  if (!envios) return null

  // Use prospectos_alcanzados (unique prospectos) instead of enviado (total records)
  // Fall back to enviado for backwards compatibility with older API responses
  const alcanzados = envios.prospectos_alcanzados ?? envios.enviado ?? 0
  if (alcanzados === 0) {
    return {
      alcanzados: 0,
      porcentajeAbiertos: 0,
      porcentajeClicks: 0,
    }
  }

  const abiertos = envios.abierto ?? 0
  const clickeados = envios.clickeado ?? 0

  return {
    alcanzados,
    porcentajeAbiertos: Math.round((abiertos / alcanzados) * 100),
    porcentajeClicks: Math.round((clickeados / alcanzados) * 100),
  }
}

/**
 * Calculates channel breakdown for messages when tipo_mensaje is 'ambos'.
 * NOTE: This is an approximation—API doesn't send per-channel counts.
 * When both channels are used, we split 50/50 which is accurate for most flows.
 */
function calculateChannelBreakdown(
  enviado: number,
  tipoMensaje?: 'email' | 'sms' | 'ambos',
): { emails: number; sms: number } | null {
  if (tipoMensaje !== 'ambos' || enviado === 0) return null
  
  const half = Math.floor(enviado / 2)
  return {
    emails: half,
    sms: enviado - half, // Handle odd numbers by giving remainder to SMS
  }
}

/**
 * Formats a date string to a human-readable format
 */
function formatFechaProgramada(fecha: string): string {
  const date = new Date(fecha)
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible'

  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Gets the status icon component for a stage
 */
function getStatusIcon(estado: StageExecutionState) {
  switch (estado) {
    case STAGE_STATUS.COMPLETED:
      return <Check className="h-3 w-3" />
    case STAGE_STATUS.EXECUTING:
      return <Circle className="h-3 w-3 fill-current" />
    case STAGE_STATUS.PENDING:
      return <Circle className="h-3 w-3" />
    case STAGE_STATUS.FAILED:
      return <AlertTriangle className="h-3 w-3" />
    case STAGE_STATUS.PAUSED:
      return <Clock className="h-3 w-3" />
    default:
      return <Circle className="h-3 w-3" />
  }
}

/**
 * Gets the color classes for a stage based on its status
 */
function getStatusColors(estado: StageExecutionState): {
  icon: string
  line: string
  text: string
} {
  switch (estado) {
    case STAGE_STATUS.COMPLETED:
      return {
        icon: 'bg-green-500 text-white',
        line: 'bg-green-500',
        text: 'text-segal-dark',
      }
    case STAGE_STATUS.EXECUTING:
      return {
        icon: 'bg-amber-500 text-white animate-pulse',
        line: 'bg-amber-500',
        text: 'text-amber-700',
      }
    case STAGE_STATUS.PENDING:
      return {
        icon: 'bg-slate-200 text-slate-500',
        line: 'bg-slate-200',
        text: 'text-slate-500',
      }
    case STAGE_STATUS.FAILED:
      return {
        icon: 'bg-red-500 text-white',
        line: 'bg-red-500',
        text: 'text-red-700',
      }
    case STAGE_STATUS.PAUSED:
      return {
        icon: 'bg-blue-400 text-white',
        line: 'bg-blue-400',
        text: 'text-blue-700',
      }
    default:
      return {
        icon: 'bg-slate-200 text-slate-500',
        line: 'bg-slate-200',
        text: 'text-slate-500',
      }
  }
}

/**
 * Builds a map of node_id -> cumulative day label
 * config_structure.stages has tiempo_espera relative to previous stage
 */
function buildStageLabelMap(
  configStructure?: ConfigStructure,
): Map<string, { label: string; dayLabel: string }> {
  const map = new Map<string, { label: string; dayLabel: string }>()

  if (!configStructure?.stages) return map

  let cumulativeDays = 0
  for (const stage of configStructure.stages) {
    // Cast to ConfigStageData to handle both EtapaFlujo and StageData formats
    const stageData = stage as unknown as ConfigStageData
    const nodeId = String(stageData.id || stageData.node_id || '')
    const label = stageData.label || `Etapa ${nodeId}`
    const tiempoEspera = stageData.tiempo_espera ?? stageData.dia_envio ?? 0

    cumulativeDays += tiempoEspera

    map.set(nodeId, {
      label,
      dayLabel: resolveStageDayLabel(cumulativeDays),
    })
  }

  return map
}

// ============================================================================
// Sub-Components
// ============================================================================

function StageTimelineItem({ stage, stageLabel, isLast, metricasNuevos, tipoMensaje, esPerpetuo }: StageTimelineItemProps) {
  const metrics = calculateStageMetrics(stage.envios)
  const channelBreakdown = calculateChannelBreakdown(stage.envios?.enviado ?? 0, tipoMensaje)

  // `primer_envio_at` es la verdad sobre "esta etapa ya envió al menos una vez".
  // En flujos perpetuos, `estado` puede volver a `pending` después de un batch
  // (para que CatchUp reprocese nuevos prospectos). Por eso no podemos confiar
  // solo en `estado` para distinguir "nunca se ejecutó" vs "perpetua esperando próximo batch".
  const hasEverExecuted = !!stage.primer_envio_at
  const isFailed = stage.estado === STAGE_STATUS.FAILED
  const isExecuting = stage.estado === STAGE_STATUS.EXECUTING

  // Una etapa es "Recurrente" si:
  // - El flujo es perpetuo Y ya ejecutó al menos una vez (cualquier estado salvo executing/failed)
  // - O si tiene estado=pending pero ya ejecutó (caso clásico de perpetual re-pending)
  const isRecurring =
    !isExecuting &&
    !isFailed &&
    hasEverExecuted &&
    (esPerpetuo === true || stage.estado === STAGE_STATUS.PENDING)

  const isCompleted =
    stage.estado === STAGE_STATUS.COMPLETED ||
    (hasEverExecuted && !isExecuting && !isFailed)
  const isPending = !hasEverExecuted && stage.estado === STAGE_STATUS.PENDING

  // Para colors: usar 'completed' visual cuando ya ejecutó alguna vez
  const visualState: StageExecutionState = isRecurring
    ? STAGE_STATUS.COMPLETED
    : stage.estado
  const colors = getStatusColors(visualState)

  return (
    <div className="relative flex items-start gap-3 pb-3">
      {/* Vertical line connecting to next item */}
      {!isLast && (
        <div
          className={cn(
            'absolute left-[11px] top-6 bottom-0 w-0.5',
            colors.line,
          )}
        />
      )}

      {/* Status icon */}
      <div
        className={cn(
          'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
          colors.icon,
        )}
      >
        {getStatusIcon(stage.estado)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('font-semibold text-sm', colors.text)}>
            {stageLabel}
          </span>

          {/* Status badge */}
          {isFailed && (
            <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-red-100 text-red-700 border border-red-200">
              Fallido
            </span>
          )}
          {isRecurring && (() => {
            const fechaProg = stage.fecha_programada ? new Date(stage.fecha_programada) : null
            const esFutura = fechaProg && fechaProg.getTime() > Date.now()
            return (
              <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-purple-50 text-purple-700 border border-purple-200">
                {esFutura
                  ? `♾️ Recurrente · próximo batch ${formatFechaProgramada(stage.fecha_programada)}`
                  : '♾️ Recurrente · activa'}
              </span>
            )
          })()}
        </div>

        {/* Metrics for completed/executing stages - FORMATO CLARO */}
        {(isCompleted || isExecuting) && metrics && metrics.alcanzados > 0 && (
          <div className="mt-2 p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 flex-wrap text-sm">
              {/* Prospectos únicos */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-2 py-1 bg-white rounded border border-slate-200 cursor-help">
                    <Users className="h-4 w-4 text-slate-600" />
                    <span className="font-bold text-slate-800">{metrics.alcanzados}</span>
                    <span className="text-slate-500 text-xs">prospectos</span>
                    <HelpCircle className="h-3 w-3 text-slate-400" />
                    {metricasNuevos && metricasNuevos.prospectos_alcanzados > 0 && (
                      <span className="text-purple-600 text-xs font-medium">
                        ({metricasNuevos.prospectos_alcanzados} nuevos)
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-lg">
                  Personas únicas que recibieron este mensaje
                </TooltipContent>
              </Tooltip>
              
              <span className="text-slate-400">→</span>
              
              {/* Envíos (total enviados) */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-2 py-1 bg-white rounded border border-blue-200 cursor-help">
                    {tipoMensaje === 'ambos' ? (
                      <>
                        <Mail className="h-4 w-4 text-blue-600" />
                        <Smartphone className="h-4 w-4 text-blue-600 -ml-1" />
                      </>
                    ) : tipoMensaje === 'sms' ? (
                      <Smartphone className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Mail className="h-4 w-4 text-blue-600" />
                    )}
                    <span className="font-bold text-blue-700">{stage.envios?.enviado ?? 0}</span>
                    <span className="text-blue-500 text-xs">envíos</span>
                    {channelBreakdown && (
                      <span className="text-blue-500 text-xs">
                        ({channelBreakdown.emails} 📧 + {channelBreakdown.sms} 📱)
                      </span>
                    )}
                    <HelpCircle className="h-3 w-3 text-blue-400" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-lg">
                  Total de mensajes enviados
                </TooltipContent>
              </Tooltip>
              
              <span className="text-slate-400">→</span>
              
              {/* Abiertos */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-2 py-1 bg-white rounded border border-green-200 cursor-help">
                    <Eye className="h-4 w-4 text-green-600" />
                    <span className="font-bold text-green-700">{stage.envios?.abierto ?? 0}</span>
                    <span className="text-green-500 text-xs">abiertos</span>
                    <span className="text-green-600 text-xs font-medium">({metrics.porcentajeAbiertos}%)</span>
                    <HelpCircle className="h-3 w-3 text-green-400" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-lg">
                  Mensajes que fueron abiertos por los prospectos
                </TooltipContent>
              </Tooltip>
              
              <span className="text-slate-400">→</span>
              
              {/* Clicks */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-2 py-1 bg-white rounded border border-purple-200 cursor-help">
                    <MousePointer className="h-4 w-4 text-purple-600" />
                    <span className="font-bold text-purple-700">{stage.envios?.clickeado ?? 0}</span>
                    <span className="text-purple-500 text-xs">clicks</span>
                    <span className="text-purple-600 text-xs font-medium">({metrics.porcentajeClicks}%)</span>
                    <HelpCircle className="h-3 w-3 text-purple-400" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-lg">
                  Prospectos que hicieron click en algún enlace del mensaje
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}

        {/* In progress indicator */}
        {isExecuting && (!metrics || metrics.alcanzados === 0) && (
          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            En progreso...
          </p>
        )}

        {/* Pending date */}
        {isPending && stage.fecha_programada && (
          <p className="text-xs text-slate-500 mt-1">
            Pendiente ({formatFechaProgramada(stage.fecha_programada)})
          </p>
        )}

        {/* Error message for failed stages */}
        {isFailed && stage.error_mensaje && (
          <p className="text-xs text-red-600 mt-1 truncate" title={stage.error_mensaje}>
            {stage.error_mensaje}
          </p>
        )}
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-6 text-sm text-segal-dark/60">
      <Loader2 className="h-4 w-4 animate-spin mr-2" />
      Cargando historial de etapas...
    </div>
  )
}

function ErrorState({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-6 text-sm text-red-600">
      <AlertTriangle className="h-4 w-4 mr-2" />
      {message || 'Error al cargar el historial'}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="py-6 text-center text-sm text-segal-dark/50">
      No hay etapas registradas para esta ejecución
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function EtapasHistoryTimeline({
  flujoId,
  ejecucionId,
  configStructure,
  tipoMensaje: tipoMensajeProp,
  esPerpetuo: esPerpetuoProp,
}: EtapasHistoryTimelineProps) {
  const { data, isLoading, isError, error } = useFlowExecutionDetail(
    flujoId,
    ejecucionId,
    true, // enabled
  )

  // Build stage label map from config_structure
  // React 19 Compiler handles memoization automatically
  const stageLabelMap = buildStageLabelMap(configStructure)

  // Infer tipoMensaje from stages if not provided explicitly
  const tipoMensaje = tipoMensajeProp ?? inferirCanalEnvioDesdeEtapas(configStructure?.stages)

  // Prefer prop over API response (prop is authoritative when parent knows the flujo is perpetual)
  const esPerpetuo = esPerpetuoProp ?? data?.data?.es_perpetuo ?? false

  // Sort stages by fecha_programada to show in chronological order
  const etapas = data?.data?.etapas
  const metricasSync = data?.data?.metricas_sync
  const sortedStages = etapas
    ? [...etapas].sort((a, b) => {
        const dateA = new Date(a.fecha_programada).getTime()
        const dateB = new Date(b.fecha_programada).getTime()
        return dateA - dateB
      })
    : []

  if (isLoading) {
    return <LoadingState />
  }

  if (isError) {
    return <ErrorState message={(error as Error)?.message} />
  }

  if (sortedStages.length === 0) {
    return <EmptyState />
  }

  return (
    <div
      data-tour="etapas-timeline"
      className="bg-white rounded-lg p-4 border border-segal-blue/10"
    >
      <h4 className="text-sm font-semibold text-segal-dark mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-segal-blue" />
        Historial de Etapas
      </h4>

      {/* Resumen de nuevos en últimas 24 horas */}
      {metricasSync && metricasSync.total_nuevos > 0 && (
        <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-purple-800 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Nuevos en últimas 24 horas
            </span>
            <span className="text-xs text-purple-600">
              {metricasSync.periodo_legible ?? 'Últimas 24 horas'}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="bg-white rounded p-2 border border-purple-100">
              <p className="text-lg font-bold text-purple-700">{metricasSync.total_nuevos}</p>
              <p className="text-xs text-purple-600">Prospectos únicos</p>
            </div>
            <div className="bg-white rounded p-2 border border-purple-100">
              <p className="text-lg font-bold text-segal-dark">{metricasSync.resumen.enviados}</p>
              <p className="text-xs text-segal-dark/60">Envíos</p>
            </div>
            <div className="bg-white rounded p-2 border border-purple-100">
              <p className="text-lg font-bold text-green-600">{metricasSync.resumen.abiertos}</p>
              <p className="text-xs text-green-600">{metricasSync.resumen.tasa_apertura}% abiertos</p>
            </div>
            <div className="bg-white rounded p-2 border border-purple-100">
              <p className="text-lg font-bold text-blue-600">{metricasSync.resumen.clicks}</p>
              <p className="text-xs text-blue-600">{metricasSync.resumen.tasa_clicks}% clicks</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-0">
        {sortedStages.map((stage, index) => {
          const stageInfo = stageLabelMap.get(stage.node_id)
          const label = stageInfo
            ? `${stageInfo.dayLabel} | ${stageInfo.label}`
            : stage.node_id
          
          // Get nuevos metrics for this stage
          const metricasNuevos = metricasSync?.nuevos_por_etapa?.[stage.node_id]

          return (
            <StageTimelineItem
              key={stage.id}
              stage={stage}
              stageLabel={label}
              isLast={index === sortedStages.length - 1}
              metricasNuevos={metricasNuevos}
              tipoMensaje={tipoMensaje}
              esPerpetuo={esPerpetuo}
            />
          )
        })}
      </div>
    </div>
  )
}
