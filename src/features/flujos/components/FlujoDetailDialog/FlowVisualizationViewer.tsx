/**
 * Componente para visualizar un flujo de forma visual usando ReactFlow
 * Modo de SOLO LECTURA - sin capacidad de edición
 * Reconstruye el flujo desde config_visual (nodes y edges)
 * 
 * Muestra estadísticas de envíos por nodo cuando hay flujoId disponible.
 */

import { useEffect, useMemo } from 'react'
import { logger } from '@/lib/logger'
import ReactFlow, {
  Controls,
  Background,
  ReactFlowProvider,
  MiniMap,
  useNodesState,
  useEdgesState,
  applyNodeChanges,
} from 'reactflow'
import type { Node, Edge, NodeChange } from 'reactflow'
import 'reactflow/dist/style.css'
import { AlertCircle } from 'lucide-react'
import { StageNode } from '../FlowBuilder/CustomNodes/StageNode'
import { InitialNode } from '../FlowBuilder/CustomNodes/InitialNode'
import { EndNode } from '../FlowBuilder/CustomNodes/EndNode'
import { ConditionalNode } from '../FlowBuilder/CustomNodes/ConditionalNode'
import { N8nStyleEdge } from '../FlowBuilder/CustomEdges/N8nStyleEdge'
import { useNodeStats } from '../../hooks/useNodeStats'
import type { ConfigVisual } from '@/types/flujo'

interface FlowVisualizationViewerProps {
  configVisual?: ConfigVisual
  /** Flujo ID for loading node statistics */
  flujoId?: number
  /** Count of prospects assigned to the flow - shown in initial node */
  prospectosCount?: number
}

const nodeTypes = {
  stage: StageNode,
  initial: InitialNode,
  end: EndNode,
  conditional: ConditionalNode,
}

const edgeTypes = {
  animated: N8nStyleEdge,
}

// Estilos para handles (mismo que en FlowBuilder)
const handleStyles = `
  .react-flow__handle {
    background: #1e3a8a;
    border: 2px solid white;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    opacity: 1;
    visibility: visible;
    z-index: 10;
  }

  .react-flow__handle:hover {
    background: #1e40af;
    transform: scale(1.3);
    transition: all 0.2s ease;
  }

  .react-flow__handle.connectingFrom {
    background: #16a34a;
  }

  /* Deshabilitar interacción en modo lectura */
  .react-flow__node {
    pointer-events: auto;
  }

  .react-flow__handle {
    pointer-events: none;
  }
`

/**
 * Componente interno que usa ReactFlow
 */
function FlowVisualizationContent({ configVisual, flujoId, prospectosCount }: FlowVisualizationViewerProps) {
  // Fetch node statistics (aggregated across all executions)
  const { data: nodeStatsMap } = useNodeStats(flujoId)

  // Preparar nodes y edges desde config_visual
  const initialNodes = useMemo(() => {
    if (!configVisual?.nodes || !Array.isArray(configVisual.nodes)) {
      return []
    }

    // Enriquecer nodos con valores por defecto y estadísticas
    const enrichedNodes = (configVisual.nodes as Node[]).map((node) => {
      const nodeData = node.data || {}
      const stats = nodeStatsMap?.[node.id]

      // Solo agregar valores por defecto si NO EXISTEN
      const enrichedData = {
        ...nodeData,
        // Inyectar prospectos_count en el nodo inicial
        ...(node.type === 'initial' && prospectosCount !== undefined ? { prospectos_count: prospectosCount } : {}),
        // Usar el valor real si existe, sino usar default
        label: nodeData.label !== undefined ? nodeData.label : `${node.type === 'stage' ? 'Etapa' : node.type === 'conditional' ? 'Condición' : 'Nodo'} ${node.id.substring(0, 5)}`,
        dia_envio: nodeData.dia_envio !== undefined ? nodeData.dia_envio : 1,
        tipo_mensaje: nodeData.tipo_mensaje !== undefined ? nodeData.tipo_mensaje : 'email',
        plantilla_mensaje: nodeData.plantilla_mensaje !== undefined ? nodeData.plantilla_mensaje : '',
        activo: nodeData.activo !== undefined ? nodeData.activo : true,
        condition: nodeData.condition !== undefined ? nodeData.condition : { type: 'email_opened', label: 'Email abierto' },
        yesLabel: nodeData.yesLabel !== undefined ? nodeData.yesLabel : 'Sí',
        noLabel: nodeData.noLabel !== undefined ? nodeData.noLabel : 'No',
        // Add aggregated stats from all executions
        aggregatedStats: stats ? {
          enviado: stats.total_enviado,
          fallido: stats.total_fallido,
          abierto: stats.total_abierto,
          clickeado: stats.total_clickeado,
          pendiente: stats.total_pendiente,
        } : undefined,
      }

      return {
        ...node,
        data: enrichedData,
      } as Node
    })

    return enrichedNodes
  }, [configVisual?.nodes, nodeStatsMap, prospectosCount])

  const initialEdges = (() => {
    if (!configVisual?.edges || !Array.isArray(configVisual.edges)) {
      return []
    }
    logger.log('Edges cargados:', configVisual.edges)
    return configVisual.edges as Edge[]
  })()

  // Estado de ReactFlow - permite mover nodos pero no editar
  const [nodes, setNodes] = useNodesState(initialNodes)
  const [edges] = useEdgesState(initialEdges)

  // Update nodes when stats change
  useEffect(() => {
    if (initialNodes.length > 0) {
      setNodes(initialNodes)
    }
  }, [initialNodes, setNodes])

  // Manejar cambios de nodos (permite arrastrar/mover)
  const handleNodesChange = (changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds))
  }

  if (!configVisual?.nodes || configVisual.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-segal-blue/5 rounded-lg border-2 border-dashed border-segal-blue/20">
        <AlertCircle className="h-12 w-12 text-segal-blue/40 mb-3" />
        <p className="text-segal-dark/60 font-medium">No hay visualización disponible</p>
        <p className="text-sm text-segal-dark/40 mt-1">Este flujo no tiene configuración visual almacenada</p>
      </div>
    )
  }

  return (
    <>
      <style>{handleStyles}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodesChange}
        fitView
      >
        <Background />
        <Controls showInteractive={false} />
        <MiniMap />
      </ReactFlow>
    </>
  )
}

/**
 * Componente wrapper con ReactFlowProvider
 */
export function FlowVisualizationViewer({ configVisual, flujoId, prospectosCount }: FlowVisualizationViewerProps) {
  return (
    <div className="w-full h-[700px] bg-gradient-to-br from-slate-50 to-segal-blue/5 dark:from-slate-800 dark:to-slate-900 border border-segal-blue/10 dark:border-segal-blue/30 rounded-xl overflow-hidden">
      <ReactFlowProvider>
        <FlowVisualizationContent configVisual={configVisual} flujoId={flujoId} prospectosCount={prospectosCount} />
      </ReactFlowProvider>
    </div>
  )
}
