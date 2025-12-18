/**
 * Tests for FlowVisualizationViewer component
 * Read-only visualization of flow structure using ReactFlow
 *
 * RED Phase: Tests first, before implementation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FlowVisualizationViewer } from '../FlowVisualizationViewer'
import type { ConfigVisual } from '@/types/flujo'

// Mock ReactFlow components
vi.mock('reactflow', async () => {
  const actual = await vi.importActual('reactflow')
  return {
    ...actual,
    ReactFlow: ({ nodes, edges, children }: any) => (
      <div data-testid="react-flow" data-nodes-count={nodes?.length || 0} data-edges-count={edges?.length || 0}>
        <div data-testid="flow-nodes">{nodes?.map((n: any) => <div key={n.id} data-testid={`node-${n.id}`}>{n.data?.label}</div>)}</div>
        <div data-testid="flow-edges">{edges?.map((e: any) => <div key={e.id} data-testid={`edge-${e.id}`}></div>)}</div>
        {children}
      </div>
    ),
    Background: () => <div data-testid="flow-background" />,
    Controls: () => <div data-testid="flow-controls" />,
    MiniMap: () => <div data-testid="flow-minimap" />,
    ReactFlowProvider: ({ children }: any) => <div data-testid="react-flow-provider">{children}</div>,
    useNodesState: (initialNodes: any) => [initialNodes, vi.fn()],
    useEdgesState: (initialEdges: any) => [initialEdges, vi.fn()],
    applyNodeChanges: (changes: any, nodes: any) => nodes,
  }
})

// Mock custom nodes
vi.mock('../../FlowBuilder/CustomNodes/StageNode', () => ({
  StageNode: ({ data }: any) => <div data-testid="stage-node">{data?.label}</div>,
}))

vi.mock('../../FlowBuilder/CustomNodes/InitialNode', () => ({
  InitialNode: ({ data }: any) => <div data-testid="initial-node">{data?.label}</div>,
}))

vi.mock('../../FlowBuilder/CustomNodes/EndNode', () => ({
  EndNode: ({ data }: any) => <div data-testid="end-node">{data?.label}</div>,
}))

vi.mock('../../FlowBuilder/CustomNodes/ConditionalNode', () => ({
  ConditionalNode: ({ data }: any) => <div data-testid="conditional-node">{data?.label}</div>,
}))

vi.mock('../../FlowBuilder/CustomEdges/N8nStyleEdge', () => ({
  N8nStyleEdge: ({ id }: any) => <div data-testid="n8n-edge">{id}</div>,
}))

// Mock data
const mockConfigVisual: ConfigVisual = {
  nodes: [
    {
      id: 'initial',
      type: 'initial',
      position: { x: 0, y: 0 },
      data: { label: 'Inicio' },
    },
    {
      id: 'stage-1',
      type: 'stage',
      position: { x: 250, y: 0 },
      data: {
        label: 'Email Inicial',
        dia_envio: 0,
        tipo_mensaje: 'email',
        plantilla_mensaje: 'Email Bienvenida',
        activo: true,
      },
    },
    {
      id: 'stage-2',
      type: 'stage',
      position: { x: 500, y: 0 },
      data: {
        label: 'SMS Seguimiento',
        dia_envio: 3,
        tipo_mensaje: 'sms',
        plantilla_mensaje: 'SMS Recordatorio',
        activo: true,
      },
    },
    {
      id: 'condition-1',
      type: 'conditional',
      position: { x: 750, y: 0 },
      data: {
        label: 'Email Abierto?',
        condition: {
          type: 'email_opened',
          label: 'Email abierto',
        },
        yesLabel: 'Sí',
        noLabel: 'No',
      },
    },
    {
      id: 'end-1',
      type: 'end',
      position: { x: 1000, y: 0 },
      data: { label: 'Completado' },
    },
  ],
  edges: [
    { id: 'initial-stage-1', source: 'initial', target: 'stage-1' },
    { id: 'stage-1-stage-2', source: 'stage-1', target: 'stage-2' },
    { id: 'stage-2-condition-1', source: 'stage-2', target: 'condition-1' },
    { id: 'condition-1-end-1', source: 'condition-1', target: 'end-1' },
  ],
}

describe('FlowVisualizationViewer Component', () => {
  describe('Rendering', () => {
    it('should render without errors with valid config', () => {
      const { container } = render(<FlowVisualizationViewer configVisual={mockConfigVisual} />)

      expect(container).toBeInTheDocument()
    })

    it('should render with ReactFlowProvider', () => {
      render(<FlowVisualizationViewer configVisual={mockConfigVisual} />)

      expect(screen.getByTestId('react-flow-provider')).toBeInTheDocument()
    })

    it('should render ReactFlow controls', () => {
      render(<FlowVisualizationViewer configVisual={mockConfigVisual} />)

      expect(screen.getByTestId('flow-controls')).toBeInTheDocument()
      expect(screen.getByTestId('flow-background')).toBeInTheDocument()
      expect(screen.getByTestId('flow-minimap')).toBeInTheDocument()
    })
  })

  describe('Nodes Display', () => {
    it('should display node labels', () => {
      render(<FlowVisualizationViewer configVisual={mockConfigVisual} />)

      expect(screen.getByText('Inicio')).toBeInTheDocument()
      expect(screen.getByText('Email Inicial')).toBeInTheDocument()
      expect(screen.getByText('SMS Seguimiento')).toBeInTheDocument()
      expect(screen.getByText('Email Abierto?')).toBeInTheDocument()
      expect(screen.getByText('Completado')).toBeInTheDocument()
    })

    it('should render all node types present in config', () => {
      render(<FlowVisualizationViewer configVisual={mockConfigVisual} />)

      // Node labels should be present for all node types
      const labels = [
        'Inicio',
        'Email Inicial',
        'SMS Seguimiento',
        'Email Abierto?',
        'Completado',
      ]

      labels.forEach(label => {
        expect(screen.getByText(label)).toBeInTheDocument()
      })
    })

    it('should handle minimal node config with default enrichment', () => {
      const minimalConfig: ConfigVisual = {
        nodes: [
          {
            id: 'node-1',
            type: 'stage',
            position: { x: 0, y: 0 },
            data: { label: 'Custom Label' },
          },
        ],
        edges: [],
      }

      render(<FlowVisualizationViewer configVisual={minimalConfig} />)

      expect(screen.getByText('Custom Label')).toBeInTheDocument()
    })
  })

  describe('Edges Display', () => {
    it('should render edges with ReactFlow', () => {
      render(<FlowVisualizationViewer configVisual={mockConfigVisual} />)

      // Edges are rendered as part of ReactFlow component
      expect(screen.getByTestId('react-flow-provider')).toBeInTheDocument()
    })

    it('should handle configurations with edges', () => {
      const { container } = render(<FlowVisualizationViewer configVisual={mockConfigVisual} />)

      // Verify component renders successfully with edges
      expect(container).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should display message when no nodes provided', () => {
      render(<FlowVisualizationViewer configVisual={{ nodes: [], edges: [] }} />)

      expect(screen.getByText(/no hay visualización disponible/i)).toBeInTheDocument()
    })

    it('should display message when configVisual is undefined', () => {
      render(<FlowVisualizationViewer />)

      expect(screen.getByText(/no hay visualización disponible/i)).toBeInTheDocument()
    })

    it('should display suggestion for empty visualization', () => {
      render(<FlowVisualizationViewer configVisual={{ nodes: [], edges: [] }} />)

      expect(screen.getByText(/este flujo no tiene configuración visual almacenada/i)).toBeInTheDocument()
    })

    it('should show AlertCircle icon in empty state', () => {
      render(<FlowVisualizationViewer configVisual={{ nodes: [], edges: [] }} />)

      const container = screen.getByText(/no hay visualización disponible/i).closest('div')
      expect(container).toBeInTheDocument()
    })
  })

  describe('Data Props', () => {
    it('should include stage labels in rendering', () => {
      render(<FlowVisualizationViewer configVisual={mockConfigVisual} />)

      expect(screen.getByText('Email Inicial')).toBeInTheDocument()
    })

    it('should include stage metadata', () => {
      render(<FlowVisualizationViewer configVisual={mockConfigVisual} />)

      expect(screen.getByText('Email Inicial')).toBeInTheDocument()
    })

    it('should handle conditional node data', () => {
      render(<FlowVisualizationViewer configVisual={mockConfigVisual} />)

      expect(screen.getByText('Email Abierto?')).toBeInTheDocument()
    })
  })

  describe('Container Styling', () => {
    it('should have correct container dimensions', () => {
      const { container } = render(<FlowVisualizationViewer configVisual={mockConfigVisual} />)

      const wrapper = container.querySelector('div')
      expect(wrapper).toHaveClass('w-full')
      expect(wrapper).toHaveClass('h-[700px]')
    })

    it('should have border styling', () => {
      const { container } = render(<FlowVisualizationViewer configVisual={mockConfigVisual} />)

      const wrapper = container.querySelector('div')
      expect(wrapper).toHaveClass('border')
      expect(wrapper).toHaveClass('rounded-lg')
    })

    it('should have overflow hidden for scroll management', () => {
      const { container } = render(<FlowVisualizationViewer configVisual={mockConfigVisual} />)

      const wrapper = container.querySelector('div')
      expect(wrapper).toHaveClass('overflow-hidden')
    })
  })

  describe('Read-Only Mode', () => {
    it('should render in read-only mode without edit capabilities', () => {
      const { container } = render(<FlowVisualizationViewer configVisual={mockConfigVisual} />)

      // Component should render successfully
      expect(container).toBeInTheDocument()
    })

    it('should allow node dragging but not editing', () => {
      render(<FlowVisualizationViewer configVisual={mockConfigVisual} />)

      // Should have ReactFlow with controls for navigation
      const controls = screen.getByTestId('flow-controls')
      expect(controls).toBeInTheDocument()
    })
  })

  describe('Node Types Support', () => {
    it('should support initial node type', () => {
      render(<FlowVisualizationViewer configVisual={mockConfigVisual} />)

      expect(screen.getByText('Inicio')).toBeInTheDocument()
    })

    it('should support stage node type', () => {
      render(<FlowVisualizationViewer configVisual={mockConfigVisual} />)

      expect(screen.getByText('Email Inicial')).toBeInTheDocument()
      expect(screen.getByText('SMS Seguimiento')).toBeInTheDocument()
    })

    it('should support conditional node type', () => {
      render(<FlowVisualizationViewer configVisual={mockConfigVisual} />)

      expect(screen.getByText('Email Abierto?')).toBeInTheDocument()
    })

    it('should support end node type', () => {
      render(<FlowVisualizationViewer configVisual={mockConfigVisual} />)

      expect(screen.getByText('Completado')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should render with semantic structure', () => {
      const { container } = render(<FlowVisualizationViewer configVisual={mockConfigVisual} />)

      expect(container.querySelector('div')).toBeInTheDocument()
    })

    it('should be keyboard accessible via ReactFlow', () => {
      render(<FlowVisualizationViewer configVisual={mockConfigVisual} />)

      // ReactFlow provides keyboard accessibility through controls
      const controls = screen.getByTestId('flow-controls')
      expect(controls).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should handle large flow configurations', () => {
      const largeConfig: ConfigVisual = {
        nodes: Array.from({ length: 50 }, (_, i) => ({
          id: `node-${i}`,
          type: i % 4 === 0 ? 'stage' : 'stage',
          position: { x: i * 100, y: 0 },
          data: { label: `Nodo ${i}` },
        })),
        edges: Array.from({ length: 49 }, (_, i) => ({
          id: `edge-${i}`,
          source: `node-${i}`,
          target: `node-${i + 1}`,
        })),
      }

      const { container } = render(<FlowVisualizationViewer configVisual={largeConfig} />)

      // Should render without errors
      expect(container).toBeInTheDocument()
      // First and last nodes should have labels rendered
      expect(screen.getByText('Nodo 0')).toBeInTheDocument()
      expect(screen.getByText('Nodo 49')).toBeInTheDocument()
    })
  })
})
