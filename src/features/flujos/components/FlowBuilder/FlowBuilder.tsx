/**
 * Visual Flow Builder for Nurturing Flows
 * Built with ReactFlow + Zustand for state management
 * Features: Drag-and-drop stage creation, real-time validation, visual preview
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { logger } from '@/lib/logger'
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  BackgroundVariant,
  Panel,
  ConnectionLineType,
} from 'reactflow'
import type { Connection, NodeChange, EdgeChange } from 'reactflow'
import 'reactflow/dist/style.css'
import {
  Plus,
  CheckCircle2,
  Save,
  RotateCcw,
  Eye,
  GitBranch,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
  Grid3X3,
  MousePointer2,
} from 'lucide-react'

// Enhanced n8n-style CSS with better visibility and connection indicators
const ENHANCED_FLOW_STYLES = `
  /* ===== HANDLES - n8n style ===== */
  .react-flow__handle {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    opacity: 0.8;
    transition: all 0.2s ease;
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }

  .react-flow__node:hover .react-flow__handle {
    opacity: 1;
    transform: scale(1.2);
  }

  .react-flow__handle:hover {
    opacity: 1;
    transform: scale(1.5);
    box-shadow: 0 0 0 4px rgba(30, 58, 138, 0.3), 0 2px 8px rgba(0,0,0,0.2);
  }

  .react-flow__handle.connectingFrom,
  .react-flow__handle.connectingTo {
    background: #16a34a !important;
    opacity: 1;
    transform: scale(1.4);
    box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.4);
  }
  
  .react-flow__handle-left,
  .react-flow__handle-right {
    z-index: 10;
  }

  /* ===== CONNECTION LINE - Visual guide while dragging ===== */
  .react-flow__connection-line {
    stroke: #1e3a8a;
    stroke-width: 2.5;
    stroke-dasharray: 5 5;
    animation: dash 0.5s linear infinite;
  }

  @keyframes dash {
    to {
      stroke-dashoffset: -10;
    }
  }

  /* ===== NODES - Enhanced borders and shadows ===== */
  .react-flow__node {
    transition: transform 0.1s ease, box-shadow 0.2s ease;
  }

  .react-flow__node:hover {
    z-index: 100 !important;
  }

  .react-flow__node.selected {
    box-shadow: 0 0 0 2px #1e3a8a, 0 4px 20px rgba(30, 58, 138, 0.3) !important;
  }

  /* ===== MINIMAP - Enhanced colors ===== */
  .react-flow__minimap {
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(30, 58, 138, 0.2);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .react-flow__minimap-mask {
    fill: rgba(30, 58, 138, 0.1);
  }

  /* ===== CONTROLS - More visible ===== */
  .react-flow__controls {
    background: white;
    border: 1px solid rgba(30, 58, 138, 0.2);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .react-flow__controls-button {
    background: white;
    border: none;
    border-bottom: 1px solid rgba(30, 58, 138, 0.1);
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s ease;
  }

  .react-flow__controls-button:hover {
    background: rgba(30, 58, 138, 0.1);
  }

  .react-flow__controls-button:last-child {
    border-bottom: none;
  }

  .react-flow__controls-button svg {
    fill: #1e3a8a;
  }

  /* ===== BACKGROUND GRID ===== */
  .react-flow__background {
    background-color: #fafbfc;
  }

  /* ===== SELECTION BOX ===== */
  .react-flow__selection {
    background: rgba(30, 58, 138, 0.08);
    border: 1px dashed #1e3a8a;
  }

  /* ===== EDGE SELECTION ===== */
  .react-flow__edge.selected .react-flow__edge-path {
    stroke: #1e3a8a;
    stroke-width: 3;
  }

  /* ===== PANE (Canvas) ===== */
  .react-flow__pane {
    cursor: grab;
  }

  .react-flow__pane:active {
    cursor: grabbing;
  }
`

// Grid snap size in pixels
const GRID_SNAP_SIZE = 20

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { StageNode } from './CustomNodes/StageNode'
import { InitialNode } from './CustomNodes/InitialNode'
import { EndNode } from './CustomNodes/EndNode'
import { ConditionalNode } from './CustomNodes/ConditionalNode'
import { N8nStyleEdge } from './CustomEdges/N8nStyleEdge'
import { useFlowBuilderStore } from '../../stores/flowBuilderStore'
import type { CustomEdge } from '../../types/flowBuilder'

// Importar utilidades
import { validateFlow } from './utils/flowValidation'
import {
  buildFlowConfiguration,
  logConfigurationForDebug,
  isConfigurationValid,
} from './utils/flowConfig'
import { validateFlowConfiguration } from './utils/flowValidations'
import { extractPositionChanges, extractEdgeRemovals, extractNodeRemovals } from './utils/flowChanges'
import { usePrecios } from '@/features/costos/hooks'

interface FlowBuilderProps {
  onSaveFlow?: (config: any) => Promise<void>
  onCancel?: () => void
  initialName?: string
  initialDescription?: string
  selectedOriginId?: string
  selectedOriginName?: string
  selectedProspectoCount?: number
}

/**
 * Main FlowBuilder Component
 * Manages the visual flow creation experience
 */
function FlowBuilderContent({
  onSaveFlow,
  onCancel,
  initialName = '',
  initialDescription = '',
  selectedOriginId = '',
  selectedOriginName = '',
  selectedProspectoCount = 0,
}: FlowBuilderProps) {
  // Zustand store - única fuente de verdad
  const {
    nodes: storeNodes,
    edges: storeEdges,
    flowName,
    flowDescription,
    addStageNode,
    addConditionalNode,
    addEndNode,
    addEdge: addFlowEdge,
    removeNode,
    updateNode,
    setNodePosition,
    removeEdge,
    setFlowName,
    setFlowDescription,
    resetFlow,
    initializeWithOrigin,
  } = useFlowBuilderStore()

  // Get pricing for cost display
  const { data: precios } = usePrecios()

  // ReactFlow state - sincronizado con Zustand
  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges)
  const [previewMode, setPreviewMode] = useState(false)
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const flowContainerRef = useRef<HTMLDivElement>(null)
  
  // ReactFlow instance for programmatic control
  const reactFlowInstance = useReactFlow()

  // Node & edge types — created ONCE to avoid React Flow re-processing on every render.
  // Callbacks (removeNode, updateNode) are passed via node.data instead of wrapper closures.
  const memoizedNodeTypes = useMemo(() => ({
    stage: StageNode,
    initial: InitialNode,
    end: EndNode,
    conditional: ConditionalNode,
  }), [])

  const memoizedEdgeTypes = useMemo(() => ({
    animated: N8nStyleEdge,
  }), [])

  // Sincronizar Zustand store con ReactFlow cuando cambian
  // Esta es la ÚNICA fuente de verdad para ReactFlow
  // Inyectamos callbacks (removeNode, updateNode) y precios en node.data
  // para que los custom nodes puedan accederlos sin wrapper closures.
  // IMPORTANTE: No incluir setNodes/setEdges en dependencias (causan loop infinito)
  useEffect(() => {
    // Inyectar callbacks y precios en node.data para cada nodo
    const nodesWithCallbacks = storeNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onDelete: removeNode,
        onUpdate: updateNode,
        precios: precios ?? undefined,
      },
    }))

    setNodes(nodesWithCallbacks)

    // Actualizar edges con tipo asegurado
    const edgesWithType = storeEdges.map((edge) => ({
      ...edge,
      type: edge.type || 'animated',
    }))

    setEdges(edgesWithType)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeNodes, storeEdges, precios])

  // Initialize form values
  useEffect(() => {
    if (initialName) setFlowName(initialName)
    if (initialDescription) setFlowDescription(initialDescription)
  }, [initialName, initialDescription, setFlowName, setFlowDescription])

  // Initialize with origin information
  useEffect(() => {
    if (selectedOriginId && selectedOriginName) {
      initializeWithOrigin(selectedOriginId, selectedOriginName, selectedProspectoCount)
    }
  }, [selectedOriginId, selectedOriginName, selectedProspectoCount, initializeWithOrigin])

  /**
   * Sincroniza cambios de posición de nodos a Zustand
   */
  const syncNodePositionChanges = (changes: NodeChange[]): void => {
    const positionChanges = extractPositionChanges(changes)
    positionChanges.forEach((change) => {
      setNodePosition(change.nodeId, change.position)
    })
  }

  /**
   * Sincroniza eliminaciones de nodos a Zustand
   */
  const syncNodeRemovals = (changes: NodeChange[]): void => {
    const removals = extractNodeRemovals(changes)
    removals.forEach((removal) => {
      removeNode(removal.nodeId)
    })
  }

  /**
   * Handle node changes (posición, selección, eliminación, etc)
   * Sincroniza cambios entre ReactFlow y Zustand
   */
  const handleNodesChangeWrapper = (changes: NodeChange[]): void => {
    // Aplicar cambios en ReactFlow primero
    onNodesChange(changes)

    // Sincronizar cambios de posición a Zustand
    syncNodePositionChanges(changes)

    // Sincronizar eliminaciones a Zustand (esto también limpiará edges automáticamente)
    syncNodeRemovals(changes)
  }

  /**
   * Sincroniza eliminaciones de edges a Zustand
   */
  const syncEdgeRemovals = (changes: EdgeChange[]): void => {
    const removals = extractEdgeRemovals(changes)
    removals.forEach((removal) => {
      removeEdge(removal.edgeId)
    })
  }

  /**
   * Handle edge changes (eliminación, selección, etc)
   * Sincroniza cambios entre ReactFlow y Zustand
   */
  const handleEdgesChangeWrapper = (changes: EdgeChange[]): void => {
    // Aplicar cambios en ReactFlow primero
    onEdgesChange(changes)

    // Luego sincronizar eliminaciones a Zustand
    syncEdgeRemovals(changes)
  }

  /**
   * Handle connection creation
   * Construye un edge validado y lo agrega al store
   */
  const handleConnect = (connection: Connection): void => {
    // Obtener handles con fallback a 'center'
    const sourceHandle = connection.sourceHandle || 'center'
    const targetHandle = connection.targetHandle || 'center'

    // Validar que source y target existan
    if (!connection.source || !connection.target) {
      return
    }

    // Construir edge
    const newEdge: CustomEdge = {
      id: `edge-${connection.source}-${sourceHandle}-${connection.target}-${targetHandle}`,
      source: connection.source,
      target: connection.target,
      sourceHandle,
      targetHandle,
      type: 'animated',
    } as any

    // Agregar a Zustand - ReactFlow se actualizará automáticamente
    addFlowEdge(newEdge)
  }

  /**
   * Valida el flujo antes de guardar
   * Early return para fallos de validación
   * @param isDraft - Si es true, no valida plantillas (permite guardar borradores)
   */
  const validateBeforeSave = (isDraft = false): boolean => {
    const validation = validateFlow(flowName, storeNodes, { isDraft })
    if (!validation.isValid) {
      alert(validation.message)
      return false
    }
    return true
  }

  /**
   * Handle save flow
   * Refactorizado con early returns y funciones pequeñas
   * @param isDraft - Si es true, guarda como borrador sin validar plantillas
   */
  const handleSaveFlow = async (isDraft = false): Promise<void> => {
    // Early return si la validación falla
    if (!validateBeforeSave(isDraft)) return

    try {
      // Construir configuración completa
      const config = buildFlowConfiguration(flowName, flowDescription, storeNodes, storeEdges)

      // Validar configuración básica
      if (!isConfigurationValid(config)) {
        alert('La configuración del flujo no es válida')
        return
      }

      // Validar configuración completa según requisitos del backend
      const validationResult = validateFlowConfiguration(config)
      if (!validationResult.isValid) {
        const errorMessage = validationResult.errors
          .map((error, index) => `${index + 1}. ${error}`)
          .join('\n')

        logger.error('Errores de validación del flujo:', validationResult.errors)
        alert(`El flujo tiene errores que deben corregirse:\n\n${errorMessage}`)
        return
      }

      // Log para debugging
      logConfigurationForDebug(config)

      // Guardar en backend
      await onSaveFlow?.(config)
    } catch (error) {
      logger.error('Error saving flow:', error)
      alert('Error al guardar el flujo. Por favor intenta de nuevo.')
    }
  }

  /**
   * Handle reset flow
   */
  const handleResetFlow = () => {
    setIsDiscardDialogOpen(true)
  }

  const handleConfirmDiscard = () => {
    resetFlow()
    // Sincronizar ReactFlow con los nodos y edges vacios del store
    setNodes([])
    setEdges([])
    setIsDiscardDialogOpen(false)
    // Cerrar el modal de creación y volver a flujos
    if (onCancel) {
      onCancel()
    }
  }

  // Contadores
  const stageCount = storeNodes.filter((n) => n.type === 'stage').length
  const conditionalCount = storeNodes.filter((n) => n.type === 'conditional').length
  const endNodeCount = storeNodes.filter((n) => n.type === 'end').length
  const isFlowValid = stageCount > 0

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    reactFlowInstance.zoomIn({ duration: 300 })
  }, [reactFlowInstance])

  const handleZoomOut = useCallback(() => {
    reactFlowInstance.zoomOut({ duration: 300 })
  }, [reactFlowInstance])

  const handleFitView = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.2, duration: 500 })
  }, [reactFlowInstance])

  const handleCenterView = useCallback(() => {
    const centerNode = nodes.find(n => n.type === 'initial') || nodes[0]
    if (centerNode) {
      reactFlowInstance.setCenter(
        centerNode.position.x + 100,
        centerNode.position.y + 50,
        { zoom: 1, duration: 500 }
      )
    }
  }, [reactFlowInstance, nodes])

  // MiniMap node color based on type
  const getMinimapNodeColor = useCallback((node: any) => {
    switch (node.type) {
      case 'initial':
        return '#6366f1' // Indigo
      case 'stage':
        return '#1e3a8a' // Segal blue
      case 'conditional':
        return '#f59e0b' // Amber
      case 'end':
        return '#10b981' // Green
      default:
        return '#64748b' // Slate
    }
  }, [])

  return (
    <div className="flex flex-col h-full w-full bg-white gap-4 p-4">
      <style>{ENHANCED_FLOW_STYLES}</style>

      {/* Form fields */}
      <div className="shrink-0 space-y-3 border-b border-segal-blue/10 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre del flujo */}
          <div className="space-y-2">
            <Label htmlFor="flow-name" className="text-xs font-semibold text-segal-dark">
              Nombre del Flujo <span className="text-segal-red">*</span>
            </Label>
            <Input
              id="flow-name"
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              placeholder="Ej: Flujo de recuperación"
              className="border-segal-blue/30 text-sm h-9"
            />
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="flow-desc" className="text-xs font-semibold text-segal-dark">
              Descripción (Opcional)
            </Label>
            <Input
              id="flow-desc"
              value={flowDescription}
              onChange={(e) => setFlowDescription(e.target.value)}
              placeholder="Describe el propósito"
              className="border-segal-blue/30 text-sm h-9"
            />
          </div>
        </div>

        {isFlowValid && stageCount > 0 && (
          <div className="rounded-lg bg-segal-green/10 border border-segal-green/30 p-2 flex gap-2">
            <CheckCircle2 className="h-4 w-4 text-segal-green shrink-0 mt-0.5" />
            <p className="text-xs text-segal-green">
              Flujo válido con {stageCount} etapa{stageCount > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Main Content - Canvas + Sidebar */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        {/* ReactFlow Canvas */}
        <div className="flex-1 rounded-lg border border-segal-blue/10 dark:border-segal-blue/30 overflow-hidden bg-gradient-to-br from-slate-50 to-segal-blue/5 dark:from-slate-800 dark:to-slate-900 flex flex-col">
          <div ref={flowContainerRef} className="flex-1 w-full" style={{ minHeight: 0 }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChangeWrapper}
              onEdgesChange={handleEdgesChangeWrapper}
              onConnect={handleConnect}
              nodeTypes={memoizedNodeTypes}
              edgeTypes={memoizedEdgeTypes}
              fitView
              fitViewOptions={{ padding: 0.2, maxZoom: 1.5 }}
              deleteKeyCode={['Backspace', 'Delete']}
              nodesConnectable={true}
              snapToGrid={snapToGrid}
              snapGrid={[GRID_SNAP_SIZE, GRID_SNAP_SIZE]}
              connectionLineType={ConnectionLineType.SmoothStep}
              connectionLineStyle={{ stroke: '#1e3a8a', strokeWidth: 2 }}
              defaultEdgeOptions={{ type: 'animated' }}
              minZoom={0.1}
              maxZoom={2}
              attributionPosition="bottom-left"
            >
              {/* Background with grid */}
              <Background
                variant={BackgroundVariant.Dots}
                gap={GRID_SNAP_SIZE}
                size={1}
                color="#cbd5e1"
              />
              
              {/* Enhanced Controls - Hidden, using custom */}
              <Controls 
                position="top-left" 
                showZoom={false}
                showFitView={false}
                showInteractive={false}
                className="hidden"
              />
              
              {/* Custom Floating Toolbar */}
              <Panel position="top-left" className="m-2">
                <div className="flex flex-col gap-1 bg-white rounded-lg border border-segal-blue/20 shadow-lg p-1">
                  <button
                    onClick={handleZoomIn}
                    className="p-2 rounded hover:bg-segal-blue/10 transition-colors group"
                    title="Acercar (Zoom In)"
                  >
                    <ZoomIn className="h-4 w-4 text-segal-blue group-hover:scale-110 transition-transform" />
                  </button>
                  <button
                    onClick={handleZoomOut}
                    className="p-2 rounded hover:bg-segal-blue/10 transition-colors group"
                    title="Alejar (Zoom Out)"
                  >
                    <ZoomOut className="h-4 w-4 text-segal-blue group-hover:scale-110 transition-transform" />
                  </button>
                  <div className="h-px bg-segal-blue/10 my-1" />
                  <button
                    onClick={handleFitView}
                    className="p-2 rounded hover:bg-segal-blue/10 transition-colors group"
                    title="Ajustar Vista (Fit All)"
                  >
                    <Maximize2 className="h-4 w-4 text-segal-blue group-hover:scale-110 transition-transform" />
                  </button>
                  <button
                    onClick={handleCenterView}
                    className="p-2 rounded hover:bg-segal-blue/10 transition-colors group"
                    title="Centrar en Inicio"
                  >
                    <MousePointer2 className="h-4 w-4 text-segal-blue group-hover:scale-110 transition-transform" />
                  </button>
                  <div className="h-px bg-segal-blue/10 my-1" />
                  <button
                    onClick={() => setSnapToGrid(!snapToGrid)}
                    className={`p-2 rounded transition-colors group ${snapToGrid ? 'bg-segal-blue/10' : 'hover:bg-segal-blue/5'}`}
                    title={snapToGrid ? 'Desactivar Grid Snap' : 'Activar Grid Snap'}
                  >
                    <Grid3X3 className={`h-4 w-4 transition-transform ${snapToGrid ? 'text-segal-blue' : 'text-gray-400'}`} />
                  </button>
                </div>
              </Panel>

              {/* Floating Add Node Toolbar */}
              <Panel position="top-center" className="m-2">
                <div className="flex gap-2 bg-white rounded-lg border border-segal-blue/20 shadow-lg p-2">
                  <button
                    onClick={addStageNode}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-segal-blue text-white text-sm font-medium hover:bg-segal-blue/90 transition-colors"
                    title="Agregar Etapa"
                  >
                    <Plus className="h-4 w-4" />
                    Etapa
                  </button>
                  <button
                    onClick={addConditionalNode}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-amber-400 text-amber-600 text-sm font-medium hover:bg-amber-50 transition-colors"
                    title="Agregar Condición"
                  >
                    <GitBranch className="h-4 w-4" />
                    Condición
                  </button>
                  <button
                    onClick={addEndNode}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-segal-green text-segal-green text-sm font-medium hover:bg-segal-green/5 transition-colors"
                    title="Agregar Fin"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Fin
                  </button>
                </div>
              </Panel>

              {/* Node Counter Badge */}
              <Panel position="top-right" className="m-2">
                <div className="flex gap-2 bg-white/90 backdrop-blur rounded-lg border border-segal-blue/20 shadow-sm px-3 py-1.5 text-xs font-medium">
                  <span className="text-segal-blue">{stageCount} etapas</span>
                  <span className="text-segal-blue/30">|</span>
                  <span className="text-amber-600">{conditionalCount} cond.</span>
                  <span className="text-segal-blue/30">|</span>
                  <span className="text-segal-green">{endNodeCount} fin</span>
                </div>
              </Panel>
              
              {/* Enhanced MiniMap with node colors */}
              <MiniMap 
                position="bottom-right"
                nodeColor={getMinimapNodeColor}
                nodeStrokeColor={(node) => getMinimapNodeColor(node)}
                nodeBorderRadius={4}
                maskColor="rgba(30, 58, 138, 0.1)"
                className="!bg-white/95 !border-segal-blue/20 !rounded-lg !shadow-lg"
                style={{ width: 180, height: 120 }}
                zoomable
                pannable
              />
            </ReactFlow>
          </div>
        </div>

        {/* Sidebar - Tools & Options - Scrollable */}
        <div className="w-72 rounded-lg border border-segal-blue/10 bg-white p-4 shadow-sm overflow-y-auto flex flex-col gap-4">
          {/* Flow Stats */}
          <div className="space-y-3 border-t border-segal-blue/10 pt-4">
            <h3 className="font-bold text-sm text-segal-dark">Resumen</h3>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-segal-blue/5 rounded-lg p-2 border border-segal-blue/10">
                <p className="text-segal-dark/60">Etapas</p>
                <p className="text-lg font-bold text-segal-blue">{stageCount}</p>
              </div>
              <div className="bg-segal-blue/5 rounded-lg p-2 border border-segal-blue/10">
                <p className="text-segal-dark/60">Condiciones</p>
                <p className="text-lg font-bold text-segal-blue">{conditionalCount}</p>
              </div>
              <div className="bg-segal-blue/5 rounded-lg p-2 border border-segal-blue/10">
                <p className="text-segal-dark/60">Conexiones</p>
                <p className="text-lg font-bold text-segal-blue">{edges.length}</p>
              </div>
            </div>
          </div>

          {/* Preview Mode Toggle */}
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded border border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5 font-medium text-sm transition-colors"
          >
            <Eye className="h-4 w-4" />
            {previewMode ? 'Salir' : 'Vista previa'}
          </button>

          {/* Actions */}
          <div className="space-y-2 border-t border-segal-blue/10 pt-4">
            <Button
              onClick={() => handleSaveFlow(false)}
              disabled={!isFlowValid}
              className="w-full bg-segal-green hover:bg-segal-green/90 text-white disabled:opacity-50 font-semibold flex items-center justify-center gap-2 h-10"
            >
              <Save className="h-4 w-4" />
              Guardar
            </Button>

            <Button
              onClick={() => handleSaveFlow(true)}
              disabled={!isFlowValid}
              variant="outline"
              className="w-full border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold flex items-center justify-center gap-2 h-10"
            >
              <Save className="h-4 w-4" />
              Guardar Borrador
            </Button>

            <Button
              onClick={handleResetFlow}
              variant="outline"
              className="w-full border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5 font-semibold flex items-center justify-center gap-2 h-10"
            >
              <RotateCcw className="h-4 w-4" />
              Descartar
            </Button>

            <Button
              onClick={onCancel}
              variant="outline"
              className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold h-10"
            >
              Cancelar
            </Button>
          </div>

          {/* Help text */}
          <div className="text-xs text-segal-dark/60 bg-segal-blue/5 rounded-lg p-3 border border-segal-blue/10 space-y-2">
            <p className="font-medium mb-1">💡 Instrucciones:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>📍 Arrastra nodos para mover</li>
              <li>🔗 Arrastra desde cualquier punto azul para conectar</li>
              <li>✏️ Click "Editar" en nodos para configurar</li>
              <li>🗑️ Selecciona conexión y presiona Delete para eliminar</li>
              <li>🗺️ Usa minimapa (esquina inferior derecha) para navegar</li>
              <li>➕ Agrega etapas y condiciones para crear ramificaciones</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Dialog de confirmación para descartar cambios */}
      <Dialog open={isDiscardDialogOpen} onOpenChange={setIsDiscardDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">¿Descartar cambios?</DialogTitle>
            <DialogDescription className="mt-2 space-y-2">
              <p>Todos los cambios realizados en el flujo se perderán de forma permanente.</p>
              <p className="text-sm text-orange-600 font-medium">⚠️ Esta acción no se puede deshacer.</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 justify-end mt-6">
            <Button
              variant="outline"
              onClick={() => setIsDiscardDialogOpen(false)}
              className="border-segal-blue/20 text-segal-dark hover:bg-segal-blue/5"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDiscard}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Descartar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * Exported component wrapped with ReactFlowProvider
 */
export function FlowBuilder(props: FlowBuilderProps) {
  return (
    <ReactFlowProvider>
      <FlowBuilderContent {...props} />
    </ReactFlowProvider>
  )
}

// Re-export for easier usage
export { StageNode, InitialNode, EndNode, ConditionalNode }
