/**
 * Mock implementations for flowBuilderStore
 * Includes initial state and utilities for test isolation
 */

import { nanoid } from 'nanoid'
import type { CustomNode, CustomEdge, FlowBuilderState } from '@/features/flujos/types/flowBuilder'

/**
 * Initial nodes as defined in the actual store
 * The store starts with an initial node and an end node by default
 */
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

/**
 * Initial flow state matching the actual store
 */
export const INITIAL_FLOW_STATE: FlowBuilderState = {
  nodes: INITIAL_NODES,
  edges: [],
  flowName: '',
  flowDescription: '',
}

/**
 * Empty flow state for tests that need a truly empty state
 */
export const EMPTY_FLOW_STATE: FlowBuilderState = {
  nodes: [],
  edges: [],
  flowName: '',
  flowDescription: '',
}

/**
 * Sample initial node (entry point)
 */
export const createInitialNode = (): CustomNode => ({
  id: 'node-initial',
  type: 'initial',
  position: { x: 0, y: 0 },
  data: {
    label: 'Inicio',
    origen: undefined,
    total_prospectos: 0,
  },
})

/**
 * Sample stage node
 */
export const createStageNode = (
  position: { x: number; y: number } = { x: 200, y: 0 },
  dayOffset = 1
): CustomNode => ({
  id: `node-stage-${nanoid(6)}`,
  type: 'stage',
  position,
  data: {
    label: `Etapa ${dayOffset}`,
    dia_envio: dayOffset,
    tipo_mensaje: 'email',
    tiempo_espera: 0,
    tiempo_verificacion_condicion: 0,
    plantilla_mensaje: 'Template',
    oferta_infocom_id: null,
  },
})

/**
 * Sample conditional node
 */
export const createConditionalNode = (
  position: { x: number; y: number } = { x: 400, y: 0 }
): CustomNode => ({
  id: `node-conditional-${nanoid(6)}`,
  type: 'conditional',
  position,
  data: {
    label: 'Condición',
    condition: {
      id: 1,
      label: 'Email abierto',
      type: 'email_opened',
      check_param: null,
      check_operator: null,
      check_value: null,
    },
    yesLabel: 'Sí',
    noLabel: 'No',
  },
})

/**
 * Sample end node
 */
export const createEndNode = (
  position: { x: number; y: number } = { x: 600, y: 0 }
): CustomNode => ({
  id: `node-end-${nanoid(6)}`,
  type: 'end',
  position,
  data: {
    label: 'Fin',
  },
})

/**
 * Sample edge (connection)
 */
export const createEdge = (
  source: string,
  target: string,
  label: string = ''
): CustomEdge => ({
  id: `edge-${nanoid(6)}`,
  source,
  target,
  label,
  data: { isConditionalPath: label.toLowerCase() === 'sí' || label.toLowerCase() === 'no' },
})

/**
 * Create a complete sample flow
 */
export const createSampleFlow = () => {
  const initialNode = createInitialNode()
  const stageNode1 = createStageNode({ x: 200, y: 0 }, 1)
  const stageNode2 = createStageNode({ x: 400, y: 0 }, 7)
  const conditionalNode = createConditionalNode({ x: 600, y: 0 })
  const endNodeYes = createEndNode({ x: 800, y: -100 })
  const endNodeNo = createEndNode({ x: 800, y: 100 })

  const nodes: CustomNode[] = [
    initialNode,
    stageNode1,
    stageNode2,
    conditionalNode,
    endNodeYes,
    endNodeNo,
  ]

  const edges: CustomEdge[] = [
    createEdge(initialNode.id, stageNode1.id),
    createEdge(stageNode1.id, stageNode2.id),
    createEdge(stageNode2.id, conditionalNode.id),
    createEdge(conditionalNode.id, endNodeYes.id, 'Sí'),
    createEdge(conditionalNode.id, endNodeNo.id, 'No'),
  ]

  return { nodes, edges }
}

/**
 * Reset flow builder store to initial state
 */
export const resetFlowBuilderStore = (store: any) => {
  store.setState(INITIAL_FLOW_STATE)
}

/**
 * Helper: Get node by ID from state
 */
export const getNodeById = (nodes: CustomNode[], nodeId: string): CustomNode | undefined => {
  return nodes.find((n) => n.id === nodeId)
}

/**
 * Helper: Get edges connected to a node
 */
export const getConnectedEdges = (edges: CustomEdge[], nodeId: string): CustomEdge[] => {
  return edges.filter((e) => e.source === nodeId || e.target === nodeId)
}

/**
 * Helper: Validate node chain is connected
 */
export const isFlowConnected = (nodes: CustomNode[], edges: CustomEdge[]): boolean => {
  if (nodes.length === 0) return false
  if (nodes.length === 1) return true

  const visited = new Set<string>()
  const queue = [nodes[0].id]
  visited.add(nodes[0].id)

  while (queue.length > 0) {
    const currentId = queue.shift()!
    const connectedEdges = edges.filter((e) => e.source === currentId || e.target === currentId)

    for (const edge of connectedEdges) {
      const nextId = edge.source === currentId ? edge.target : edge.source
      if (!visited.has(nextId)) {
        visited.add(nextId)
        queue.push(nextId)
      }
    }
  }

  return visited.size === nodes.length
}

/**
 * Helper: Count nodes by type
 */
export const countNodesByType = (
  nodes: CustomNode[],
  type: string
): number => {
  return nodes.filter((n) => n.type === type).length
}
