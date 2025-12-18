/**
 * Visual Flow Builder for Nurturing Flows
 * Built with ReactFlow + Zustand for state management
 * Features: Drag-and-drop stage creation, real-time validation, visual preview
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MiniMap,
  ReactFlowProvider,
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
} from 'lucide-react'

// Style handles - n8n style (small, discrete, only visible on hover)
const HANDLE_STYLES = `
  .react-flow__handle {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    opacity: 0.7;
    transition: all 0.2s ease;
  }

  .react-flow__node:hover .react-flow__handle {
    opacity: 1;
    transform: scale(1.2);
  }

  .react-flow__handle:hover {
    opacity: 1;
    transform: scale(1.4);
    box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.2);
  }

  .react-flow__handle.connectingFrom,
  .react-flow__handle.connectingTo {
    background: #16a34a !important;
    opacity: 1;
    transform: scale(1.3);
  }
  
  /* Hide target handles when not connecting */
  .react-flow__handle-left,
  .react-flow__handle-right {
    z-index: 10;
  }
`

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
  const flowContainerRef = useRef<HTMLDivElement>(null)

  // Crear wrappers de nodos que tengan acceso a los callbacks
  const StageNodeWrapper = useCallback((props: any) => (
    <StageNode {...props} onDelete={removeNode} onUpdate={updateNode} precios={precios} />
  ), [removeNode, updateNode, precios])

  const ConditionalNodeWrapper = useCallback((props: any) => (
    <ConditionalNode {...props} onDelete={removeNode} onUpdate={updateNode} />
  ), [removeNode, updateNode])

  const EndNodeWrapper = useCallback((props: any) => (
    <EndNode {...props} onDelete={removeNode} onUpdate={updateNode} />
  ), [removeNode, updateNode])

  // Memoize nodeTypes para evitar recreación en cada render
  const memoizedNodeTypes = useMemo(
    () => ({
      stage: StageNodeWrapper,
      initial: InitialNode,
      end: EndNodeWrapper,
      conditional: ConditionalNodeWrapper,
    }),
    [StageNodeWrapper, ConditionalNodeWrapper, EndNodeWrapper]
  )

  // Memoize edgeTypes para los edges estilo n8n
  const memoizedEdgeTypes = useMemo(
    () => ({
      animated: N8nStyleEdge,
    }),
    []
  )

  // Sincronizar Zustand store con ReactFlow cuando cambian
  // Esta es la ÚNICA fuente de verdad para ReactFlow
  useEffect(() => {
    console.log('🔄 [useEffect Sync] Sincronizando desde Zustand...')
    console.log(`   - Nodos en Zustand: ${storeNodes.length}`)
    console.log(`   - Edges en Zustand: ${storeEdges.length}`)

    // Actualizar nodos
    setNodes(storeNodes)

    // Actualizar edges con tipo asegurado
    const edgesWithType = storeEdges.map((edge) => {
      const edgeWithType = {
        ...edge,
        type: edge.type || 'animated',
      }

      // Log para debugging de edges específicos
      if (edge.sourceHandle?.includes('-yes') || edge.sourceHandle?.includes('-no')) {
        console.log(`   ✓ Edge ${edge.id}: sourceHandle="${edge.sourceHandle}"`)
      }

      return edgeWithType
    })

    console.log(`🎨 [useEffect Sync] ReactFlow actualizado con ${edgesWithType.length} edges`)
    setEdges(edgesWithType)
  }, [storeNodes, storeEdges, setNodes, setEdges])

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
  const syncNodePositionChanges = useCallback(
    (changes: NodeChange[]): void => {
      const positionChanges = extractPositionChanges(changes)
      positionChanges.forEach((change) => {
        setNodePosition(change.nodeId, change.position)
      })
    },
    [setNodePosition]
  )

  /**
   * Sincroniza eliminaciones de nodos a Zustand
   */
  const syncNodeRemovals = useCallback(
    (changes: NodeChange[]): void => {
      const removals = extractNodeRemovals(changes)
      removals.forEach((removal) => {
        removeNode(removal.nodeId)
      })
    },
    [removeNode]
  )

  /**
   * Handle node changes (posición, selección, eliminación, etc)
   * Sincroniza cambios entre ReactFlow y Zustand
   */
  const handleNodesChangeWrapper = useCallback(
    (changes: NodeChange[]): void => {
      // Aplicar cambios en ReactFlow primero
      onNodesChange(changes)

      // Sincronizar cambios de posición a Zustand
      syncNodePositionChanges(changes)

      // Sincronizar eliminaciones a Zustand (esto también limpiará edges automáticamente)
      syncNodeRemovals(changes)
    },
    [onNodesChange, syncNodePositionChanges, syncNodeRemovals]
  )

  /**
   * Sincroniza eliminaciones de edges a Zustand
   */
  const syncEdgeRemovals = useCallback(
    (changes: EdgeChange[]): void => {
      const removals = extractEdgeRemovals(changes)
      removals.forEach((removal) => {
        removeEdge(removal.edgeId)
      })
    },
    [removeEdge]
  )

  /**
   * Handle edge changes (eliminación, selección, etc)
   * Sincroniza cambios entre ReactFlow y Zustand
   */
  const handleEdgesChangeWrapper = useCallback(
    (changes: EdgeChange[]): void => {
      // Aplicar cambios en ReactFlow primero
      onEdgesChange(changes)

      // Luego sincronizar eliminaciones a Zustand
      syncEdgeRemovals(changes)
    },
    [onEdgesChange, syncEdgeRemovals]
  )

  /**
   * Handle connection creation
   * Construye un edge validado y lo agrega al store
   */
  const handleConnect = useCallback(
    (connection: Connection): void => {
      // Obtener handles con fallback a 'center'
      const sourceHandle = connection.sourceHandle || 'center'
      const targetHandle = connection.targetHandle || 'center'

      // Validar que source y target existan
      if (!connection.source || !connection.target) {
        console.warn('⚠️ Conexión inválida: source o target missing')
        return
      }

      // Log de debugging
      console.log('🔗 Nueva conexión:', {
        source: connection.source,
        sourceHandle,
        target: connection.target,
        targetHandle,
        isConditionalBranch: sourceHandle.includes('-yes') || sourceHandle.includes('-no'),
      })

      // Construir edge
      const newEdge: CustomEdge = {
        id: `edge-${connection.source}-${sourceHandle}-${connection.target}-${targetHandle}`,
        source: connection.source,
        target: connection.target,
        sourceHandle,
        targetHandle,
        type: 'animated',
      } as any

      console.log('➕ Edge creado:', newEdge)
      console.log('📌 Agregando a Zustand (source of truth)')

      // Agregar a Zustand - ReactFlow se actualizará automáticamente
      addFlowEdge(newEdge)
    },
    [addFlowEdge]
  )

  /**
   * Valida el flujo antes de guardar
   * Early return para fallos de validación
   */
  const validateBeforeSave = useCallback((): boolean => {
    const validation = validateFlow(flowName, storeNodes)
    if (!validation.isValid) {
      alert(validation.message)
      return false
    }
    return true
  }, [flowName, storeNodes])

  /**
   * Handle save flow
   * Refactorizado con early returns y funciones pequeñas
   */
  const handleSaveFlow = useCallback(async (): Promise<void> => {
    // Early return si la validación falla
    if (!validateBeforeSave()) return

    try {
      // Construir configuración completa
      const config = buildFlowConfiguration(flowName, flowDescription, storeNodes, storeEdges)

      // Validar configuración básica
      if (!isConfigurationValid(config)) {
        alert('La configuración del flujo no es válida')
        return
      }

      // ✅ Validar configuración completa según requisitos del backend
      const validationResult = validateFlowConfiguration(config)
      if (!validationResult.isValid) {
        const errorMessage = validationResult.errors
          .map((error, index) => `${index + 1}. ${error}`)
          .join('\n')

        console.error('❌ Errores de validación del flujo:', validationResult.errors)
        alert(`⚠️ El flujo tiene errores que deben corregirse:\n\n${errorMessage}`)
        return
      }

      // Log para debugging
      logConfigurationForDebug(config)

      // Guardar en backend
      await onSaveFlow?.(config)
    } catch (error) {
      console.error('❌ Error saving flow:', error)
      alert('Error al guardar el flujo. Por favor intenta de nuevo.')
    }
  }, [flowName, flowDescription, storeNodes, storeEdges, onSaveFlow, validateBeforeSave])

  /**
   * Handle reset flow
   */
  const handleResetFlow = useCallback(() => {
    setIsDiscardDialogOpen(true)
  }, [])

  const handleConfirmDiscard = useCallback(() => {
    console.log('🗑️ Descartando cambios del flujo...')
    resetFlow()
    // Sincronizar ReactFlow con los nodos y edges vacios del store
    setNodes([])
    setEdges([])
    setIsDiscardDialogOpen(false)
    console.log('✅ Flujo descartado exitosamente')
    // Cerrar el modal de creación y volver a flujos
    if (onCancel) {
      onCancel()
    }
  }, [resetFlow, setNodes, setEdges, onCancel])

  // Contadores
  const stageCount = storeNodes.filter((n) => n.type === 'stage').length
  const conditionalCount = storeNodes.filter((n) => n.type === 'conditional').length
  const isFlowValid = stageCount > 0

  return (
    <div className="flex flex-col h-full w-full bg-white gap-4 p-4">
      <style>{HANDLE_STYLES}</style>

      {/* Header */}
      <div className="shrink-0 space-y-3 border-b border-segal-blue/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-segal-dark">Constructor de Flujos</h2>
          <p className="text-sm text-segal-dark/60">Diseña tu flujo visualmente</p>
        </div>

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
        <div className="flex-1 rounded-lg border border-segal-blue/10 overflow-hidden bg-gradient-to-br from-white to-segal-blue/5 flex flex-col">
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
              deleteKeyCode={['Backspace', 'Delete']}
              nodesConnectable={true}
            >
              <Background />
              <Controls position="top-left" />
              <MiniMap position="bottom-right" />
            </ReactFlow>
          </div>
        </div>

        {/* Sidebar - Tools & Options - Scrollable */}
        <div className="w-72 rounded-lg border border-segal-blue/10 bg-white p-4 shadow-sm overflow-y-auto flex flex-col gap-4">
          {/* Add Node Buttons */}
          <div className="space-y-2">
            <Button
              onClick={addStageNode}
              className="w-full bg-segal-blue hover:bg-segal-blue/90 text-white font-semibold flex items-center justify-center gap-2 h-10"
            >
              <Plus className="h-4 w-4" />
              Agregar Etapa
            </Button>

            <Button
              onClick={addConditionalNode}
              variant="outline"
              className="w-full border-segal-blue/30 text-segal-blue hover:bg-segal-blue/5 font-semibold flex items-center justify-center gap-2 h-10"
            >
              <GitBranch className="h-4 w-4" />
              Agregar Condición
            </Button>

            <Button
              onClick={addEndNode}
              variant="outline"
              className="w-full border-segal-green/30 text-segal-green hover:bg-segal-green/5 font-semibold flex items-center justify-center gap-2 h-10"
            >
              <CheckCircle2 className="h-4 w-4" />
              Agregar Fin
            </Button>
          </div>

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
              onClick={handleSaveFlow}
              disabled={!isFlowValid}
              className="w-full bg-segal-green hover:bg-segal-green/90 text-white disabled:opacity-50 font-semibold flex items-center justify-center gap-2 h-10"
            >
              <Save className="h-4 w-4" />
              Guardar
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
