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

import { Check, Circle, Clock, Loader2, AlertTriangle } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { ConfigStructure } from '@/types/flujo'
import type {
  StageExecution,
  StageExecutionState,
} from '@/types/flowExecutionTracking'
import { useFlowExecutionDetail } from '../../hooks/useFlowExecutionTracking'

// ============================================================================
// Types
// ============================================================================

interface EtapasHistoryTimelineProps {
  flujoId: number
  ejecucionId: number
  configStructure?: ConfigStructure
}

interface StageTimelineItemProps {
  stage: StageExecution
  stageLabel: string
  isLast: boolean
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

function StageTimelineItem({ stage, stageLabel, isLast }: StageTimelineItemProps) {
  const colors = getStatusColors(stage.estado)
  const metrics = calculateStageMetrics(stage.envios)

  const isCompleted = stage.estado === STAGE_STATUS.COMPLETED
  const isExecuting = stage.estado === STAGE_STATUS.EXECUTING
  const isPending = stage.estado === STAGE_STATUS.PENDING
  const isFailed = stage.estado === STAGE_STATUS.FAILED

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
        </div>

        {/* Metrics for completed/executing stages */}
        {(isCompleted || isExecuting) && metrics && metrics.alcanzados > 0 && (
          <div className="flex items-center gap-3 mt-1 text-xs text-segal-dark/70">
            <span>
              <strong>{metrics.alcanzados.toLocaleString()}</strong> alcanzados
            </span>
            <span className="text-green-600">
              {metrics.porcentajeAbiertos}% abiertos
            </span>
            <span className="text-blue-600">
              {metrics.porcentajeClicks}% clicks
            </span>
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
}: EtapasHistoryTimelineProps) {
  const { data, isLoading, isError, error } = useFlowExecutionDetail(
    flujoId,
    ejecucionId,
    true, // enabled
  )

  // Build stage label map from config_structure
  // React 19 Compiler handles memoization automatically
  const stageLabelMap = buildStageLabelMap(configStructure)

  // Sort stages by fecha_programada to show in chronological order
  const etapas = data?.data?.etapas
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

      <div className="space-y-0">
        {sortedStages.map((stage, index) => {
          const stageInfo = stageLabelMap.get(stage.node_id)
          const label = stageInfo
            ? `${stageInfo.dayLabel} | ${stageInfo.label}`
            : stage.node_id

          return (
            <StageTimelineItem
              key={stage.id}
              stage={stage}
              stageLabel={label}
              isLast={index === sortedStages.length - 1}
            />
          )
        })}
      </div>
    </div>
  )
}
