/**
 * Zustand store para Flow Builder state management
 * Única fuente de verdad para nodos, edges y configuración del flujo
 */

import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type {
  CustomNode,
  CustomEdge,
  StageNodeData,
  ConditionalNodeData,
} from '../types/flowBuilder'

interface FlowBuilderStore {
  // State
  nodes: CustomNode[]
  edges: CustomEdge[]
  flowName: string
  flowDescription: string
  selectedNodeId: string | null

  // Node actions
  addStageNode: () => void
  addConditionalNode: () => void
  addEndNode: () => void
  removeNode: (nodeId: string) => void
  updateNode: (nodeId: string, data: Partial<any>) => void
  setNodePosition: (nodeId: string, position: { x: number; y: number }) => void

  // Selection actions
  setSelectedNodeId: (id: string | null) => void

  // Edge actions
  addEdge: (edge: CustomEdge) => void
  removeEdge: (edgeId: string) => void

  // Flow actions
  setFlowName: (name: string) => void
  setFlowDescription: (description: string) => void
  resetFlow: () => void
  initializeWithOrigin: (originId: string, originName: string, prospectoCount: number) => void
  loadFlowConfiguration: (nodes: CustomNode[], edges: CustomEdge[]) => void

  // Utility
  getStageCount: () => number
  getConditionalCount: () => number
}

// =============================================================================
// LAYOUT CONSTANTS
// =============================================================================

/** Horizontal spacing between nodes */
const NODE_SPACING_X = 280

/** Vertical center line for horizontal layout */
const NODE_CENTER_Y = 200

/** Initial node X position (left side) */
const INITIAL_NODE_X = 100

// =============================================================================
// INITIAL STATE
// =============================================================================

/**
 * Initial nodes: Only the start node.
 * End node is added explicitly by the user when needed.
 */
const INITIAL_NODES: CustomNode[] = [
  {
    id: 'initial-1',
    data: { label: 'Inicio - Selecciona prospectos' },
    position: { x: INITIAL_NODE_X, y: NODE_CENTER_Y },
    type: 'initial',
  },
]

export const useFlowBuilderStore = create<FlowBuilderStore>((set, get) => ({
  // Initial state
  nodes: INITIAL_NODES,
  edges: [],
  flowName: '',
  flowDescription: '',
  selectedNodeId: null,

  /**
   * Calculate position for the next node in horizontal layout.
   * Places new nodes to the right of the rightmost existing node.
   * Excludes 'end' nodes from position calculation to keep them at the end.
   */
  _getNextNodePosition: (): { x: number; y: number } => {
    const state = get()
    
    // Get all nodes except 'end' type (end nodes should be placed after all other nodes)
    const workflowNodes = state.nodes.filter((n) => n.type !== 'end')
    
    if (workflowNodes.length === 0) {
      // Edge case: no nodes at all, start from initial position
      return { x: INITIAL_NODE_X, y: NODE_CENTER_Y }
    }
    
    // Find the rightmost workflow node
    const rightmostNode = workflowNodes.reduce((prev, curr) => 
      curr.position.x > prev.position.x ? curr : prev
    )
    
    // Position new node to the right with consistent spacing
    return {
      x: rightmostNode.position.x + NODE_SPACING_X,
      y: NODE_CENTER_Y,
    }
  },

  // Node actions
  addStageNode: () => {
    const state = get()
    const stageCount = state.nodes.filter((n) => n.type === 'stage').length
    const position = (get() as any)._getNextNodePosition()

    const newNode: CustomNode = {
      id: `stage-${nanoid()}`,
      data: {
        label: 'Nueva Etapa',
        dia_envio: stageCount === 0 ? 0 : 1, // First stage: 0 (immediate), others: 1 day
        tipo_mensaje: 'email',
        plantilla_mensaje: '',
        plantilla_type: 'inline',
        activo: true,
      } as StageNodeData,
      position,
      type: 'stage',
    }

    set((state) => ({
      nodes: [...state.nodes, newNode],
    }))
  },

  addConditionalNode: () => {
    const position = (get() as any)._getNextNodePosition()

    const newNode: CustomNode = {
      id: `conditional-${nanoid()}`,
      data: {
        label: 'Nueva Condición',
        description: '',
        condition: {
          id: `cond-${nanoid()}`,
          type: 'email_opened',
          label: 'Email abierto',
        },
        yesLabel: 'Sí',
        noLabel: 'No',
      } as ConditionalNodeData,
      position,
      type: 'conditional',
    }

    set((state) => ({
      nodes: [...state.nodes, newNode],
    }))
  },

  addEndNode: () => {
    const state = get()
    const endNodeCount = state.nodes.filter((n) => n.type === 'end').length
    const position = (get() as any)._getNextNodePosition()

    const newNode: CustomNode = {
      id: `end-${nanoid()}`,
      data: { label: `Fin ${endNodeCount > 0 ? endNodeCount + 1 : ''}` },
      position,
      type: 'end',
    }

    set((state) => ({
      nodes: [...state.nodes, newNode],
    }))
  },

  removeNode: (nodeId: string) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      ),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    }))
  },

  updateNode: (nodeId: string, data: Partial<any>) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
    }))
  },

  setNodePosition: (nodeId: string, position: { x: number; y: number }) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, position } : n
      ),
    }))
  },

  // Selection actions
  setSelectedNodeId: (id: string | null) => {
    set({ selectedNodeId: id })
  },

  // Edge actions
  addEdge: (edge: CustomEdge) => {
    const state = get()

    // Validar que no sea una conexión duplicada
    const exists = state.edges.some(
      (e) =>
        e.source === edge.source &&
        e.target === edge.target &&
        e.sourceHandle === edge.sourceHandle &&
        e.targetHandle === edge.targetHandle
    )

    if (exists) {
      return
    }

    set((state) => ({
      edges: [...state.edges, edge],
    }))
  },

  removeEdge: (edgeId: string) => {
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== edgeId),
    }))
  },

  // Flow actions
  setFlowName: (name: string) => {
    set({ flowName: name })
  },

  setFlowDescription: (description: string) => {
    set({ flowDescription: description })
  },

  resetFlow: () => {
    set({
      nodes: INITIAL_NODES,
      edges: [],
      flowName: '',
      flowDescription: '',
      selectedNodeId: null,
    })
  },

  initializeWithOrigin: (originId: string, originName: string, prospectoCount: number) => {
    // Create fresh initial node with origin data (no end node by default)
    const initialNode: CustomNode = {
      id: 'initial-1',
      data: {
        label: `Inicio - ${originName}`,
        origen_id: originId,
        origen_nombre: originName,
        prospectos_count: prospectoCount,
      },
      position: { x: INITIAL_NODE_X, y: NODE_CENTER_Y },
      type: 'initial',
    }

    set({
      nodes: [initialNode],
      edges: [],
    })
  },

  loadFlowConfiguration: (nodes: CustomNode[], edges: CustomEdge[]) => {
    set({
      nodes,
      edges,
    })
  },

  // Utility
  getStageCount: () => {
    return get().nodes.filter((n) => n.type === 'stage').length
  },

  getConditionalCount: () => {
    return get().nodes.filter((n) => n.type === 'conditional').length
  },
}))
