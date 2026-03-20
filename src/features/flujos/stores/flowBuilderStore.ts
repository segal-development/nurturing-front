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

const INITIAL_NODES: CustomNode[] = [
  {
    id: 'initial-1',
    data: { label: 'Inicio - Selecciona prospectos' },
    position: { x: 400, y: 50 },
    type: 'initial',
  },
  {
    id: 'end-1',
    data: { label: 'Fin' },
    position: { x: 400, y: 800 },
    type: 'end',
  },
]

export const useFlowBuilderStore = create<FlowBuilderStore>((set, get) => ({
  // Initial state
  nodes: INITIAL_NODES,
  edges: [],
  flowName: '',
  flowDescription: '',
  selectedNodeId: null,

  // Helper to find the rightmost node position
  _getNextNodePosition: (): { x: number; y: number } => {
    const state = get()
    const nonInitialNodes = state.nodes.filter((n) => n.type !== 'initial')
    
    if (nonInitialNodes.length === 0) {
      // First node after initial - position to the right of initial
      return { x: 400, y: 200 }
    }
    
    // Find the rightmost node
    const rightmostNode = nonInitialNodes.reduce((prev, curr) => 
      curr.position.x > prev.position.x ? curr : prev
    )
    
    // Position new node to the right of the rightmost node
    return {
      x: rightmostNode.position.x + 250,
      y: rightmostNode.position.y,
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
    const updatedNodes = INITIAL_NODES.map((node) =>
      node.id === 'initial-1'
        ? {
            ...node,
            data: {
              ...node.data,
              label: `Inicio - ${originName}`,
              origen_id: originId,
              origen_nombre: originName,
              prospectos_count: prospectoCount,
            },
          }
        : node
    )

    set({
      nodes: updatedNodes,
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
