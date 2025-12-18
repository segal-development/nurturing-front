/**
 * Unit tests for flowBuilderStore (Zustand)
 * Core business logic: Node/edge management and flow state
 *
 * Coverage: Core functions (node/edge operations) = 100%
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useFlowBuilderStore } from '@/features/flujos/stores/flowBuilderStore'
import {
  INITIAL_FLOW_STATE,
  EMPTY_FLOW_STATE,
  createInitialNode,
  createStageNode,
  createConditionalNode,
  createEndNode,
  createEdge,
  createSampleFlow,
  resetFlowBuilderStore,
  getNodeById,
  getConnectedEdges,
  isFlowConnected,
  countNodesByType,
} from '../mocks/flowBuilderStore.mock'

describe('flowBuilderStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useFlowBuilderStore.setState(INITIAL_FLOW_STATE)
  })

  describe('Initial State', () => {
    it('should have initial nodes (initial + end) on initialization', () => {
      const state = useFlowBuilderStore.getState()
      // Store starts with initial node and end node by default
      expect(state.nodes).toHaveLength(2)
      expect(state.nodes[0].type).toBe('initial')
      expect(state.nodes[0].id).toBe('initial-1')
      expect(state.nodes[1].type).toBe('end')
      expect(state.nodes[1].id).toBe('end-1')
      expect(state.edges).toEqual([])
      expect(state.flowName).toBe('')
      expect(state.flowDescription).toBe('')
    })
  })

  describe('Node Operations', () => {
    describe('addStageNode', () => {
      it('should add a stage node to the store', () => {
        const { addStageNode } = useFlowBuilderStore.getState()

        addStageNode()

        const state = useFlowBuilderStore.getState()
        // Initial state has 2 nodes (initial + end), so now should have 3
        expect(state.nodes).toHaveLength(3)
        const stageNodes = state.nodes.filter((n) => n.type === 'stage')
        expect(stageNodes).toHaveLength(1)
        expect(stageNodes[0].id).toMatch(/^stage-/)
      })

      it('should add multiple stage nodes', () => {
        const { addStageNode } = useFlowBuilderStore.getState()

        addStageNode()
        addStageNode()

        const state = useFlowBuilderStore.getState()
        // Initial 2 nodes + 2 stage nodes = 4
        expect(state.nodes).toHaveLength(4)
        const stageNodes = state.nodes.filter((n) => n.type === 'stage')
        expect(stageNodes).toHaveLength(2)
      })

      it('should create stage nodes with correct default data', () => {
        const { addStageNode } = useFlowBuilderStore.getState()

        addStageNode()

        const state = useFlowBuilderStore.getState()
        const stageNode = state.nodes.find((n) => n.type === 'stage')!
        expect(stageNode.data.tipo_mensaje).toBe('email')
        expect(stageNode.data.dia_envio).toBe(0) // First stage is immediate
        expect(stageNode.data.activo).toBe(true)
      })
    })

    describe('addConditionalNode', () => {
      it('should add a conditional node', () => {
        const { addConditionalNode } = useFlowBuilderStore.getState()

        addConditionalNode()

        const state = useFlowBuilderStore.getState()
        // Initial 2 nodes + 1 conditional = 3
        expect(state.nodes).toHaveLength(3)
        const conditionalNodes = state.nodes.filter((n) => n.type === 'conditional')
        expect(conditionalNodes).toHaveLength(1)
      })

      it('should create conditional node with correct default data', () => {
        const { addConditionalNode } = useFlowBuilderStore.getState()

        addConditionalNode()

        const state = useFlowBuilderStore.getState()
        const condNode = state.nodes.find((n) => n.type === 'conditional')!
        expect(condNode.data.condition).toBeDefined()
        expect(condNode.data.condition.type).toBe('email_opened')
        expect(condNode.data.yesLabel).toBe('Sí')
        expect(condNode.data.noLabel).toBe('No')
      })
    })

    describe('addEndNode', () => {
      it('should add an end node', () => {
        const { addEndNode } = useFlowBuilderStore.getState()

        addEndNode()

        const state = useFlowBuilderStore.getState()
        // Initial 2 nodes (including 1 end) + 1 new end = 3
        expect(state.nodes).toHaveLength(3)
        const endNodes = state.nodes.filter((n) => n.type === 'end')
        expect(endNodes).toHaveLength(2) // Original end-1 plus new one
      })
    })

    describe('removeNode', () => {
      it('should remove a node by ID', () => {
        const { addStageNode, removeNode } = useFlowBuilderStore.getState()

        addStageNode()
        addStageNode()

        const stateBeforeRemove = useFlowBuilderStore.getState()
        const stageNodes = stateBeforeRemove.nodes.filter((n) => n.type === 'stage')
        const nodeToRemove = stageNodes[0]

        removeNode(nodeToRemove.id)

        const state = useFlowBuilderStore.getState()
        // Had 4 nodes (2 initial + 2 stage), now 3
        expect(state.nodes).toHaveLength(3)
        expect(state.nodes.find((n) => n.id === nodeToRemove.id)).toBeUndefined()
      })

      it('should remove associated edges when node is removed', () => {
        const { nodes, edges } = createSampleFlow()
        const stageNode = nodes.find((n) => n.type === 'stage')!
        useFlowBuilderStore.setState({ nodes, edges })

        const { removeNode } = useFlowBuilderStore.getState()
        removeNode(stageNode.id)

        const state = useFlowBuilderStore.getState()
        const connectedEdges = state.edges.filter(
          (e) => e.source === stageNode.id || e.target === stageNode.id
        )
        expect(connectedEdges).toHaveLength(0)
      })

      it('should not throw when removing non-existent node', () => {
        const { removeNode } = useFlowBuilderStore.getState()
        expect(() => removeNode('non-existent-id')).not.toThrow()
      })
    })

    describe('updateNode', () => {
      it('should update node data', () => {
        const { addStageNode, updateNode } = useFlowBuilderStore.getState()

        addStageNode()

        const stageNode = useFlowBuilderStore.getState().nodes.find((n) => n.type === 'stage')!
        updateNode(stageNode.id, { dia_envio: 7, tipo_mensaje: 'sms' })

        const state = useFlowBuilderStore.getState()
        const updatedNode = state.nodes.find((n) => n.type === 'stage')!
        expect(updatedNode.data.dia_envio).toBe(7)
        expect(updatedNode.data.tipo_mensaje).toBe('sms')
      })

      it('should merge partial updates', () => {
        const { addStageNode, updateNode } = useFlowBuilderStore.getState()

        addStageNode()

        const stageNode = useFlowBuilderStore.getState().nodes.find((n) => n.type === 'stage')!
        updateNode(stageNode.id, { dia_envio: 3 })

        const state = useFlowBuilderStore.getState()
        const updatedNode = state.nodes.find((n) => n.type === 'stage')!
        expect(updatedNode.data.dia_envio).toBe(3)
        expect(updatedNode.data.tipo_mensaje).toBe('email') // unchanged
      })

      it('should handle updating non-existent node gracefully', () => {
        const { updateNode } = useFlowBuilderStore.getState()
        expect(() => updateNode('non-existent-id', { dia_envio: 5 })).not.toThrow()
      })
    })

    describe('setNodePosition', () => {
      it('should update node position', () => {
        const { addStageNode, setNodePosition } = useFlowBuilderStore.getState()

        addStageNode()

        const stageNode = useFlowBuilderStore.getState().nodes.find((n) => n.type === 'stage')!
        setNodePosition(stageNode.id, { x: 100, y: 200 })

        const state = useFlowBuilderStore.getState()
        const updatedNode = state.nodes.find((n) => n.type === 'stage')!
        expect(updatedNode.position).toEqual({ x: 100, y: 200 })
      })
    })
  })

  describe('Edge Operations', () => {
    describe('addEdge', () => {
      it('should add an edge between two nodes', () => {
        const { addStageNode, addEdge } = useFlowBuilderStore.getState()

        addStageNode()
        addStageNode()

        const stageNodes = useFlowBuilderStore.getState().nodes.filter((n) => n.type === 'stage')
        const edge = createEdge(stageNodes[0].id, stageNodes[1].id)
        addEdge(edge)

        const state = useFlowBuilderStore.getState()
        expect(state.edges).toHaveLength(1)
        expect(state.edges[0].source).toBe(stageNodes[0].id)
        expect(state.edges[0].target).toBe(stageNodes[1].id)
      })

      it('should prevent duplicate edges', () => {
        const { addStageNode, addEdge } = useFlowBuilderStore.getState()

        addStageNode()
        addStageNode()

        const stageNodes = useFlowBuilderStore.getState().nodes.filter((n) => n.type === 'stage')
        const edge1 = createEdge(stageNodes[0].id, stageNodes[1].id)
        const edge2 = createEdge(stageNodes[0].id, stageNodes[1].id)

        addEdge(edge1)
        addEdge(edge2) // Should be ignored if duplicate

        const state = useFlowBuilderStore.getState()
        const duplicateEdges = state.edges.filter(
          (e) => e.source === stageNodes[0].id && e.target === stageNodes[1].id
        )
        // Store prevents duplicates, so should be 1
        expect(duplicateEdges.length).toBe(1)
      })

      it('should handle conditional path labels', () => {
        const { addConditionalNode, addEdge } = useFlowBuilderStore.getState()

        addConditionalNode()

        const state = useFlowBuilderStore.getState()
        const condNode = state.nodes.find((n) => n.type === 'conditional')!
        const endNode = state.nodes.find((n) => n.type === 'end')! // Use existing end node

        const edgeYes = createEdge(condNode.id, endNode.id, 'Sí')
        // Use different target handle for 'No' to avoid duplicate detection
        const edgeNo = { ...createEdge(condNode.id, endNode.id, 'No'), sourceHandle: 'no' }

        addEdge(edgeYes)
        addEdge(edgeNo)

        const finalState = useFlowBuilderStore.getState()
        expect(finalState.edges.filter((e) => e.label === 'Sí')).toHaveLength(1)
        expect(finalState.edges.filter((e) => e.label === 'No')).toHaveLength(1)
      })
    })

    describe('removeEdge', () => {
      it('should remove an edge by ID', () => {
        const { nodes, edges } = createSampleFlow()
        useFlowBuilderStore.setState({ nodes, edges })

        const firstEdgeId = edges[0].id
        const { removeEdge } = useFlowBuilderStore.getState()
        removeEdge(firstEdgeId)

        const state = useFlowBuilderStore.getState()
        expect(state.edges.find((e) => e.id === firstEdgeId)).toBeUndefined()
        expect(state.edges).toHaveLength(edges.length - 1)
      })

      it('should not throw when removing non-existent edge', () => {
        const { removeEdge } = useFlowBuilderStore.getState()
        expect(() => removeEdge('non-existent-edge')).not.toThrow()
      })
    })
  })

  describe('Flow Metadata', () => {
    describe('setFlowName', () => {
      it('should set flow name', () => {
        const { setFlowName } = useFlowBuilderStore.getState()
        setFlowName('Mi Flujo Importante')

        const state = useFlowBuilderStore.getState()
        expect(state.flowName).toBe('Mi Flujo Importante')
      })

      it('should handle empty string', () => {
        const { setFlowName } = useFlowBuilderStore.getState()
        setFlowName('')

        const state = useFlowBuilderStore.getState()
        expect(state.flowName).toBe('')
      })

      it('should handle long names', () => {
        const longName = 'A'.repeat(200)
        const { setFlowName } = useFlowBuilderStore.getState()
        setFlowName(longName)

        const state = useFlowBuilderStore.getState()
        expect(state.flowName).toBe(longName)
      })
    })

    describe('setFlowDescription', () => {
      it('should set flow description', () => {
        const { setFlowDescription } = useFlowBuilderStore.getState()
        setFlowDescription('Descripción del flujo')

        const state = useFlowBuilderStore.getState()
        expect(state.flowDescription).toBe('Descripción del flujo')
      })

      it('should handle multiline text', () => {
        const multiline = 'Line 1\nLine 2\nLine 3'
        const { setFlowDescription } = useFlowBuilderStore.getState()
        setFlowDescription(multiline)

        const state = useFlowBuilderStore.getState()
        expect(state.flowDescription).toBe(multiline)
      })
    })
  })

  describe('Flow Utilities', () => {
    describe('resetFlow', () => {
      it('should reset to initial state', () => {
        const { nodes, edges } = createSampleFlow()
        useFlowBuilderStore.setState({
          nodes,
          edges,
          flowName: 'Test Flow',
          flowDescription: 'Test Description',
        })

        const { resetFlow } = useFlowBuilderStore.getState()
        resetFlow()

        const state = useFlowBuilderStore.getState()
        // Compare only the data properties, not the functions
        expect(state.nodes).toEqual(INITIAL_FLOW_STATE.nodes)
        expect(state.edges).toEqual(INITIAL_FLOW_STATE.edges)
        expect(state.flowName).toBe(INITIAL_FLOW_STATE.flowName)
        expect(state.flowDescription).toBe(INITIAL_FLOW_STATE.flowDescription)
      })
    })

    describe('loadFlowConfiguration', () => {
      it('should load complete flow configuration', () => {
        const { nodes, edges } = createSampleFlow()
        const { loadFlowConfiguration } = useFlowBuilderStore.getState()

        loadFlowConfiguration(nodes, edges)

        const state = useFlowBuilderStore.getState()
        expect(state.nodes).toEqual(nodes)
        expect(state.edges).toEqual(edges)
      })

      it('should clear previous configuration', () => {
        const { addStageNode } = useFlowBuilderStore.getState()
        addStageNode() // This creates a stage node

        const { nodes, edges } = createSampleFlow()
        const { loadFlowConfiguration } = useFlowBuilderStore.getState()
        loadFlowConfiguration(nodes, edges)

        const state = useFlowBuilderStore.getState()
        expect(state.nodes).toEqual(nodes)
        // Sample flow has 6 nodes, not 3 (the previous state had 3: initial, end, stage)
        expect(state.nodes.length).toBe(nodes.length)
      })
    })

    describe('getStageCount', () => {
      it('should count stage nodes correctly', () => {
        const { nodes, edges } = createSampleFlow()
        useFlowBuilderStore.setState({ nodes, edges })

        const { getStageCount } = useFlowBuilderStore.getState()
        const count = getStageCount()

        expect(count).toBeGreaterThan(0)
        expect(count).toBe(countNodesByType(nodes, 'stage'))
      })

      it('should return 0 when no stage nodes', () => {
        const initialNode = createInitialNode()
        const endNode = createEndNode()
        useFlowBuilderStore.setState({
          nodes: [initialNode, endNode],
          edges: [],
        })

        const { getStageCount } = useFlowBuilderStore.getState()
        expect(getStageCount()).toBe(0)
      })
    })

    describe('getConditionalCount', () => {
      it('should count conditional nodes correctly', () => {
        const { nodes, edges } = createSampleFlow()
        useFlowBuilderStore.setState({ nodes, edges })

        const { getConditionalCount } = useFlowBuilderStore.getState()
        const count = getConditionalCount()

        expect(count).toBe(countNodesByType(nodes, 'conditional'))
      })
    })

    describe('initializeWithOrigin', () => {
      it('should initialize flow with origin data', () => {
        const { initializeWithOrigin } = useFlowBuilderStore.getState()
        initializeWithOrigin('1', 'Web Origin', 500)

        const state = useFlowBuilderStore.getState()
        // Store has 2 nodes: initial + end
        expect(state.nodes).toHaveLength(2)
        const initialNode = state.nodes.find((n) => n.type === 'initial')!
        expect(initialNode).toBeDefined()
        expect(initialNode.data.origen_nombre).toBe('Web Origin')
        expect(initialNode.data.prospectos_count).toBe(500)
      })

      it('should update initial node label with origin name', () => {
        const { initializeWithOrigin } = useFlowBuilderStore.getState()
        initializeWithOrigin('1', 'Web Origin', 500)

        const state = useFlowBuilderStore.getState()
        const initialNode = state.nodes.find((n) => n.type === 'initial')!
        expect(initialNode.data.label).toContain('Web Origin')
      })

      it('should replace previous initialization', () => {
        let state = useFlowBuilderStore.getState()
        state.initializeWithOrigin('1', 'Web', 100)
        state.initializeWithOrigin('2', 'Email', 200)

        state = useFlowBuilderStore.getState()
        // Still has 2 nodes (initial + end)
        expect(state.nodes).toHaveLength(2)
        const initialNode = state.nodes.find((n) => n.type === 'initial')!
        expect(initialNode.data.origen_nombre).toBe('Email')
        expect(initialNode.data.prospectos_count).toBe(200)
      })
    })
  })

  describe('Complex Scenarios', () => {
    it('should handle full flow creation workflow', () => {
      const { initializeWithOrigin, addStageNode, addEdge, setFlowName, setFlowDescription } =
        useFlowBuilderStore.getState()

      initializeWithOrigin('1', 'Web', 100)
      setFlowName('Welcome Series')
      setFlowDescription('Send welcome emails to new prospects')

      // Add stage nodes
      addStageNode()
      addStageNode()

      const state = useFlowBuilderStore.getState()
      const initialNode = state.nodes.find((n) => n.type === 'initial')!
      const stageNodes = state.nodes.filter((n) => n.type === 'stage')

      // Connect initial -> stage1 -> stage2
      addEdge(createEdge(initialNode.id, stageNodes[0].id))
      addEdge(createEdge(stageNodes[0].id, stageNodes[1].id))

      const finalState = useFlowBuilderStore.getState()
      expect(finalState.flowName).toBe('Welcome Series')
      // 2 initial nodes (initial + end) + 2 stage nodes = 4
      expect(finalState.nodes.length).toBe(4)
      expect(finalState.edges.length).toBe(2)
    })

    it('should maintain data integrity with multiple operations', () => {
      const { addStageNode, updateNode, setNodePosition } = useFlowBuilderStore.getState()

      addStageNode()

      const stageNode = useFlowBuilderStore.getState().nodes.find((n) => n.type === 'stage')!

      updateNode(stageNode.id, { dia_envio: 5 })
      setNodePosition(stageNode.id, { x: 150, y: 100 })

      const state = useFlowBuilderStore.getState()
      const updatedNode = state.nodes.find((n) => n.type === 'stage')!

      expect(updatedNode.id).toBe(stageNode.id)
      expect(updatedNode.data.dia_envio).toBe(5)
      expect(updatedNode.position).toEqual({ x: 150, y: 100 })
    })
  })
})
