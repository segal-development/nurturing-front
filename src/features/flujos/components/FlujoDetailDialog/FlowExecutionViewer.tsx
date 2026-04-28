/**
 * Visor de ejecución en tiempo real del flujo
 * Muestra el estado de cada nodo (pending, executing, completed, failed)
 * Con iconos, colores y animaciones que indican el progreso
 */

import { useEffect, useState, useMemo } from 'react'
import { logger } from '@/lib/logger'

import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Eye, Loader2, Pause, PauseCircle, Play, Trash2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { formatCurrency, useCostoEjecucion } from '@/features/costos/hooks'
import type { StageExecution } from '@/types/flowExecutionTracking'
import type { ConfigVisual } from '@/types/flujo'

import { useCancelExecution, useCohortesActivas, useFlowExecutionDetail, usePauseExecution, useResumeExecution } from '../../hooks/useFlowExecutionTracking'
import { useNodeLabelMap } from '../../hooks/useNodeLabelMap'
import { ConditionalNode } from '../FlowBuilder/CustomNodes/ConditionalNode'
import { EndNode } from '../FlowBuilder/CustomNodes/EndNode'
import { InitialNode } from '../FlowBuilder/CustomNodes/InitialNode'
import { StageNode } from '../FlowBuilder/CustomNodes/StageNode'
import { N8nStyleEdge } from '../FlowBuilder/CustomEdges/N8nStyleEdge'
import { CancelExecutionDialog } from './CancelExecutionDialog'
import { PlantillaPreviewDrawer } from '../FlowBuilder/components/PlantillaPreviewDrawer'
import type { TipoMensaje } from '@/types/flujo'

interface FlowExecutionViewerProps {
  flujoId: number
  ejecucionId: number
  configVisual?: ConfigVisual
}

const edgeTypes = {
  animated: N8nStyleEdge,
}

/**
 * Datos del nodo visual para preview de plantilla
 */
interface NodeVisualData {
  label?: string
  plantilla_type?: 'reference' | 'inline'
  plantilla_id?: number
  plantilla_id_email?: number
  tipo_mensaje?: TipoMensaje
}

/**
 * Panel de detalles de un nodo - versión simplificada
 * Solo muestra: nombre, estado, métrica clave, botón plantilla, link a detalles
 * La info completa está en el SelectedNodePanel del panel lateral
 */
function StageDetailPanel({ 
  stage, 
  isOpen, 
  onClose,
  nodeData,
  nodeLabel
}: { 
  stage: StageExecution | null
  isOpen: boolean
  onClose: () => void
  nodeData?: NodeVisualData
  nodeLabel?: string
}) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  
  if (!isOpen || !stage) return null
  
  const hasPlantilla = nodeData?.plantilla_type === 'reference' && 
    (nodeData?.plantilla_id || nodeData?.plantilla_id_email)

  const getStateConfig = () => {
    switch (stage.estado) {
      case 'completed':
        return { 
          icon: <CheckCircle2 className="h-4 w-4" />, 
          label: 'Completada', 
          color: 'text-green-600',
          dot: 'bg-green-500'
        }
      case 'executing':
        return { 
          icon: <Loader2 className="h-4 w-4 animate-spin" />, 
          label: 'Ejecutándose', 
          color: 'text-amber-600',
          dot: 'bg-amber-500'
        }
      case 'failed':
        return { 
          icon: <AlertCircle className="h-4 w-4" />, 
          label: 'Falló', 
          color: 'text-red-600',
          dot: 'bg-red-500'
        }
      case 'paused':
        return { 
          icon: <PauseCircle className="h-4 w-4" />, 
          label: 'Pausada', 
          color: 'text-orange-500',
          dot: 'bg-orange-500'
        }
      default:
        return { 
          icon: <AlertCircle className="h-4 w-4" />, 
          label: 'Pendiente', 
          color: 'text-gray-500',
          dot: 'bg-gray-400'
        }
    }
  }

  const stateConfig = getStateConfig()
  
  // Calcular métrica clave: enviados y tasa de éxito
  const getKeyMetric = () => {
    if (!stage.envios) return null
    const enviados = stage.envios.enviado || 0
    const fallidos = stage.envios.fallido || 0
    const total = enviados + fallidos
    if (total === 0) return null
    const tasa = ((enviados / total) * 100).toFixed(0)
    return `${enviados.toLocaleString()} enviados · ${tasa}% éxito`
  }

  const keyMetric = getKeyMetric()
  const displayName = nodeLabel || nodeData?.label || stage.node_id

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-72 overflow-hidden border border-gray-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header compacto */}
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-segal-dark text-sm truncate" title={displayName}>
            {displayName}
          </h3>
          <div className={`flex items-center gap-1.5 mt-1 ${stateConfig.color}`}>
            <span className={`w-2 h-2 rounded-full ${stateConfig.dot}`} />
            <span className="text-xs font-medium">{stateConfig.label}</span>
          </div>
        </div>

        {/* Contenido */}
        <div className="px-4 py-3 space-y-3">
          {/* Métrica clave */}
          {keyMetric && (
            <p className="text-sm text-segal-dark/70 text-center bg-gray-50 rounded-lg py-2 px-3">
              {keyMetric}
            </p>
          )}

          {/* Error si hay */}
          {stage.error_mensaje && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg py-2 px-3 line-clamp-2">
              {stage.error_mensaje}
            </p>
          )}

          {/* Botón Ver Plantilla - destacado */}
          {hasPlantilla && (
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="w-full px-4 py-2.5 bg-segal-blue text-white rounded-lg hover:bg-segal-blue/90 transition-colors flex items-center justify-center gap-2 font-medium text-sm"
            >
              <Eye className="h-4 w-4" />
              Ver plantilla
            </button>
          )}

          {/* Link a detalles completos */}
          <button
            onClick={onClose}
            className="w-full text-center text-xs text-segal-blue hover:text-segal-blue/80 transition-colors py-1"
          >
            Ver detalles en panel lateral →
          </button>
        </div>
      </div>
      
      {/* Drawer de preview */}
      {hasPlantilla && (
        <PlantillaPreviewDrawer
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          plantillaId={nodeData?.plantilla_id}
          plantillaIdEmail={nodeData?.plantilla_id_email}
          tipoMensaje={nodeData?.tipo_mensaje}
          nodeLabel={displayName}
        />
      )}
    </div>
  )
}

/**
 * Panel inline que muestra estadísticas del nodo seleccionado
 * Se muestra en el panel lateral cuando el usuario hace click en un nodo
 * 
 * Diseño: Funnel visual que muestra la conversión Enviados → Abiertos → Clicks
 * con métricas de salud (tasa de entrega, apertura, clicks) coloreadas por umbral
 */
interface SelectedNodePanelProps {
  nodeId: string | null
  stage: StageExecution | null
  nodeLabel: string
  onClear: () => void
}

/**
 * Obtiene el color según el valor del porcentaje y los umbrales
 * Verde >= bueno, Amarillo >= regular, Rojo < regular
 */
function getHealthColor(value: number, goodThreshold: number, regularThreshold: number): string {
  if (value >= goodThreshold) return 'text-green-600'
  if (value >= regularThreshold) return 'text-amber-600'
  return 'text-red-600'
}

function getHealthBgColor(value: number, goodThreshold: number, regularThreshold: number): string {
  if (value >= goodThreshold) return 'bg-green-50 border-green-200'
  if (value >= regularThreshold) return 'bg-amber-50 border-amber-200'
  return 'bg-red-50 border-red-200'
}

function SelectedNodePanel({ nodeId, stage, nodeLabel, onClear }: SelectedNodePanelProps) {
  if (!nodeId) return null

  // Estado visual config
  const getStateConfig = () => {
    if (!stage) return { 
      label: 'Sin ejecución', 
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-600',
      dotColor: 'bg-gray-400'
    }
    switch (stage.estado) {
      case 'completed':
        return { 
          label: 'Completada', 
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          dotColor: 'bg-green-500'
        }
      case 'executing':
        return { 
          label: 'Ejecutándose', 
          bgColor: 'bg-amber-100',
          textColor: 'text-amber-700',
          dotColor: 'bg-amber-500 animate-pulse'
        }
      case 'failed':
        return { 
          label: 'Falló', 
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          dotColor: 'bg-red-500'
        }
      case 'paused':
        return { 
          label: 'Pausada', 
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-700',
          dotColor: 'bg-orange-500'
        }
      default:
        return { 
          label: 'Pendiente', 
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-600',
          dotColor: 'bg-gray-400'
        }
    }
  }

  const stateConfig = getStateConfig()

  // Calcular métricas del funnel
  const envios = stage?.envios
  const enviados = envios?.enviado || 0
  const fallidos = envios?.fallido || 0
  const abiertos = envios?.abierto || 0
  const clickeados = envios?.clickeado || 0
  const pendientes = envios?.pendiente || 0
  
  // Tasas de conversión
  const totalProcesados = enviados + fallidos
  const tasaEntrega = totalProcesados > 0 ? (enviados / totalProcesados) * 100 : 0
  const tasaApertura = enviados > 0 ? (abiertos / enviados) * 100 : 0
  const tasaClicks = abiertos > 0 ? (clickeados / abiertos) * 100 : 0

  // Porcentajes para las barras del funnel (relativo al máximo = enviados)
  const maxValue = Math.max(enviados, 1) // Evitar división por 0
  const abiertosPercent = (abiertos / maxValue) * 100
  const clicksPercent = (clickeados / maxValue) * 100

  // Formato de fecha legible
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-CL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }) + ' ' + date.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="rounded-lg border-2 bg-white border-segal-blue/20 overflow-hidden shadow-lg transition-all duration-200 w-64">
      {/* Header con nombre y estado */}
      <div className="px-3 py-2.5 bg-gradient-to-r from-segal-blue/5 to-transparent border-b border-segal-blue/10">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-segal-dark text-sm truncate" title={nodeLabel}>
              {nodeLabel}
            </p>
            {/* Badge de estado */}
            <span className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${stateConfig.bgColor} ${stateConfig.textColor}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${stateConfig.dotColor}`} />
              {stateConfig.label}
            </span>
          </div>
          <button
            onClick={onClear}
            className="text-segal-dark/40 hover:text-segal-dark/70 transition-colors p-1 -mr-1 -mt-0.5"
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Fecha de ejecución */}
        {stage?.fecha_ejecucion && (
          <p className="text-xs text-segal-dark/60 mt-1.5">
            📅 {formatDate(stage.fecha_ejecucion)}
          </p>
        )}
        {stage?.fecha_programada && !stage?.fecha_ejecucion && (
          <p className="text-xs text-amber-600 mt-1.5">
            ⏳ Programado: {formatDate(stage.fecha_programada)}
          </p>
        )}
      </div>

      {/* Error message si falló */}
      {stage?.error_mensaje && (
        <div className="px-3 py-2 bg-red-50 border-b border-red-200">
          <p className="text-xs text-red-700 font-medium">⚠️ Error:</p>
          <p className="text-xs text-red-600 mt-0.5 line-clamp-2">{stage.error_mensaje}</p>
        </div>
      )}

      {/* Funnel Visual */}
      {envios && enviados > 0 ? (
        <div className="px-3 py-3 space-y-2">
          <p className="text-xs font-semibold text-segal-dark/70 uppercase tracking-wide mb-2">
            Funnel de conversión
          </p>
          
          {/* Enviados - Base del funnel (100%) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-segal-dark font-medium">
                📤 Enviados
              </span>
              <span className="font-bold text-segal-dark">{enviados.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-segal-blue h-full rounded-full transition-all duration-500"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Abiertos */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-segal-dark font-medium">
                📬 Abiertos
              </span>
              <span className="font-bold text-segal-dark">
                {abiertos.toLocaleString()}
                <span className="font-normal text-segal-dark/60 ml-1">
                  ({tasaApertura.toFixed(1)}%)
                </span>
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(abiertosPercent, 2)}%` }}
              />
            </div>
          </div>

          {/* Clicks */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-segal-dark font-medium">
                🖱️ Clicks
              </span>
              <span className="font-bold text-segal-dark">
                {clickeados.toLocaleString()}
                <span className="font-normal text-segal-dark/60 ml-1">
                  ({abiertos > 0 ? tasaClicks.toFixed(1) : '0.0'}%)
                </span>
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-purple-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(clicksPercent, clickeados > 0 ? 2 : 0)}%` }}
              />
            </div>
          </div>
        </div>
      ) : envios && enviados === 0 && pendientes > 0 ? (
        <div className="px-3 py-3">
          <p className="text-xs text-amber-600 font-medium">
            ⏳ {pendientes.toLocaleString()} mensajes pendientes de envío
          </p>
        </div>
      ) : null}

      {/* Métricas de Salud */}
      {envios && totalProcesados > 0 && (
        <div className="px-3 py-2.5 bg-gray-50/80 border-t border-gray-100">
          <p className="text-xs font-semibold text-segal-dark/70 uppercase tracking-wide mb-2">
            Métricas de salud
          </p>
          <div className="space-y-1.5">
            {/* Tasa de entrega */}
            <div className={`flex items-center justify-between text-xs px-2 py-1.5 rounded border ${getHealthBgColor(tasaEntrega, 95, 85)}`}>
              <span className="text-segal-dark/80">Tasa de entrega</span>
              <span className={`font-bold ${getHealthColor(tasaEntrega, 95, 85)}`}>
                {tasaEntrega.toFixed(1)}%
              </span>
            </div>
            
            {/* Tasa de apertura */}
            <div className={`flex items-center justify-between text-xs px-2 py-1.5 rounded border ${getHealthBgColor(tasaApertura, 25, 15)}`}>
              <span className="text-segal-dark/80">Tasa de apertura</span>
              <span className={`font-bold ${getHealthColor(tasaApertura, 25, 15)}`}>
                {tasaApertura.toFixed(1)}%
              </span>
            </div>
            
            {/* Tasa de clicks (solo si hay abiertos) */}
            {abiertos > 0 && (
              <div className={`flex items-center justify-between text-xs px-2 py-1.5 rounded border ${getHealthBgColor(tasaClicks, 5, 2)}`}>
                <span className="text-segal-dark/80">Tasa de clicks</span>
                <span className={`font-bold ${getHealthColor(tasaClicks, 5, 2)}`}>
                  {tasaClicks.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          
          {/* Fallidos si hay */}
          {fallidos > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-red-600">
                <span>❌ Fallidos</span>
                <span className="font-bold">{fallidos.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Si no hay stats de envío pero hay stage */}
      {stage && !stage.envios && (
        <div className="px-3 py-3">
          <p className="text-xs text-segal-dark/60 italic">Sin estadísticas de envío aún</p>
        </div>
      )}

      {/* Si no hay stage (nodo no ejecutado) */}
      {!stage && (
        <div className="px-3 py-3">
          <p className="text-xs text-segal-dark/60 italic">Este nodo aún no tiene datos de ejecución</p>
        </div>
      )}
    </div>
  )
}

/**
 * Componente interno que usa ReactFlow
 */
function FlowExecutionContent({
  configVisual,
  flujoId,
  ejecucionId,
}: Omit<FlowExecutionViewerProps, 'flujoId' | 'ejecucionId'> & {
  flujoId: number
  ejecucionId: number
}) {
  const { data: executionResponse, refetch } = useFlowExecutionDetail(
    flujoId,
    ejecucionId,
    true,
  )
  const { mutate: pauseExecution, isPending: isPausing } = usePauseExecution()
  const { mutate: resumeExecution, isPending: isResuming } = useResumeExecution()
  const { mutate: cancelExecution, isPending: isCanceling } = useCancelExecution()

  // Get execution cost
  const { data: costoEjecucion } = useCostoEjecucion(ejecucionId)

  // Get cohorts data for "Últimos ingresos" panel
  const { data: cohortesData } = useCohortesActivas(flujoId, true)
  const ultimosIngresos = cohortesData?.data?.ultimos_ingresos

  // Node types for compact rendering — execution state data is injected into node.data
  // and displayed via the StageDetailPanel / SelectedNodePanel, not on the node itself.
  const nodeTypes = useMemo(() => ({
    stage: StageNode,
    initial: InitialNode,
    end: EndNode,
    conditional: ConditionalNode,
  }), [])

  const [nodes, setNodes] = useNodesState(configVisual?.nodes || [])
  const [edges, setEdges] = useEdgesState(configVisual?.edges || [])
  const [selectedStage, setSelectedStage] = useState<StageExecution | null>(null)
  const [selectedNodeData, setSelectedNodeData] = useState<NodeVisualData | undefined>(undefined)
  const [showStageDetail, setShowStageDetail] = useState(false)
  const [showInfoPanels, setShowInfoPanels] = useState(true)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  // Track selected node from clicking on the flow visualization
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  // Auto-hide info panels after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInfoPanels(false)
    }, 6000)

    return () => clearTimeout(timer)
  }, [])

  // Extraer datos de ejecución de la respuesta
  const executionData = executionResponse?.data

  // DEBUG: Loguear datos de ejecución
  useEffect(() => {
    if (executionData) {
      logger.log('FlowExecutionViewer - Execution Data:', {
        nodo_actual: executionData.nodo_actual,
        proximo_nodo: executionData.proximo_nodo,
        estado: executionData.estado,
        etapas_count: executionData.etapas?.length,
        timeline_count: executionData.timeline?.length,
        etapas: executionData.etapas?.map(e => ({
          node_id: e.node_id,
          estado: e.estado,
          envios: e.envios, // Incluir envios en el log
        })),
        timeline: executionData.timeline?.map(t => ({
          node_id: t.node_id,
          estado: t.estado,
          orden: t.orden_ejecucion,
        })),
      })
    }
  }, [executionData])

  // Crear mapa de etapas por node_id para acceso rápido - memoizado
  const stagesByNodeId = useMemo(() => {
    const map = new Map<string, StageExecution>()
    if (executionData?.etapas) {
      executionData.etapas.forEach(stage => {
        map.set(stage.node_id, stage)
      })
    }
    return map
  }, [executionData?.etapas])

  // Mapa de node_id -> label para mostrar nombres en badges
  const nodeLabelsByNodeId = useNodeLabelMap(configVisual)

  // Setear edges desde configVisual
  useEffect(() => {
    if (configVisual?.edges) {
      setEdges(configVisual.edges)
    }
  }, [configVisual?.edges, setEdges])

  // Get resumen_por_nodo for prospect indicators
  const resumenPorNodo = cohortesData?.data?.resumen_por_nodo

  // Enriquecer nodos con información de ejecución
  useEffect(() => {
    if (configVisual?.nodes) {
      const enrichedNodes = configVisual.nodes.map(node => {
        const stage = stagesByNodeId.get(node.id)
        const isNextNode = executionData?.proximo_nodo === node.id

        // Calcular tiempo de ejecución del siguiente nodo
        let nextExecutionTime = ''
        if (isNextNode && stage?.fecha_programada) {
          const scheduled = new Date(stage.fecha_programada)
          const now = new Date()
          const diffMs = scheduled.getTime() - now.getTime()

          if (diffMs > 0) {
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
            const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

            if (diffDays > 0) {
              nextExecutionTime = `${diffDays}d ${diffHours}h`
            } else if (diffHours > 0) {
              const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
              nextExecutionTime = `${diffHours}h ${mins}m`
            } else {
              const mins = Math.floor(diffMs / (1000 * 60))
              nextExecutionTime = `${mins}m`
            }
          }
        }

        if (!stage) {
          return {
            ...node,
            data: {
              ...node.data,
              isReadOnly: true, // Flow is executing, disable edit/delete
              isNextNode,
              nextExecutionTime,
              cohorteResumen: resumenPorNodo?.[node.id],
              showProspectIndicators: true,
            },
          }
        }

        return {
          ...node,
          data: {
            ...node.data,
            isReadOnly: true, // Flow is executing, disable edit/delete
            executionState: stage.estado,
            executionDate: stage.fecha_ejecucion,
            errorMessage: stage.error_mensaje,
            envios: stage.envios ? { ...stage.envios } : undefined, // Nueva referencia para forzar re-render
            stageId: stage.id,
            isNextNode,
            nextExecutionTime,
            // Circuit breaker pause fields
            pauseReason: stage.pause_reason,
            pausedAt: stage.paused_at,
            autoResumeAt: stage.auto_resume_at,
            // Prospect indicators
            cohorteResumen: resumenPorNodo?.[node.id],
            showProspectIndicators: true,
          },
        }
      })

      setNodes(enrichedNodes)
    }
  }, [configVisual?.nodes, stagesByNodeId, setNodes, executionData?.proximo_nodo, resumenPorNodo])

  // Obtener el camino de ejecución desde la timeline
  const executionPath = (() => {
    if (!executionData?.timeline) return []
    return executionData.timeline.sort((a, b) => a.orden_ejecucion - b.orden_ejecucion)
  })()

  // CSS selector for the inner icon box (64x64 CompactNodeWrapper card)
  // Structure: .react-flow__node > div(outer flex) > div.relative(icon box)
  const nodeBox = (nodeId: string) => `.react-flow__node[data-id="${nodeId}"] > div > div.relative`

  // Generar estilos dinámicos basados en estado de ejecución
  // Styles target the INNER icon box, not the outer ReactFlow wrapper
  const executionStyles = (() => {
    let styles = `
      /* Make ReactFlow node wrapper transparent — visual styling on inner box only */
      .react-flow__node {
        background: transparent !important;
        box-shadow: none !important;
        border: none !important;
      }
      .react-flow__node.selected {
        box-shadow: none !important;
      }

      /* Dark theme controls & minimap */
      .react-flow__minimap {
        background: rgba(15, 23, 42, 0.9) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        border-radius: 8px;
      }
      .react-flow__controls {
        background: rgba(15, 23, 42, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        overflow: hidden;
      }
      .react-flow__controls-button {
        background: transparent;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }
      .react-flow__controls-button:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      .react-flow__controls-button svg {
        fill: #94a3b8;
      }

      /* Default: all stage/conditional nodes start dimmed (not yet executed) */
      .react-flow__node[data-id^="stage-"],
      .react-flow__node[data-id^="conditional-"] {
        opacity: 0.5;
      }
    `

    stagesByNodeId.forEach((stage, nodeId) => {
      const box = nodeBox(nodeId)
      const baseStyle = `
        ${box} {
          transition: all 0.3s ease;
        }
      `

      // Destacar el camino de ejecución
      const isInPath = executionPath.some(item => item.node_id === nodeId)
      const isCurrentNode = executionData?.nodo_actual === nodeId
      const isNextNode = executionData?.proximo_nodo === nodeId

      if (isCurrentNode) {
        // Nodo actual (executing): doble efecto de glow + full opacity
        styles += `
          ${baseStyle}
          .react-flow__node[data-id="${nodeId}"] {
            opacity: 1 !important;
            z-index: 10;
          }
          ${box} {
            border-color: #f59e0b !important;
            border-width: 2px !important;
            box-shadow:
              0 0 12px rgba(245, 158, 11, 0.6),
              inset 0 0 6px rgba(245, 158, 11, 0.3) !important;
            animation: pulse-execution 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `
      } else if (isNextNode) {
        // Próximo nodo: efecto de anticipación + full opacity
        styles += `
          ${baseStyle}
          .react-flow__node[data-id="${nodeId}"] {
            opacity: 1 !important;
          }
          ${box} {
            border-color: #3b82f6 !important;
            border-width: 2px !important;
            border-style: dashed !important;
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.4) !important;
            animation: pulse-next 2s ease-in-out infinite;
          }
        `
      } else if (isInPath && stage.estado === 'completed') {
        // Nodos en el camino que ya se ejecutaron: full opacity
        styles += `
          ${baseStyle}
          .react-flow__node[data-id="${nodeId}"] {
            opacity: 1 !important;
          }
          ${box} {
            border-color: #16a34a !important;
            border-width: 2px !important;
            box-shadow: 0 0 8px rgba(22, 163, 74, 0.3) !important;
          }
        `
      } else {
        // Aplicar estilos normales basado en estado
        switch (stage.estado) {
          case 'completed':
            styles += `
              ${baseStyle}
              .react-flow__node[data-id="${nodeId}"] {
                opacity: 1 !important;
              }
              ${box} {
                border-color: #16a34a !important;
                border-width: 2px !important;
                box-shadow: 0 0 8px rgba(22, 163, 74, 0.4) !important;
              }
            `
            break
          case 'failed':
            styles += `
              ${baseStyle}
              .react-flow__node[data-id="${nodeId}"] {
                opacity: 1 !important;
              }
              ${box} {
                border-color: #dc2626 !important;
                border-width: 2px !important;
                box-shadow: 0 0 8px rgba(220, 38, 38, 0.4) !important;
              }
            `
            break
          case 'pending':
            // Pending keeps the default 0.5 opacity (no override needed)
            styles += `
              ${baseStyle}
            `
            break
          case 'paused':
            styles += `
              ${baseStyle}
              .react-flow__node[data-id="${nodeId}"] {
                opacity: 1 !important;
              }
              ${box} {
                border-color: #f97316 !important;
                border-width: 2px !important;
                box-shadow: 0 0 10px rgba(249, 115, 22, 0.4) !important;
                animation: pulse-paused 3s ease-in-out infinite;
              }
            `
            break
        }
      }
    })

    // Agregar animaciones
    styles += `
      @keyframes pulse-execution {
        0%, 100% { box-shadow: 0 0 12px rgba(245, 158, 11, 0.6), inset 0 0 6px rgba(245, 158, 11, 0.3); }
        50% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.8), inset 0 0 10px rgba(245, 158, 11, 0.5); }
      }
      @keyframes pulse-next {
        0%, 100% { box-shadow: 0 0 8px rgba(59, 130, 246, 0.3); }
        50% { box-shadow: 0 0 14px rgba(59, 130, 246, 0.6); }
      }
      @keyframes pulse-selected {
        0%, 100% { box-shadow: 0 0 10px rgba(139, 92, 246, 0.5); }
        50% { box-shadow: 0 0 16px rgba(139, 92, 246, 0.7); }
      }
      @keyframes pulse-paused {
        0%, 100% { box-shadow: 0 0 10px rgba(249, 115, 22, 0.3); }
        50% { box-shadow: 0 0 16px rgba(249, 115, 22, 0.6); }
      }
    `

    // Estilo para nodo seleccionado (click del usuario) — on inner box
    if (selectedNodeId) {
      styles += `
        ${nodeBox(selectedNodeId)} {
          border-color: #8b5cf6 !important;
          border-width: 2px !important;
          box-shadow: 0 0 12px rgba(139, 92, 246, 0.5) !important;
          animation: pulse-selected 1.5s ease-in-out infinite;
        }
        .react-flow__node[data-id="${selectedNodeId}"] {
          z-index: 20 !important;
        }
      `
    }

    return styles
  })()

  const handlePause = () => {
    pauseExecution(
      { flujoId, ejecucionId },
      {
        onSuccess: () => {
          toast.success('Ejecución pausada')
          refetch()
        },
        onError: (error: any) => {
          toast.error('Error al pausar la ejecución', {
            description: error.response?.data?.message || error.message,
          })
        },
      },
    )
  }

  const handleResume = () => {
    resumeExecution(
      { flujoId, ejecucionId },
      {
        onSuccess: () => {
          toast.success('Ejecución reanudada')
          refetch()
        },
        onError: (error: any) => {
          toast.error('Error al reanudar la ejecución', {
            description: error.response?.data?.message || error.message,
          })
        },
      },
    )
  }

  const handleOpenCancelDialog = () => {
    setShowCancelDialog(true)
  }

  // Handle node click to show node-specific stats in the panel
  const handleNodeClick = (_event: React.MouseEvent, node: any) => {
    logger.log('Node clicked:', node.id, node.type, node.data)
    setSelectedNodeId(node.id)
    // Save node visual data for plantilla preview
    setSelectedNodeData(node.data as NodeVisualData)
    // If the node has execution data, also set it as selected stage for detail view
    const stage = stagesByNodeId.get(node.id)
    if (stage) {
      setSelectedStage(stage)
    }
  }

  // Handle clicking on the background to deselect
  const handlePaneClick = () => {
    setSelectedNodeId(null)
    setSelectedStage(null)
  }

  const handleConfirmCancel = () => {
    cancelExecution(
      { flujoId, ejecucionId },
      {
        onSuccess: () => {
          toast.success('Ejecución cancelada correctamente')
          setShowCancelDialog(false)
          refetch()
        },
        onError: (error: any) => {
          toast.error('Error al cancelar la ejecución', {
            description: error.response?.data?.message || error.message,
          })
        },
      },
    )
  }

  if (!configVisual?.nodes || configVisual.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-segal-blue/5 rounded-lg border-2 border-dashed border-segal-blue/20">
        <AlertCircle className="h-12 w-12 text-segal-blue/40 mb-3" />
        <p className="text-segal-dark/60 font-medium">No hay visualización disponible</p>
      </div>
    )
  }

  const isExecuting = executionData?.estado === 'in_progress'
  const isPaused = executionData?.estado === 'paused'
  const isCompleted = executionData?.estado === 'completed'
  const isFailed = executionData?.estado === 'failed'

  return (
    <>
      <style>{executionStyles}</style>

      <StageDetailPanel 
        stage={selectedStage} 
        isOpen={showStageDetail} 
        onClose={() => setShowStageDetail(false)}
        nodeData={selectedNodeData}
        nodeLabel={selectedNodeId ? nodeLabelsByNodeId.get(selectedNodeId) : undefined}
      />

      {/* Toggle button para mostrar/ocultar paneles informativos */}
      {!showInfoPanels && (
        <button
          onClick={() => setShowInfoPanels(true)}
          className="absolute top-4 right-4 z-50 bg-segal-blue text-white p-3 rounded-lg shadow-lg hover:bg-segal-blue/90 transition-all flex items-center gap-2 group"
          title="Mostrar información de ejecución"
        >
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm font-medium">Info</span>
        </button>
      )}

      {/* Estado y controles */}
      <div className={`absolute top-4 right-4 bottom-4 z-50 flex flex-col gap-2 transition-all duration-300 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent ${
        showInfoPanels ? 'translate-x-0 opacity-100' : 'translate-x-[400px] opacity-0 pointer-events-none'
      }`}>
        {/* Botón para ocultar paneles */}
        <button
          onClick={() => setShowInfoPanels(false)}
          className="self-end bg-white rounded-lg shadow-lg px-3 py-2 border border-segal-blue/20 hover:bg-gray-50 transition-colors flex items-center gap-1 text-xs text-segal-dark/70"
          title="Ocultar paneles (se ocultarán automáticamente en 6 segundos)"
        >
          <span>Ocultar</span>
          <ChevronRight className="h-3 w-3" />
        </button>

        {/* Panel principal consolidado: Estado + Progreso + Costo */}
        <div className="bg-white rounded-lg shadow-lg border border-segal-blue/20 w-64 overflow-hidden">
          {/* Header con estado */}
          <div className={`px-4 py-3 flex items-center gap-2 ${
            isExecuting ? 'bg-amber-50 border-b border-amber-200' :
            isPaused ? 'bg-blue-50 border-b border-blue-200' :
            isCompleted ? 'bg-green-50 border-b border-green-200' :
            isFailed ? 'bg-red-50 border-b border-red-200' : 'bg-gray-50 border-b border-gray-200'
          }`}>
            {isExecuting && <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />}
            {isPaused && <Pause className="h-5 w-5 text-blue-500" />}
            {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            {isFailed && <AlertCircle className="h-5 w-5 text-red-600" />}
            <span className={`text-sm font-semibold ${
              isExecuting ? 'text-amber-700' :
              isPaused ? 'text-blue-700' :
              isCompleted ? 'text-green-700' :
              isFailed ? 'text-red-700' : 'text-gray-700'
            }`}>
              {isExecuting ? 'En progreso' : isPaused ? 'Pausada' : isCompleted ? 'Completada' : isFailed ? 'Falló' : 'Desconocido'}
            </span>
          </div>

          {/* Progreso de envíos (más detallado) */}
          {executionData?.progreso_envios && (
            <div className="px-4 py-3 border-b border-segal-blue/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-segal-dark/70">Progreso</span>
                <span className="text-xs font-semibold text-segal-blue">{executionData.progreso_envios.porcentaje}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-segal-blue h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${executionData.progreso_envios.porcentaje}%` }}
                />
              </div>
              <div className="flex flex-col gap-1 mt-2 text-xs text-segal-dark/60">
                <div className="flex justify-between">
                  <span>✅ {executionData.progreso_envios.exitosos?.toLocaleString()} enviados</span>
                  <span>❌ {executionData.progreso_envios.fallidos?.toLocaleString()} fallidos</span>
                </div>
                <div className="flex justify-between">
                  <span>📊 {executionData.progreso_envios.procesados?.toLocaleString()} / {executionData.progreso_envios.total_prospectos?.toLocaleString()}</span>
                  <span>⏱️ {executionData.progreso_envios.tiempo_restante_texto}</span>
                </div>
              </div>
            </div>
          )}

          {/* Progreso de etapas (secundario) */}
          {executionData?.progreso && !executionData?.progreso_envios && (
            <div className="px-4 py-3 border-b border-segal-blue/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-segal-dark/70">Progreso</span>
                <span className="text-xs font-semibold text-segal-blue">{executionData.progreso.porcentaje}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-segal-blue h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${executionData.progreso.porcentaje}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-segal-dark/60">
                <span>✅ {executionData.progreso.completadas}</span>
                <span>⏳ {executionData.progreso.pendientes}</span>
                <span>❌ {executionData.progreso.fallidas}</span>
              </div>
            </div>
          )}

          {/* Costo Total destacado */}
          {costoEjecucion && (
            <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-700">Costo Total:</span>
                <span className="text-lg font-bold text-emerald-800">
                  {formatCurrency(costoEjecucion.costo_real ?? costoEjecucion.costo_estimado ?? 0)}
                </span>
              </div>
              {((costoEjecucion.total_emails_enviados ?? 0) > 0 || (costoEjecucion.total_sms_enviados ?? 0) > 0) && (
                <div className="flex gap-3 mt-1 text-xs text-emerald-600">
                  {(costoEjecucion.total_emails_enviados ?? 0) > 0 && (
                    <span>📧 {costoEjecucion.total_emails_enviados} emails</span>
                  )}
                  {(costoEjecucion.total_sms_enviados ?? 0) > 0 && (
                    <span>📱 {costoEjecucion.total_sms_enviados} SMS</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Controles */}
          {!isCompleted && !isFailed && (
            <div className="px-3 py-2 flex gap-2">
              {isExecuting && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePause}
                  disabled={isPausing}
                  className="flex-1 text-xs gap-1 h-8 bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  {isPausing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Pause className="h-3 w-3" />}
                  Pausar
                </Button>
              )}
              {isPaused && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResume}
                  disabled={isResuming}
                  className="flex-1 text-xs gap-1 h-8 bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                >
                  {isResuming ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                  Reanudar
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenCancelDialog}
                disabled={isCanceling}
                className="flex-1 text-xs gap-1 h-8 bg-red-50 border-red-300 text-red-600 hover:bg-red-100"
              >
                <Trash2 className="h-3 w-3" />
                Cancelar
              </Button>
            </div>
          )}
        </div>

        {/* Panel de nodo seleccionado - se muestra cuando el usuario hace click en un nodo */}
        {selectedNodeId && (
          <SelectedNodePanel
            nodeId={selectedNodeId}
            stage={selectedStage}
            nodeLabel={nodeLabelsByNodeId.get(selectedNodeId) || selectedNodeId}
            onClear={() => {
              setSelectedNodeId(null)
              setSelectedStage(null)
            }}
          />
        )}

        {/* Etapas compactas - horizontal badges */}
        {executionData?.etapas && executionData.etapas.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-3 border border-segal-blue/20 min-w-64 max-w-sm">
            <p className="text-xs font-semibold text-segal-dark mb-2">Etapas ({executionData.etapas.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {executionData.etapas.map(stage => {
                const getStatusStyle = () => {
                  switch (stage.estado) {
                    case 'completed':
                      return 'bg-green-100 text-green-700 border-green-200'
                    case 'executing':
                      return 'bg-amber-100 text-amber-700 border-amber-200'
                    case 'failed':
                      return 'bg-red-100 text-red-700 border-red-200'
                    default:
                      return 'bg-gray-100 text-gray-600 border-gray-200'
                  }
                }
                const getStatusIcon = () => {
                  switch (stage.estado) {
                    case 'completed': return '✓'
                    case 'executing': return '⚡'
                    case 'failed': return '✗'
                    default: return '○'
                  }
                }

                // Obtener el label del nodo (nombre legible)
                const nodeLabel = nodeLabelsByNodeId.get(stage.node_id) || stage.node_id
                const isSelected = selectedNodeId === stage.node_id

                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => {
                      setSelectedNodeId(stage.node_id)
                      setSelectedStage(stage)
                    }}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border hover:opacity-80 transition-opacity ${getStatusStyle()} ${isSelected ? 'ring-2 ring-segal-blue ring-offset-1' : ''}`}
                    title={`${nodeLabel} - ${stage.estado}`}
                  >
                    <span>{getStatusIcon()}</span>
                    <span className="truncate max-w-[60px]">{nodeLabel}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Panel de Nuevos del Último Sync - muestra prospectos nuevos de Sysgal con progreso */}
        {cohortesData?.data?.nuevos_ultimo_sync && cohortesData.data.nuevos_ultimo_sync.count > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-3 border border-segal-blue/20 min-w-64 max-w-sm">
            <div className="flex items-center gap-2 mb-2">
              <UserPlus className="h-4 w-4 text-green-600" />
              <p className="text-xs font-semibold text-segal-dark">Nuevos último sync</p>
            </div>
            
            {/* Info básica */}
            <div className="p-2 bg-green-50 rounded-lg border border-green-100 mb-2">
              <p className="text-sm font-bold text-green-800">
                +{cohortesData.data.nuevos_ultimo_sync.count.toLocaleString()} prospectos
              </p>
              <p className="text-xs text-green-600">
                {cohortesData.data.nuevos_ultimo_sync.fecha_legible} • {cohortesData.data.nuevos_ultimo_sync.origen}
              </p>
              <p className="text-xs text-green-700 font-medium mt-1">
                {cohortesData.data.nuevos_ultimo_sync.nivel_deuda}
              </p>
            </div>

            {/* Progreso de alcance */}
            {cohortesData.data.nuevos_ultimo_sync.progreso?.tiene_datos && (
              <div className="space-y-2">
                {/* Barra de progreso */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-segal-dark/70">Progreso de alcance</span>
                    <span className="text-xs font-semibold text-segal-blue">
                      {cohortesData.data.nuevos_ultimo_sync.progreso.porcentaje_alcance}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-segal-blue h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${cohortesData.data.nuevos_ultimo_sync.progreso.porcentaje_alcance}%` }}
                    />
                  </div>
                </div>

                {/* Estadísticas de alcance */}
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-green-700">✓ Ya en nodo actual</span>
                    <span className="font-semibold text-green-700">
                      {cohortesData.data.nuevos_ultimo_sync.progreso.ya_alcanzaron.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-700">⏳ Alcanzando</span>
                    <span className="font-semibold text-amber-700">
                      {cohortesData.data.nuevos_ultimo_sync.progreso.alcanzando.toLocaleString()}
                    </span>
                  </div>
                  {cohortesData.data.nuevos_ultimo_sync.progreso.nodo_actual_label && (
                    <div className="flex justify-between pt-1 border-t border-gray-200">
                      <span className="text-segal-dark/60">📍 Etapa actual</span>
                      <span className="font-medium text-segal-dark truncate max-w-[120px]" title={cohortesData.data.nuevos_ultimo_sync.progreso.nodo_actual_label}>
                        {cohortesData.data.nuevos_ultimo_sync.progreso.nodo_actual_label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Estadísticas de envíos */}
                {cohortesData.data.nuevos_ultimo_sync.progreso.envios.total > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-segal-dark/70 mb-1">Envíos totales</p>
                    <div className="flex gap-3 text-xs">
                      <span className="text-green-700">
                        ✓ {cohortesData.data.nuevos_ultimo_sync.progreso.envios.enviados.toLocaleString()}
                      </span>
                      <span className="text-red-600">
                        ✗ {cohortesData.data.nuevos_ultimo_sync.progreso.envios.fallidos.toLocaleString()}
                      </span>
                      {cohortesData.data.nuevos_ultimo_sync.progreso.envios.pendientes > 0 && (
                        <span className="text-amber-600">
                          ⏳ {cohortesData.data.nuevos_ultimo_sync.progreso.envios.pendientes.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mensaje si no hay datos de progreso */}
            {cohortesData.data.nuevos_ultimo_sync.progreso && !cohortesData.data.nuevos_ultimo_sync.progreso.tiene_datos && (
              <p className="text-xs text-segal-dark/50 italic">
                {cohortesData.data.nuevos_ultimo_sync.progreso.mensaje}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Flow visualization */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        fitView
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1.2}
          color="rgba(255,255,255,0.05)"
        />
        <Controls showInteractive={false} />
      </ReactFlow>

      {/* Cancel Execution Dialog */}
      <CancelExecutionDialog
        isOpen={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleConfirmCancel}
        isLoading={isCanceling}
      />
    </>
  )
}

/**
 * Componente principal con ReactFlowProvider
 */
export function FlowExecutionViewer({ flujoId, ejecucionId, configVisual }: FlowExecutionViewerProps) {
  // Guard: Don't render if configVisual is invalid
  if (!configVisual?.nodes || !Array.isArray(configVisual.nodes) || configVisual.nodes.length === 0) {
    return (
      <div className="w-full h-[700px] bg-slate-900 border border-slate-700/50 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-3" />
          <p className="text-slate-400">Cargando visualización del flujo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-[700px] bg-slate-900 border border-slate-700/50 rounded-lg overflow-hidden">
      <ReactFlowProvider>
        <FlowExecutionContent configVisual={configVisual} flujoId={flujoId} ejecucionId={ejecucionId} />
      </ReactFlowProvider>
    </div>
  )
}
