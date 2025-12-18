/**
 * ExecutionHistoryPanel
 * 
 * Displays the execution history of a flow with expandable cards showing
 * the timeline of each stage/node execution.
 * 
 * Features:
 * - Collapsible execution cards
 * - Stage timeline with status indicators
 * - Human-readable node labels from configVisual
 * - Duration and prospect count display
 * 
 * @module ExecutionHistoryPanel
 */

import { useMemo, useState } from 'react'

import { 
  CheckCircle2, 
  ChevronDown,
  ChevronRight,
  Clock, 
  Eye, 
  GitBranch,
  Loader2,
  Mail,
  MessageSquare,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { ExecutionListItem, ExecutionStageItem } from '@/types/flowExecutionTracking'
import type { ConfigVisual } from '@/types/flujo'

import { useNodeLabelMap } from '../../hooks/useNodeLabelMap'
import {
  calculateExecutionDuration,
  formatExecutionDate,
  getExecutionStateColor,
  getExecutionStateIcon,
  getExecutionStateLabel,
} from '../../utils/executionStateHelpers'

// ============================================================================
// Types
// ============================================================================

interface ExecutionHistoryPanelProps {
  ejecuciones: ExecutionListItem[] | undefined
  isLoading?: boolean
  onViewExecution?: (ejecucionId: number) => void
  configVisual?: ConfigVisual
}

interface StageItemProps {
  stage: ExecutionStageItem
  nodeLabel: string
  isLast: boolean
}

interface ExecutionCardProps {
  ejecucion: ExecutionListItem
  nodeLabelMap: Map<string, string>
  onViewExecution?: (ejecucionId: number) => void
  defaultExpanded?: boolean
}

interface StageStatistics {
  total: number
  completed: number
  failed: number
  pending: number
  executing: number
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Infers the node type icon based on node ID patterns
 */
function getNodeTypeIcon(nodeId: string) {
  if (nodeId.includes('email') || nodeId.includes('mail')) {
    return <Mail className="h-4 w-4" />
  }
  if (nodeId.includes('sms') || nodeId.includes('message')) {
    return <MessageSquare className="h-4 w-4" />
  }
  if (nodeId.includes('condition') || nodeId.includes('branch')) {
    return <GitBranch className="h-4 w-4" />
  }
  return <CheckCircle2 className="h-4 w-4" />
}

/**
 * Sorts stages by scheduled date
 */
function sortStagesByDate(stages: ExecutionStageItem[]): ExecutionStageItem[] {
  return [...stages].sort((a, b) => {
    const dateA = new Date(a.fecha_programada).getTime()
    const dateB = new Date(b.fecha_programada).getTime()
    return dateA - dateB
  })
}

/**
 * Calculates statistics from stages array
 */
function calculateStageStatistics(stages: ExecutionStageItem[]): StageStatistics | null {
  if (stages.length === 0) return null
  
  return {
    total: stages.length,
    completed: stages.filter(s => s.estado === 'completed').length,
    failed: stages.filter(s => s.estado === 'failed').length,
    pending: stages.filter(s => s.estado === 'pending').length,
    executing: stages.filter(s => s.estado === 'executing').length,
  }
}

// ============================================================================
// Sub-Components
// ============================================================================

function StageItem({ stage, nodeLabel, isLast }: StageItemProps) {
  const colorClass = getExecutionStateColor(stage.estado)
  
  return (
    <div className="relative pl-8">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-gray-200" />
      )}
      
      {/* Timeline dot */}
      <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center ${colorClass}`}>
        {getExecutionStateIcon(stage.estado, 'h-3 w-3')}
      </div>
      
      {/* Content */}
      <div className={`pb-4 ${isLast ? '' : 'border-b border-gray-100 mb-4'}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {getNodeTypeIcon(stage.node_id)}
              <span className="font-medium text-segal-dark">{nodeLabel}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colorClass}`}>
                {getExecutionStateLabel(stage.estado)}
              </span>
            </div>
            
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-segal-dark/60">
              <div>
                <span className="font-medium">Programada:</span>{' '}
                {formatExecutionDate(stage.fecha_programada)}
              </div>
              {stage.fecha_ejecucion && (
                <div>
                  <span className="font-medium">Ejecutada:</span>{' '}
                  {formatExecutionDate(stage.fecha_ejecucion)}
                </div>
              )}
            </div>
            
            {stage.error_mensaje && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                <span className="font-medium">Error:</span> {stage.error_mensaje}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ExecutionCard({ ejecucion, nodeLabelMap, onViewExecution, defaultExpanded = false }: ExecutionCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  
  const colorClass = getExecutionStateColor(ejecucion.estado)
  const fechaInicio = ejecucion.fecha_inicio_real ?? ejecucion.fecha_inicio_programada ?? ejecucion.created_at
  const duracion = calculateExecutionDuration(fechaInicio, ejecucion.fecha_fin)
  
  const etapasOrdenadas = useMemo(() => {
    if (!ejecucion.etapas) return []
    return sortStagesByDate(ejecucion.etapas)
  }, [ejecucion.etapas])
  
  const estadisticas = useMemo(() => 
    calculateStageStatistics(etapasOrdenadas),
    [etapasOrdenadas]
  )

  const handleToggleExpand = () => setIsExpanded(prev => !prev)
  
  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onViewExecution?.(ejecucion.id)
  }
  
  return (
    <div className="border border-segal-blue/10 rounded-lg overflow-hidden bg-white hover:border-segal-blue/20 transition-colors">
      {/* Header - Always visible */}
      <button
        type="button"
        onClick={handleToggleExpand}
        className="w-full p-4 flex items-center justify-between gap-4 hover:bg-segal-blue/5 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-2 rounded-lg border ${colorClass}`}>
            {getExecutionStateIcon(ejecucion.estado)}
          </div>
          <div className="text-left">
            <p className="font-semibold text-segal-dark">
              Ejecucion #{ejecucion.id}
            </p>
            <p className="text-sm text-segal-dark/60">
              {formatExecutionDate(fechaInicio)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Mini stats */}
          {estadisticas && (
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-green-600" title="Completadas">
                {estadisticas.completed}/{estadisticas.total}
              </span>
              {estadisticas.failed > 0 && (
                <span className="text-red-600" title="Fallidas">
                  {estadisticas.failed} fallidas
                </span>
              )}
            </div>
          )}
          
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${colorClass}`}>
            {getExecutionStateLabel(ejecucion.estado)}
          </span>
          
          {onViewExecution && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleViewClick}
              className="border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5"
              title="Ver monitoreo visual"
            >
              <Eye className="h-3 w-3 mr-1" />
              Ver
            </Button>
          )}
          
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-segal-dark/40" />
          ) : (
            <ChevronRight className="h-5 w-5 text-segal-dark/40" />
          )}
        </div>
      </button>
      
      {/* Expanded content - Stages */}
      {isExpanded && (
        <ExpandedContent
          duracion={duracion}
          prospectosCount={ejecucion.prospectos_ids?.length}
          etapasOrdenadas={etapasOrdenadas}
          nodeLabelMap={nodeLabelMap}
        />
      )}
    </div>
  )
}

interface ExpandedContentProps {
  duracion: string
  prospectosCount?: number
  etapasOrdenadas: ExecutionStageItem[]
  nodeLabelMap: Map<string, string>
}

function ExpandedContent({ duracion, prospectosCount, etapasOrdenadas, nodeLabelMap }: ExpandedContentProps) {
  return (
    <div className="border-t border-segal-blue/10 p-4 bg-segal-blue/5">
      {/* General info */}
      <div className="flex items-center gap-4 mb-4 text-sm text-segal-dark/70">
        <span>
          <span className="font-medium">Duracion:</span> {duracion}
        </span>
        {prospectosCount !== undefined && (
          <span>
            <span className="font-medium">Prospectos:</span> {prospectosCount}
          </span>
        )}
      </div>
      
      {/* Stages timeline */}
      {etapasOrdenadas.length > 0 ? (
        <div className="bg-white rounded-lg p-4 border border-segal-blue/10">
          <p className="text-sm font-semibold text-segal-dark mb-4">
            Historial de Etapas ({etapasOrdenadas.length})
          </p>
          <div>
            {etapasOrdenadas.map((stage, index) => (
              <StageItem
                key={stage.id}
                stage={stage}
                nodeLabel={nodeLabelMap.get(stage.node_id) ?? stage.node_id}
                isLast={index === etapasOrdenadas.length - 1}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg p-4 border border-segal-blue/10 text-center text-sm text-segal-dark/50">
          No hay etapas registradas para esta ejecucion
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Loading & Empty States
// ============================================================================

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-segal-blue/5 rounded-lg border border-segal-blue/10">
      <Loader2 className="h-12 w-12 text-segal-blue/40 mb-3 animate-spin" />
      <p className="text-segal-dark/60 font-medium">Cargando ejecuciones...</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-segal-blue/5 rounded-lg border border-segal-blue/10">
      <Clock className="h-12 w-12 text-segal-blue/40 mb-3" />
      <p className="text-segal-dark/60 font-medium">No hay ejecuciones registradas</p>
      <p className="text-sm text-segal-dark/40 mt-1">Este flujo aun no ha sido ejecutado</p>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function ExecutionHistoryPanel({ 
  ejecuciones, 
  isLoading, 
  onViewExecution,
  configVisual 
}: ExecutionHistoryPanelProps) {
  const nodeLabelMap = useNodeLabelMap(configVisual)

  if (isLoading) {
    return <LoadingState />
  }

  if (!ejecuciones || ejecuciones.length === 0) {
    return <EmptyState />
  }

  const ejecutionCount = ejecuciones.length
  const pluralSuffix = ejecutionCount !== 1 ? 'es' : ''

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-segal-dark">Historial de Ejecuciones</h3>
        <span className="text-sm text-segal-dark/60">
          {ejecutionCount} ejecucion{pluralSuffix}
        </span>
      </div>

      <div className="space-y-3">
        {ejecuciones.map((ejecucion, index) => (
          <ExecutionCard
            key={ejecucion.id}
            ejecucion={ejecucion}
            nodeLabelMap={nodeLabelMap}
            onViewExecution={onViewExecution}
            defaultExpanded={index === 0}
          />
        ))}
      </div>
    </div>
  )
}
