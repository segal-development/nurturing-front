/**
 * Visual Flow Builder for Nurturing Flows
 * Built with ReactFlow + Zustand for state management
 * Features: Drag-and-drop stage creation, real-time validation, visual preview
 */

import { useCallback, useRef, useState, useMemo, useEffect } from 'react'
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MiniMap,
  ReactFlowProvider,
} from 'reactflow'
import type { Connection } from 'reactflow'
import 'reactflow/dist/style.css'
import {
  Plus,
  CheckCircle2,
  Save,
  RotateCcw,
  Eye,
  GitBranch,
} from 'lucide-react'

// Style handles to be visible and draggable
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

  // ReactFlow state - sincronizado con Zustand
  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges)
  const [previewMode, setPreviewMode] = useState(false)
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false)
  const flowContainerRef = useRef<HTMLDivElement>(null)

  // Crear wrappers de nodos que tengan acceso a los callbacks
  const StageNodeWrapper = useCallback((props: any) => (
    <StageNode {...props} onDelete={removeNode} onUpdate={updateNode} />
  ), [removeNode, updateNode])

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
   * Handle node changes (posición, selección, etc)
   */
  const handleNodesChangeWrapper = useCallback(
    (changes: any[]) => {
      // Aplicar cambios en ReactFlow
      onNodesChange(changes)

      // Sincronizar cambios de posición a Zustand
      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
          setNodePosition(change.id, change.position)
        }
      })
    },
    [onNodesChange, setNodePosition]
  )

  /**
   * Handle edge changes (eliminación, selección, etc)
   */
  const handleEdgesChangeWrapper = useCallback(
    (changes: any[]) => {
      // Aplicar cambios en ReactFlow
      onEdgesChange(changes)

      // Sincronizar eliminaciones de edges a Zustand
      changes.forEach((change) => {
        if (change.type === 'remove') {
          removeEdge(change.id)
        }
      })
    },
    [onEdgesChange, removeEdge]
  )

  /**
   * Handle connection creation
   */
  const handleConnect = useCallback(
    (connection: Connection) => {
      const sourceHandle = connection.sourceHandle || 'center'
      const targetHandle = connection.targetHandle || 'center'

      console.log('🔗 [handleConnect] Nueva conexión:', {
        source: connection.source,
        sourceHandle,
        target: connection.target,
        targetHandle,
        isYesHandle: sourceHandle?.includes('-yes') || false,
        isNoHandle: sourceHandle?.includes('-no') || false,
      })

      const newEdge: CustomEdge = {
        id: `edge-${connection.source}-${sourceHandle}-${connection.target}-${targetHandle}`,
        source: connection.source || '',
        target: connection.target || '',
        sourceHandle,
        targetHandle,
        type: 'animated',
      } as any

      console.log('➕ [handleConnect] Edge creado:', newEdge)
      console.log('📌 [handleConnect] Agregando SOLO a Zustand (source of truth)')

      // SOLO agregar a Zustand - ReactFlow se actualizará automáticamente desde storeEdges
      addFlowEdge(newEdge)
    },
    [addFlowEdge]
  )

  /**
   * Handle save flow
   */
  const handleSaveFlow = useCallback(async () => {
    // Validación básica
    if (!flowName.trim()) {
      alert('Por favor ingresa un nombre para el flujo')
      return
    }

    const stageCount = storeNodes.filter((n) => n.type === 'stage').length
    if (stageCount === 0) {
      alert('Debes agregar al menos una etapa')
      return
    }

    try {
      // DEBUG: Log de los nodos del store ANTES de guardar
      console.log('[DEBUG FlowBuilder] storeNodes ANTES de guardar:')
      storeNodes.forEach((n) => {
        console.log(`  Nodo ${n.id}:`, {
          type: n.type,
          data: n.data,
        })
      })

      // Crear estructura completa para el backend
      const stages = storeNodes
        .filter((n) => n.type === 'stage')
        .map((n, index) => {
          const data = n.data as any
          return {
            id: n.id,
            orden: index,
            label: data.label,
            dia_envio: data.dia_envio || 1,
            tipo_mensaje: data.tipo_mensaje || 'email',
            plantilla_mensaje: data.plantilla_mensaje || '',
            fecha_inicio_personalizada: data.fecha_inicio_personalizada || null,
            activo: data.activo !== false,
          }
        })

      // Obtener condiciones
      const conditions = storeNodes
        .filter((n) => n.type === 'conditional')
        .map((n) => {
          const data = n.data as any
          return {
            id: n.id,
            label: data.label,
            description: data.description || '',
            condition_type: data.condition?.type || 'email_opened',
            condition_label: data.condition?.label || '',
            yes_label: data.yesLabel || 'Sí',
            no_label: data.noLabel || 'No',
          }
        })

      // Procesar conexiones (edges) para crear la estructura de ramificaciones
      const branches = storeEdges
        .filter((e) => {
          const sourceNode = storeNodes.find((n) => n.id === e.source)
          return sourceNode?.type === 'conditional'
        })
        .map((e) => ({
          edge_id: e.id,
          source_node_id: e.source,
          target_node_id: e.target,
          source_handle: e.sourceHandle,
          target_handle: e.targetHandle,
          condition_branch: e.sourceHandle?.includes('yes') ? 'yes' : 'no',
        }))

      // Crear estructura de nodos para visualización - incluir TODOS los datos
      const nodesStructure = storeNodes.map((n) => {
        console.log(`[DEBUG GUARDANDO] Nodo ${n.id}:`, {
          type: n.type,
          data: n.data,
        })
        return {
          id: n.id,
          type: n.type,
          position: n.position,
          data: n.data, // Guardar todos los datos tal como están
        }
      })

      // Crear estructura de edges para visualización
      const edgesStructure = storeEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        type: e.type || 'animated',
      }))

      const config = {
        nombre: flowName,
        descripcion: flowDescription,

        // Datos visuales (para reconstruir el flujo en el editor)
        visual: {
          nodes: nodesStructure,
          edges: edgesStructure,
        },

        // Datos estructurados para el backend (para ejecutar el flujo)
        structure: {
          stages,
          conditions,
          branches,
          initial_node: storeNodes.find((n) => n.type === 'initial') || null,
          end_nodes: storeNodes.filter((n) => n.type === 'end'),
        },

        // Datos legados (compatibilidad)
        stages,
      }

      console.log('[DEBUG FINAL] config.visual.nodes que se enviará:', config.visual.nodes)
      console.log('[DEBUG FINAL] config.visual completo:', config.visual)

      await onSaveFlow?.(config)
    } catch (error) {
      console.error('Error saving flow:', error)
      alert('Error al guardar el flujo')
    }
  }, [flowName, flowDescription, storeNodes, storeEdges, onSaveFlow])

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
      <style>{handleStyles}</style>

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
