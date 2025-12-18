/**
 * Visor de ejecución en tiempo real del flujo
 * Muestra el estado de cada nodo (pending, executing, completed, failed)
 * Con iconos, colores y animaciones que indican el progreso
 */

import { useCallback, useEffect, useMemo, useState } from 'react'

import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Clock, DollarSign, Loader2, Pause, Play, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { formatCurrency, useCostoEjecucion, usePrecios } from '@/features/costos/hooks'
import type { StageExecution } from '@/types/flowExecutionTracking'
import type { ConfigVisual } from '@/types/flujo'

import { useCancelExecution, useFlowExecutionDetail, usePauseExecution, useResumeExecution } from '../../hooks/useFlowExecutionTracking'
import { useNodeLabelMap } from '../../hooks/useNodeLabelMap'
import { ConditionalNode } from '../FlowBuilder/CustomNodes/ConditionalNode'
import { EndNode } from '../FlowBuilder/CustomNodes/EndNode'
import { InitialNode } from '../FlowBuilder/CustomNodes/InitialNode'
import { StageNode } from '../FlowBuilder/CustomNodes/StageNode'
import { N8nStyleEdge } from '../FlowBuilder/CustomEdges/N8nStyleEdge'
import { CancelExecutionDialog } from './CancelExecutionDialog'

interface FlowExecutionViewerProps {
  flujoId: number
  ejecucionId: number
  configVisual?: ConfigVisual
}

const edgeTypes = {
  animated: N8nStyleEdge,
}

/**
 * Panel de detalles de un nodo ejecutándose
 */
function StageDetailPanel({ stage, isOpen, onClose }: { stage: StageExecution | null; isOpen: boolean; onClose: () => void }) {
  if (!isOpen || !stage) return null

  const getStateIcon = () => {
    switch (stage.estado) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'executing':
        return <Loader2 className="h-5 w-5 text-amber-600 animate-spin" />
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStateLabel = () => {
    switch (stage.estado) {
      case 'pending':
        return 'Pendiente'
      case 'executing':
        return 'Ejecutándose'
      case 'completed':
        return 'Completada'
      case 'failed':
        return 'Falló'
      default:
        return 'Desconocido'
    }
  }

  const getStateColor = () => {
    switch (stage.estado) {
      case 'completed':
        return 'bg-green-50 border-green-200'
      case 'executing':
        return 'bg-amber-50 border-amber-200'
      case 'failed':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-96 max-h-96 overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b">
            {getStateIcon()}
            <div>
              <p className="font-semibold text-segal-dark">Etapa {stage.node_id}</p>
              <p className="text-sm text-segal-dark/60">{getStateLabel()}</p>
            </div>
          </div>

          {/* Fechas */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-segal-dark/60">Programada:</span>
              <span className="font-semibold">{new Date(stage.fecha_programada).toLocaleString()}</span>
            </div>
            {stage.fecha_ejecucion && (
              <div className="flex justify-between">
                <span className="text-segal-dark/60">Ejecutada:</span>
                <span className="font-semibold">{new Date(stage.fecha_ejecucion).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Envíos */}
          {stage.envios && (
            <div className={`rounded-lg border p-4 ${getStateColor()}`}>
              <p className="font-semibold text-segal-dark mb-3">Estadísticas de Envíos</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-segal-dark/60">✓ Enviados:</span>
                  <span className="font-bold text-green-600">{stage.envios.enviado}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-segal-dark/60">⏳ Pendientes:</span>
                  <span className="font-bold text-amber-600">{stage.envios.pendiente}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-segal-dark/60">✗ Fallidos:</span>
                  <span className="font-bold text-red-600">{stage.envios.fallido}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-segal-dark/60">📧 Abiertos:</span>
                  <span className="font-bold text-blue-600">{stage.envios.abierto}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-segal-dark/60">🔗 Clicks:</span>
                  <span className="font-bold text-purple-600">{stage.envios.clickeado}</span>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {stage.error_mensaje && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-red-700 mb-1">Error</p>
              <p className="text-sm text-red-600">{stage.error_mensaje}</p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full mt-4 px-4 py-2 bg-segal-blue text-white rounded-lg hover:bg-segal-blue/90 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
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
  const { data: costoEjecucion, isLoading: isLoadingCosto } = useCostoEjecucion(ejecucionId)

  // Get pricing for cost badge display
  const { data: precios } = usePrecios()

  // Create nodeTypes with precios - memoized to avoid re-renders
  const nodeTypes = useMemo(() => ({
    stage: (props: any) => (
      <StageNode
        {...props}
        isNextNode={props.data?.isNextNode}
        nextExecutionTime={props.data?.nextExecutionTime}
        precios={precios}
      />
    ),
    initial: InitialNode,
    end: EndNode,
    conditional: ConditionalNode,
  }), [precios])

  const [nodes, setNodes] = useNodesState(configVisual?.nodes || [])
  const [edges, setEdges] = useEdgesState(configVisual?.edges || [])
  const [selectedStage, setSelectedStage] = useState<StageExecution | null>(null)
  const [showStageDetail, setShowStageDetail] = useState(false)
  const [showInfoPanels, setShowInfoPanels] = useState(true)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

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
      console.log('🎬 FlowExecutionViewer - Execution Data:', {
        nodo_actual: executionData.nodo_actual,
        proximo_nodo: executionData.proximo_nodo,
        estado: executionData.estado,
        etapas_count: executionData.etapas?.length,
        timeline_count: executionData.timeline?.length,
        etapas: executionData.etapas?.map(e => ({
          node_id: e.node_id,
          estado: e.estado,
        })),
        timeline: executionData.timeline?.map(t => ({
          node_id: t.node_id,
          estado: t.estado,
          orden: t.orden_ejecucion,
        })),
      })
    }
  }, [executionData])

  // Crear mapa de etapas por node_id para acceso rápido
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
              isNextNode,
              nextExecutionTime,
            },
          }
        }

        return {
          ...node,
          data: {
            ...node.data,
            executionState: stage.estado,
            executionDate: stage.fecha_ejecucion,
            errorMessage: stage.error_mensaje,
            envios: stage.envios,
            stageId: stage.id,
            isNextNode,
            nextExecutionTime,
          },
        }
      })

      setNodes(enrichedNodes)
    }
  }, [configVisual?.nodes, stagesByNodeId, setNodes, executionData?.proximo_nodo])

  // Obtener el camino de ejecución desde la timeline
  const executionPath = useMemo(() => {
    if (!executionData?.timeline) return []
    return executionData.timeline.sort((a, b) => a.orden_ejecucion - b.orden_ejecucion)
  }, [executionData?.timeline])

  // Generar estilos dinámicos basados en estado de ejecución
  const executionStyles = useMemo(() => {
    let styles = ''

    stagesByNodeId.forEach((stage, nodeId) => {
      const baseStyle = `
        .react-flow__node[data-id="${nodeId}"] {
          border-width: 3px !important;
          transition: all 0.3s ease;
        }
      `

      // Destacar el camino de ejecución
      const isInPath = executionPath.some(item => item.node_id === nodeId)
      const isCurrentNode = executionData?.nodo_actual === nodeId
      const isNextNode = executionData?.proximo_nodo === nodeId

      if (isCurrentNode) {
        // Nodo actual: doble efecto de glow
        styles += `
          ${baseStyle}
          .react-flow__node[data-id="${nodeId}"] {
            border-color: #f59e0b !important;
            box-shadow:
              0 0 20px rgba(245, 158, 11, 0.8),
              inset 0 0 10px rgba(245, 158, 11, 0.4) !important;
            animation: pulse-execution 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            z-index: 10;
          }
        `
      } else if (isNextNode) {
        // Próximo nodo: efecto de anticipación
        styles += `
          ${baseStyle}
          .react-flow__node[data-id="${nodeId}"] {
            border-color: #3b82f6 !important;
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.6) !important;
            border-style: dashed;
            animation: pulse-next 2s ease-in-out infinite;
          }
        `
      } else if (isInPath && stage.estado === 'completed') {
        // Nodos en el camino que ya se ejecutaron
        styles += `
          ${baseStyle}
          .react-flow__node[data-id="${nodeId}"] {
            border-color: #16a34a !important;
            box-shadow: 0 0 15px rgba(22, 163, 74, 0.4) !important;
          }
        `
      } else {
        // Aplicar estilos normales basado en estado
        switch (stage.estado) {
          case 'completed':
            styles += `
              ${baseStyle}
              .react-flow__node[data-id="${nodeId}"] {
                border-color: #16a34a !important;
                box-shadow: 0 0 15px rgba(22, 163, 74, 0.6) !important;
              }
            `
            break
          case 'failed':
            styles += `
              ${baseStyle}
              .react-flow__node[data-id="${nodeId}"] {
                border-color: #dc2626 !important;
                box-shadow: 0 0 15px rgba(220, 38, 38, 0.6) !important;
              }
            `
            break
          case 'pending':
            styles += `
              ${baseStyle}
              .react-flow__node[data-id="${nodeId}"] {
                border-color: #9ca3af !important;
                opacity: 0.5;
              }
            `
            break
        }
      }
    })

    // Agregar animaciones
    styles += `
      @keyframes pulse-execution {
        0%, 100% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.8), inset 0 0 10px rgba(245, 158, 11, 0.4); }
        50% { box-shadow: 0 0 40px rgba(245, 158, 11, 1), inset 0 0 20px rgba(245, 158, 11, 0.6); }
      }
      @keyframes pulse-next {
        0%, 100% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.4); }
        50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8); }
      }
    `

    return styles
  }, [stagesByNodeId, executionPath, executionData?.nodo_actual, executionData?.proximo_nodo])

  const handlePause = useCallback(() => {
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
  }, [flujoId, ejecucionId, pauseExecution, refetch])

  const handleResume = useCallback(() => {
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
  }, [flujoId, ejecucionId, resumeExecution, refetch])

  const handleOpenCancelDialog = useCallback(() => {
    setShowCancelDialog(true)
  }, [])

  const handleConfirmCancel = useCallback(() => {
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
  }, [flujoId, ejecucionId, cancelExecution, refetch])

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

      <StageDetailPanel stage={selectedStage} isOpen={showStageDetail} onClose={() => setShowStageDetail(false)} />

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
      <div className={`absolute top-4 right-4 z-50 flex flex-col gap-2 transition-all duration-300 ${
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

          {/* Progreso compacto */}
          {executionData?.progreso && (
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

                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => {
                      setSelectedStage(stage)
                      setShowStageDetail(true)
                    }}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border hover:opacity-80 transition-opacity ${getStatusStyle()}`}
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
      </div>

      {/* Flow visualization */}
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} fitView>
        <Background />
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
  return (
    <div className="w-full h-[700px] bg-white border border-segal-blue/10 rounded-lg overflow-hidden">
      <ReactFlowProvider>
        <FlowExecutionContent configVisual={configVisual} flujoId={flujoId} ejecucionId={ejecucionId} />
      </ReactFlowProvider>
    </div>
  )
}
