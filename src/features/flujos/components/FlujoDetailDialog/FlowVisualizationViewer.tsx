/**
 * Componente para visualizar un flujo de forma visual usando ReactFlow
 * Modo de SOLO LECTURA - sin capacidad de edición
 * Reconstruye el flujo desde config_visual (nodes y edges)
 */

import { useCallback, useMemo } from 'react'
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
import type { ConfigVisual } from '@/types/flujo'

interface FlowVisualizationViewerProps {
  configVisual?: ConfigVisual
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
function FlowVisualizationContent({ configVisual }: FlowVisualizationViewerProps) {
  // Preparar nodes y edges desde config_visual
  const initialNodes = useMemo(() => {
    if (!configVisual?.nodes || !Array.isArray(configVisual.nodes)) {
      return []
    }
    console.log('Nodes cargados:', configVisual.nodes)

    // Log detallado de cada nodo
    configVisual.nodes.forEach((node: any) => {
      console.log(`\n=== NODO ${node.id} (tipo: ${node.type}) ===`)
      console.log('data completo:', node.data)
      console.log('label:', node.data?.label)
      console.log('tipo_mensaje:', node.data?.tipo_mensaje)
      console.log('dia_envio:', node.data?.dia_envio)
      console.log('plantilla_mensaje:', node.data?.plantilla_mensaje)
      console.log('condition:', node.data?.condition)
    })

    // Enriquecer nodos SOLO con valores por defecto si no existen
    const enrichedNodes = (configVisual.nodes as Node[]).map((node) => {
      const nodeData = node.data || {}

      console.log(`[DEBUG] Nodo ${node.id}:`, {
        type: node.type,
        originalData: nodeData,
        hasLabel: 'label' in nodeData,
        labelValue: nodeData.label,
        hasTipoMensaje: 'tipo_mensaje' in nodeData,
        tipoMensajeValue: nodeData.tipo_mensaje,
        hasCondition: 'condition' in nodeData,
        conditionValue: nodeData.condition,
      })

      // Solo agregar valores por defecto si NO EXISTEN
      const enrichedData = {
        ...nodeData,
        // Usar el valor real si existe, sino usar default
        label: nodeData.label !== undefined ? nodeData.label : `${node.type === 'stage' ? 'Etapa' : node.type === 'conditional' ? 'Condición' : 'Nodo'} ${node.id.substring(0, 5)}`,
        dia_envio: nodeData.dia_envio !== undefined ? nodeData.dia_envio : 1,
        tipo_mensaje: nodeData.tipo_mensaje !== undefined ? nodeData.tipo_mensaje : 'email',
        plantilla_mensaje: nodeData.plantilla_mensaje !== undefined ? nodeData.plantilla_mensaje : '',
        activo: nodeData.activo !== undefined ? nodeData.activo : true,
        condition: nodeData.condition !== undefined ? nodeData.condition : { type: 'email_opened', label: 'Email abierto' },
        yesLabel: nodeData.yesLabel !== undefined ? nodeData.yesLabel : 'Sí',
        noLabel: nodeData.noLabel !== undefined ? nodeData.noLabel : 'No',
      }

      console.log(`[DEBUG] Nodo ${node.id} enriquecido:`, enrichedData)
      return {
        ...node,
        data: enrichedData,
      } as Node
    })

    console.log('Nodes enriquecidos (completo):', enrichedNodes)
    return enrichedNodes
  }, [configVisual?.nodes])

  const initialEdges = useMemo(() => {
    if (!configVisual?.edges || !Array.isArray(configVisual.edges)) {
      return []
    }
    console.log('Edges cargados:', configVisual.edges)
    return configVisual.edges as Edge[]
  }, [configVisual?.edges])

  // Estado de ReactFlow - permite mover nodos pero no editar
  const [nodes, setNodes] = useNodesState(initialNodes)
  const [edges] = useEdgesState(initialEdges)

  // Manejar cambios de nodos (permite arrastrar/mover)
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds))
  }, [setNodes])

  // Log para debugging
  useMemo(() => {
    console.log('FlowVisualizationContent - nodes:', nodes)
    console.log('FlowVisualizationContent - edges:', edges)
  }, [nodes, edges])

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
export function FlowVisualizationViewer({ configVisual }: FlowVisualizationViewerProps) {
  return (
    <div className="w-full h-[700px] bg-white border border-segal-blue/10 rounded-lg overflow-hidden">
      <ReactFlowProvider>
        <FlowVisualizationContent configVisual={configVisual} />
      </ReactFlowProvider>
    </div>
  )
}
