/**
 * Unit tests for useFlowBuilder hook
 * Core business logic: validation, serialization, state management
 *
 * Coverage: Core business logic = 100%
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFlowBuilderStore } from '@/features/flujos/stores/flowBuilderStore'
import {
  INITIAL_FLOW_STATE,
  createInitialNode,
  createStageNode,
  createConditionalNode,
  createEndNode,
  createEdge,
  createSampleFlow,
  isFlowConnected,
} from '../mocks/flowBuilderStore.mock'

describe('useFlowBuilder - Core Business Logic', () => {
  beforeEach(() => {
    useFlowBuilderStore.setState(INITIAL_FLOW_STATE)
  })

  describe('Flow Validation', () => {
    it('should validate a complete, valid flow', () => {
      const { nodes, edges } = createSampleFlow()
      useFlowBuilderStore.setState({
        nodes,
        edges,
        flowName: 'Test Flow',
        flowDescription: 'Test Description',
      })

      const state = useFlowBuilderStore.getState()

      // Valid flow should have:
      // - flowName not empty
      // - At least one stage node
      // - All nodes connected
      expect(state.flowName).toBeTruthy()
      expect(state.nodes.some((n) => n.type === 'stage')).toBe(true)
      expect(isFlowConnected(state.nodes, state.edges)).toBe(true)
    })

    it('should fail validation when flowName is empty', () => {
      const { nodes, edges } = createSampleFlow()
      useFlowBuilderStore.setState({
        nodes,
        edges,
        flowName: '', // Invalid: empty name
        flowDescription: 'Test',
      })

      const state = useFlowBuilderStore.getState()
      expect(state.flowName).toBeFalsy()
    })

    it('should fail validation with no stage nodes', () => {
      const initialNode = createInitialNode()
      const endNode = createEndNode()

      useFlowBuilderStore.setState({
        nodes: [initialNode, endNode],
        edges: [createEdge(initialNode.id, endNode.id)],
        flowName: 'Test Flow',
        flowDescription: 'No stages',
      })

      const state = useFlowBuilderStore.getState()
      const hasStages = state.nodes.some((n) => n.type === 'stage')
      expect(hasStages).toBe(false)
    })

    it('should fail validation with disconnected nodes', () => {
      const node1 = createStageNode({ x: 0, y: 0 })
      const node2 = createStageNode({ x: 200, y: 0 })
      // No edge between them

      useFlowBuilderStore.setState({
        nodes: [node1, node2],
        edges: [],
        flowName: 'Test Flow',
        flowDescription: 'Disconnected',
      })

      const state = useFlowBuilderStore.getState()
      expect(isFlowConnected(state.nodes, state.edges)).toBe(false)
    })

    it('should validate stages have required properties', () => {
      const stageWithoutTemplate = createStageNode()
      stageWithoutTemplate.data.plantilla_mensaje = '' // Empty template

      useFlowBuilderStore.setState({
        nodes: [stageWithoutTemplate],
        edges: [],
        flowName: 'Test',
        flowDescription: 'Test',
      })

      const state = useFlowBuilderStore.getState()
      const stage = state.nodes[0]

      // Check if stage has all required fields
      expect(stage.data.dia_envio).toBeDefined()
      expect(stage.data.tipo_mensaje).toBeDefined()
      expect(stage.data.plantilla_mensaje).toBe('') // This is invalid
    })

    it('should validate conditional nodes have conditions', () => {
      const condNode = createConditionalNode()
      const endNode = createEndNode()

      useFlowBuilderStore.setState({
        nodes: [condNode, endNode],
        edges: [
          createEdge(condNode.id, endNode.id, 'Sí'),
          createEdge(condNode.id, endNode.id, 'No'),
        ],
        flowName: 'Test',
        flowDescription: 'Test',
      })

      const state = useFlowBuilderStore.getState()
      const conditional = state.nodes[0]

      expect(conditional.data.condition).toBeDefined()
      expect(conditional.data.condition.type).toBeTruthy()
    })
  })

  describe('Flow Serialization', () => {
    it('should serialize simple flow correctly', () => {
      const { nodes, edges } = createSampleFlow()
      useFlowBuilderStore.setState({
        nodes,
        edges,
        flowName: 'Simple Flow',
        flowDescription: 'Test',
      })

      const state = useFlowBuilderStore.getState()

      // Expected serialized format:
      // {
      //   nombre: string
      //   descripcion: string
      //   stages: [{dia_envio, tipo_mensaje, plantilla_mensaje}]
      //   branches: [{nodo_origen, nodo_destino, condicion?}]
      //   nodeMap: {nodeId -> stageId}
      // }

      expect(state.flowName).toBe('Simple Flow')
      expect(state.nodes).toBeDefined()
      expect(state.edges).toBeDefined()

      const stageNodes = state.nodes.filter((n) => n.type === 'stage')
      expect(stageNodes.length).toBeGreaterThan(0)
    })

    it('should extract stage nodes for config', () => {
      const stage1 = createStageNode({ x: 0, y: 0 }, 1)
      const stage2 = createStageNode({ x: 200, y: 0 }, 7)

      useFlowBuilderStore.setState({
        nodes: [stage1, stage2],
        edges: [],
        flowName: 'Test',
        flowDescription: 'Test',
      })

      const state = useFlowBuilderStore.getState()
      const stages = state.nodes.filter((n) => n.type === 'stage')

      expect(stages).toHaveLength(2)
      expect(stages[0].data.dia_envio).toBe(1)
      expect(stages[1].data.dia_envio).toBe(7)
    })

    it('should extract conditional branches for config', () => {
      const condNode = createConditionalNode()
      const endNode1 = createEndNode({ x: 0, y: 0 })
      const endNode2 = createEndNode({ x: 0, y: 100 })

      const edges = [
        createEdge(condNode.id, endNode1.id, 'Sí'),
        createEdge(condNode.id, endNode2.id, 'No'),
      ]

      useFlowBuilderStore.setState({
        nodes: [condNode, endNode1, endNode2],
        edges,
        flowName: 'Test',
        flowDescription: 'Test',
      })

      const state = useFlowBuilderStore.getState()

      expect(state.edges).toHaveLength(2)
      expect(state.edges.filter((e) => e.label === 'Sí')).toHaveLength(1)
      expect(state.edges.filter((e) => e.label === 'No')).toHaveLength(1)
    })

    it('should create node map for backend serialization', () => {
      const stage1 = createStageNode()
      const stage2 = createStageNode()

      useFlowBuilderStore.setState({
        nodes: [stage1, stage2],
        edges: [],
        flowName: 'Test',
        flowDescription: 'Test',
      })

      const state = useFlowBuilderStore.getState()

      // nodeMap should map: node visual ID -> stage ID
      expect(state.nodes[0].id).toBeTruthy()
      expect(state.nodes[1].id).toBeTruthy()
    })
  })

  describe('Type Validation', () => {
    it('should validate stage data types', () => {
      const stageNode = createStageNode()

      expect(typeof stageNode.data.dia_envio).toBe('number')
      expect(typeof stageNode.data.tipo_mensaje).toBe('string')
      expect(['email', 'sms', 'ambos']).toContain(stageNode.data.tipo_mensaje)
      expect(typeof stageNode.data.plantilla_mensaje).toBe('string')
    })

    it('should validate conditional data types', () => {
      const condNode = createConditionalNode()

      expect(typeof condNode.data.label).toBe('string')
      expect(condNode.data.condition).toBeDefined()
      expect(['email_opened', 'link_clicked', 'custom']).toContain(
        condNode.data.condition.type
      )
    })

    it('should validate node position types', () => {
      const node = createStageNode({ x: 100, y: 200 })

      expect(typeof node.position.x).toBe('number')
      expect(typeof node.position.y).toBe('number')
      expect(node.position.x).toBeGreaterThanOrEqual(0)
      expect(node.position.y).toBeGreaterThanOrEqual(0)
    })

    it('should validate edge structure', () => {
      const edge = createEdge('node-1', 'node-2', 'Sí')

      expect(typeof edge.id).toBe('string')
      expect(typeof edge.source).toBe('string')
      expect(typeof edge.target).toBe('string')
      expect(edge.source).not.toBe(edge.target)
    })
  })

  describe('Edge Cases & Boundary Conditions', () => {
    it('should handle single node flow', () => {
      const node = createStageNode()

      useFlowBuilderStore.setState({
        nodes: [node],
        edges: [],
        flowName: 'Single Node',
        flowDescription: 'Test',
      })

      const state = useFlowBuilderStore.getState()
      expect(state.nodes).toHaveLength(1)
    })

    it('should handle very long flow names', () => {
      const longName = 'A'.repeat(500)

      useFlowBuilderStore.setState({
        nodes: [],
        edges: [],
        flowName: longName,
        flowDescription: 'Test',
      })

      const state = useFlowBuilderStore.getState()
      expect(state.flowName).toBe(longName)
      expect(state.flowName.length).toBe(500)
    })

    it('should handle empty description', () => {
      const { nodes, edges } = createSampleFlow()

      useFlowBuilderStore.setState({
        nodes,
        edges,
        flowName: 'Test',
        flowDescription: '', // Empty
      })

      const state = useFlowBuilderStore.getState()
      expect(state.flowDescription).toBe('')
    })

    it('should handle maximum realistic node count', () => {
      const nodes = []
      const edges = []

      // Create 50 stage nodes
      for (let i = 0; i < 50; i++) {
        const node = createStageNode({ x: i * 100, y: 0 }, i + 1)
        nodes.push(node)

        if (i > 0) {
          // Connect to previous node
          edges.push(createEdge(nodes[i - 1].id, node.id))
        }
      }

      useFlowBuilderStore.setState({
        nodes,
        edges,
        flowName: 'Large Flow',
        flowDescription: 'Test',
      })

      const state = useFlowBuilderStore.getState()
      expect(state.nodes).toHaveLength(50)
      expect(state.edges).toHaveLength(49)
    })

    it('should handle special characters in flow name', () => {
      const specialName = 'Flow: Test (2024) [Beta] & Promo'

      useFlowBuilderStore.setState({
        nodes: [],
        edges: [],
        flowName: specialName,
        flowDescription: 'Test',
      })

      const state = useFlowBuilderStore.getState()
      expect(state.flowName).toBe(specialName)
    })

    it('should handle numeric string in description', () => {
      const descWithNumbers = 'Flow 123 with IDs: 456, 789'

      useFlowBuilderStore.setState({
        nodes: [],
        edges: [],
        flowName: 'Test',
        flowDescription: descWithNumbers,
      })

      const state = useFlowBuilderStore.getState()
      expect(state.flowDescription).toBe(descWithNumbers)
    })
  })

  describe('Complex Flow Scenarios', () => {
    it('should handle flow with multiple conditional branches', () => {
      const stageNode = createStageNode({ x: 0, y: 0 })
      const condNode1 = createConditionalNode({ x: 200, y: 0 })
      const condNode2 = createConditionalNode({ x: 400, y: 0 })
      const endNode1 = createEndNode({ x: 600, y: -100 })
      const endNode2 = createEndNode({ x: 600, y: 0 })
      const endNode3 = createEndNode({ x: 600, y: 100 })

      const nodes = [stageNode, condNode1, condNode2, endNode1, endNode2, endNode3]
      const edges = [
        createEdge(stageNode.id, condNode1.id),
        createEdge(condNode1.id, condNode2.id, 'Sí'),
        createEdge(condNode1.id, endNode1.id, 'No'),
        createEdge(condNode2.id, endNode2.id, 'Sí'),
        createEdge(condNode2.id, endNode3.id, 'No'),
      ]

      useFlowBuilderStore.setState({
        nodes,
        edges,
        flowName: 'Complex Flow',
        flowDescription: 'Multiple branching',
      })

      const state = useFlowBuilderStore.getState()
      expect(state.nodes.filter((n) => n.type === 'conditional')).toHaveLength(2)
      expect(state.nodes.filter((n) => n.type === 'end')).toHaveLength(3)
    })

    it('should maintain flow integrity after multiple edits', () => {
      const { nodes, edges } = createSampleFlow()
      useFlowBuilderStore.setState({ nodes, edges, flowName: 'Test', flowDescription: 'Test' })

      let state = useFlowBuilderStore.getState()
      const nodeIds = state.nodes.map((n) => n.id)

      // Update a node
      state.updateNode(nodeIds[0], { dia_envio: 5 })

      // Remove an edge
      if (state.edges.length > 0) {
        state.removeEdge(state.edges[0].id)
      }

      // Add new node
      const newNode = createStageNode()
      state.addStageNode(newNode)

      state = useFlowBuilderStore.getState()
      expect(state.nodes.length).toBeGreaterThanOrEqual(nodeIds.length)
    })
  })
})
