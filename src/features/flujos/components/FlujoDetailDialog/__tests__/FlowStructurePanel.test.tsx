/**
 * Tests for FlowStructurePanel component
 * Visualizes flow structure with stages, conditions, branches, and end nodes
 *
 * RED Phase: Tests first, before implementation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FlowStructurePanel } from '../FlowStructurePanel'
import type { EtapaFlujo, CondicionFlujo, RamificacionFlujo, NodoFinalFlujo } from '@/types/flujo'

// Mock FlowVisualizationViewer
vi.mock('../FlowVisualizationViewer', () => ({
  FlowVisualizationViewer: () => <div data-testid="flow-visualization">Flow Visualization</div>,
}))

// Mock the hooks that use TanStack Query
vi.mock('../../../hooks/useFlowExecutionTracking', () => ({
  useActiveExecution: () => ({ data: null, isLoading: false }),
  useLatestExecution: () => ({ data: null, isLoading: false }),
}))

// Mock data
const mockStages: any[] = [
  {
    id: '1',
    flujo_id: 1,
    dia_envio: 0,
    tipo_mensaje: 'email',
    plantilla_mensaje: 'Email Inicial',
    activo: true,
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
  },
  {
    id: '2',
    flujo_id: 1,
    dia_envio: 3,
    tipo_mensaje: 'sms',
    plantilla_mensaje: 'SMS de Seguimiento',
    activo: true,
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
  },
]

const mockConditions: any[] = [
  {
    id: '1',
    flujo_id: 1,
    tipo: 'Abierto',
    descripcion: 'Email fue abierto',
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
  },
]

const mockBranches: RamificacionFlujo[] = [
  {
    id: '1',
    flujo_id: 1,
    condicion_id: '1',
    etapa_si_id: '2',
    etapa_no_id: null,
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
  },
]

const mockEndNodes: NodoFinalFlujo[] = [
  {
    id: '1',
    flujo_id: 1,
    nombre: 'Completado',
    tipo: 'success',
    descripcion: 'Flujo completado exitosamente',
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
  },
]

const mockConfigVisual = {
  nodes: [
    { id: 'initial', type: 'initial', position: { x: 0, y: 0 }, data: { label: 'Inicio' } },
    { id: '1', type: 'stage', position: { x: 250, y: 0 }, data: { label: 'Email Inicial' } },
    { id: '2', type: 'stage', position: { x: 500, y: 0 }, data: { label: 'SMS' } },
    { id: 'end_1', type: 'end', position: { x: 750, y: 0 }, data: { label: 'Completado' } },
  ],
  edges: [
    { id: 'initial-1', source: 'initial', target: '1' },
    { id: '1-2', source: '1', target: '2' },
    { id: '2-end_1', source: '2', target: 'end_1' },
  ],
}

describe('FlowStructurePanel Component', () => {
  describe('View Mode Switching', () => {
    it('should show visual view button when config_visual is available', () => {
      render(
        <FlowStructurePanel
          etapas={mockStages}
          config_visual={mockConfigVisual}
        />,
      )

      expect(screen.getByRole('button', { name: /vista visual/i })).toBeInTheDocument()
    })

    it('should show details view button when etapas are available', () => {
      render(
        <FlowStructurePanel
          etapas={mockStages}
        />,
      )

      expect(screen.getByRole('button', { name: /detalles/i })).toBeInTheDocument()
    })

    it('should default to visual mode when config_visual is available', () => {
      render(
        <FlowStructurePanel
          etapas={mockStages}
          config_visual={mockConfigVisual}
        />,
      )

      expect(screen.getByTestId('flow-visualization')).toBeInTheDocument()
    })

    it('should default to details mode when config_visual is not available', () => {
      render(
        <FlowStructurePanel
          etapas={mockStages}
        />,
      )

      expect(screen.getByText(/Email Inicial/)).toBeInTheDocument()
    })

    it('should switch to visual mode when button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <FlowStructurePanel
          etapas={mockStages}
          config_visual={mockConfigVisual}
        />,
      )

      const visualButton = screen.getByRole('button', { name: /vista visual/i })
      await user.click(visualButton)

      expect(screen.getByTestId('flow-visualization')).toBeInTheDocument()
    })

    it('should switch to details mode when button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <FlowStructurePanel
          etapas={mockStages}
          config_visual={mockConfigVisual}
        />,
      )

      const detailsButton = screen.getByRole('button', { name: /detalles/i })
      await user.click(detailsButton)

      expect(screen.getByText(/Email Inicial/)).toBeInTheDocument()
    })
  })

  describe('Details View - Stages', () => {
    it('should display all stages in details view', () => {
      render(
        <FlowStructurePanel
          etapas={mockStages}
        />,
      )

      expect(screen.getByText(/Email Inicial/)).toBeInTheDocument()
      expect(screen.getByText(/SMS de Seguimiento/)).toBeInTheDocument()
    })

    it('should show stage types (email/sms)', () => {
      render(
        <FlowStructurePanel
          etapas={mockStages}
        />,
      )

      // Look for emoji indicators and text
      expect(screen.getByText(/Día 0 - 📧 Email/)).toBeInTheDocument()
      expect(screen.getByText(/Día 3 - 📱 SMS/)).toBeInTheDocument()
    })

    it('should display stages in order', () => {
      render(
        <FlowStructurePanel
          etapas={mockStages}
        />,
      )

      const emails = screen.getAllByText(/Email/)
      expect(emails.length).toBeGreaterThan(0)
    })
  })

  describe('Details View - Conditions', () => {
    it('should display conditions in details view', () => {
      render(
        <FlowStructurePanel
          etapas={mockStages}
          condiciones={mockConditions}
        />,
      )

      expect(screen.getByText(/Abierto/)).toBeInTheDocument()
    })

    it('should show condition descriptions', () => {
      render(
        <FlowStructurePanel
          etapas={mockStages}
          condiciones={mockConditions}
        />,
      )

      expect(screen.getByText(/Email fue abierto/i)).toBeInTheDocument()
    })

    it('should display condition type', () => {
      render(
        <FlowStructurePanel
          etapas={mockStages}
          condiciones={mockConditions}
        />,
      )

      expect(screen.getByText(/Abierto/)).toBeInTheDocument()
    })
  })

  describe('Details View - Branches', () => {
    it('should display branches in details view', () => {
      render(
        <FlowStructurePanel
          etapas={mockStages}
          condiciones={mockConditions}
          ramificaciones={mockBranches}
        />,
      )

      expect(screen.getByText(/Ramificaciones/)).toBeInTheDocument()
    })

    it('should show branch conditions', () => {
      render(
        <FlowStructurePanel
          etapas={mockStages}
          condiciones={mockConditions}
          ramificaciones={mockBranches}
        />,
      )

      expect(screen.getByText(/Ramificaciones/)).toBeInTheDocument()
    })
  })

  describe('Details View - End Nodes', () => {
    it('should display end nodes in details view', () => {
      render(
        <FlowStructurePanel
          etapas={mockStages}
          nodos_finales={mockEndNodes}
        />,
      )

      expect(screen.getByText(/completado/i)).toBeInTheDocument()
    })

    it('should show end node descriptions', () => {
      render(
        <FlowStructurePanel
          etapas={mockStages}
          nodos_finales={mockEndNodes}
        />,
      )

      expect(screen.getByText(/flujo completado exitosamente/i)).toBeInTheDocument()
    })

    it('should show end node types', () => {
      render(
        <FlowStructurePanel
          etapas={mockStages}
          nodos_finales={mockEndNodes}
        />,
      )

      const typeElements = screen.getAllByText(/success|completado/i)
      expect(typeElements.length).toBeGreaterThan(0)
    })
  })

  describe('Empty State', () => {
    it('should display empty message when no data is provided', () => {
      render(<FlowStructurePanel />)

      expect(screen.getByText(/no hay etapas configuradas/i)).toBeInTheDocument()
    })

    it('should show details when visual is empty but stages are provided', () => {
      render(
        <FlowStructurePanel
          etapas={mockStages}
          config_visual={{ nodes: [], edges: [] }}
        />,
      )

      expect(screen.getByText(/Email Inicial/)).toBeInTheDocument()
    })
  })

  describe('Config Structure Priority', () => {
    const mockConfigStructure = {
      stages: mockStages,
      conditions: mockConditions,
      branches: mockBranches,
      end_nodes: mockEndNodes,
    }

    it('should use config_structure when available', () => {
      render(
        <FlowStructurePanel
          etapas={[]}
          condiciones={[]}
          config_structure={mockConfigStructure}
        />,
      )

      expect(screen.getByText(/Email Inicial/)).toBeInTheDocument()
    })

    it('should fallback to individual props when config_structure is not available', () => {
      render(
        <FlowStructurePanel
          etapas={mockStages}
          condiciones={mockConditions}
        />,
      )

      expect(screen.getByText(/Email Inicial/)).toBeInTheDocument()
      expect(screen.getByText(/Abierto/)).toBeInTheDocument()
    })
  })

  describe('Visual Mode - ReactFlow', () => {
    it('should render FlowVisualizationViewer when visual mode is active', () => {
      render(
        <FlowStructurePanel
          etapas={mockStages}
          config_visual={mockConfigVisual}
        />,
      )

      expect(screen.getByTestId('flow-visualization')).toBeInTheDocument()
    })

    it('should pass configVisual prop to FlowVisualizationViewer', () => {
      render(
        <FlowStructurePanel
          etapas={mockStages}
          config_visual={mockConfigVisual}
        />,
      )

      expect(screen.getByTestId('flow-visualization')).toBeInTheDocument()
    })
  })

  describe('Button States', () => {
    it('should highlight active view button', async () => {
      const user = userEvent.setup()
      render(
        <FlowStructurePanel
          etapas={mockStages}
          config_visual={mockConfigVisual}
        />,
      )

      const visualButton = screen.getByRole('button', { name: /vista visual/i })
      expect(visualButton).toHaveClass('bg-segal-blue')

      const detailsButton = screen.getByRole('button', { name: /detalles/i })
      await user.click(detailsButton)

      expect(detailsButton).toHaveClass('bg-segal-blue')
    })
  })

  describe('Dark Mode Support', () => {
    it('should render without errors in dark mode', () => {
      const { container } = render(
        <div className="dark">
          <FlowStructurePanel
            etapas={mockStages}
          />
        </div>,
      )

      expect(container).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper button labels', () => {
      render(
        <FlowStructurePanel
          etapas={mockStages}
          config_visual={mockConfigVisual}
        />,
      )

      expect(screen.getByRole('button', { name: /vista visual/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /detalles/i })).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(
        <FlowStructurePanel
          etapas={mockStages}
          config_visual={mockConfigVisual}
        />,
      )

      const visualButton = screen.getByRole('button', { name: /vista visual/i })
      visualButton.focus()
      expect(visualButton).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(screen.getByTestId('flow-visualization')).toBeInTheDocument()
    })
  })
})
