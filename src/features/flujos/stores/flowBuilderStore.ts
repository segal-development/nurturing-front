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

  // Node actions
  addStageNode: () => void
  addConditionalNode: () => void
  removeNode: (nodeId: string) => void
  updateNode: (nodeId: string, data: Partial<any>) => void
  setNodePosition: (nodeId: string, position: { x: number; y: number }) => void

  // Edge actions
  addEdge: (edge: CustomEdge) => void
  removeEdge: (edgeId: string) => void

  // Flow actions
  setFlowName: (name: string) => void
  setFlowDescription: (description: string) => void
  resetFlow: () => void

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

  // Node actions
  addStageNode: () => {
    const state = get()
    const stageCount = state.nodes.filter((n) => n.type === 'stage').length
    const newY = 250 + stageCount * 200

    const newNode: CustomNode = {
      id: `stage-${nanoid()}`,
      data: {
        label: 'Nueva Etapa',
        dia_envio: 1,
        tipo_mensaje: 'email',
        plantilla_mensaje: '',
        activo: true,
      } as StageNodeData,
      position: { x: 400, y: newY },
      type: 'stage',
    }

    set((state) => ({
      nodes: [...state.nodes, newNode],
    }))
  },

  addConditionalNode: () => {
    const state = get()
    const nodeCount = state.nodes.length
    const newY = 250 + nodeCount * 150

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
      position: { x: 600, y: newY },
      type: 'conditional',
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
      console.warn('Edge already exists:', edge.id)
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
