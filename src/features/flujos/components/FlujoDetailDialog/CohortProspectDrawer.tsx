/**
 * CohortProspectDrawer
 *
 * Right-side panel for viewing and filtering prospects within a flow execution cohort.
 * Opens from the CohortCard when clicking the prospect count.
 *
 * Features:
 * - 600px width panel from right side (using Dialog with custom positioning)
 * - Filter controls for stage, send status, and search
 * - Virtualized list for handling large datasets (up to 300k)
 * - Infinite scroll pagination
 * - Keyboard accessible (Escape to close)
 *
 * @module CohortProspectDrawer
 */

import { useState } from 'react'
import { X, Users } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { CohortProspectFilters as FilterState } from '@/types/flowExecutionTracking'
import type { ConfigVisual } from '@/types/flujo'

import { useCohortProspectos } from '../../hooks/useCohortProspectos'
import { useNodeLabelMap } from '../../hooks/useNodeLabelMap'
import { CohortProspectFilters } from './CohortProspectFilters'
import { CohortProspectList } from './CohortProspectList'

// ============================================================================
// Types
// ============================================================================

interface CohorteInfo {
  id: number
  fecha: string
  prospectos_count: number
  estado: string
}

interface CohortProspectDrawerProps {
  isOpen: boolean
  onClose: () => void
  flujoId: number
  ejecucionId: number
  cohorteInfo: CohorteInfo
  configVisual?: ConfigVisual
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Formats cohort date for display in header
 */
function formatCohortDate(fecha: string): string {
  const date = new Date(fecha)
  if (Number.isNaN(date.getTime())) return '---'

  return date.toLocaleDateString('es-CL', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Extracts stage options from configVisual nodes
 */
function extractStageOptions(
  configVisual: ConfigVisual | undefined,
  nodeLabelMap: Map<string, string>,
): Array<{ id: string; label: string }> {
  if (!configVisual?.nodes) return []

  // Filter to stage nodes only (exclude start, end, condition, etc.)
  return configVisual.nodes
    .filter((node) => {
      const type = node.type ?? ''
      // Include email and sms stages
      return (
        type === 'stageNode' ||
        type === 'emailNode' ||
        type === 'smsNode' ||
        node.id.startsWith('stage-')
      )
    })
    .map((node) => ({
      id: node.id,
      label: nodeLabelMap.get(node.id) ?? node.id,
    }))
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Side panel for viewing cohort prospects with filters
 *
 * @param isOpen - Whether the panel is open
 * @param onClose - Callback to close the panel
 * @param flujoId - Flow ID
 * @param ejecucionId - Execution/cohort ID
 * @param cohorteInfo - Basic cohort info for header display
 * @param configVisual - Flow configuration for stage labels
 */
export function CohortProspectDrawer({
  isOpen,
  onClose,
  flujoId,
  ejecucionId,
  cohorteInfo,
  configVisual,
}: CohortProspectDrawerProps) {
  // Filter state
  const [filters, setFilters] = useState<FilterState>({})

  // Get node label map for stage display
  const nodeLabelMap = useNodeLabelMap(configVisual)

  // Extract stage options for filter dropdown
  const stageOptions = extractStageOptions(configVisual, nodeLabelMap)

  // Fetch prospects with filters
  const {
    prospects,
    total,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useCohortProspectos({
    flujoId,
    ejecucionId,
    filters,
    enabled: isOpen,
  })

  const handleClearFilters = () => {
    setFilters({})
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        showCloseButton={false}
        className="!fixed !inset-y-0 !right-0 !left-auto !translate-x-0 !translate-y-0 !top-0 !rounded-none !rounded-l-xl w-full max-w-[600px] h-full flex flex-col p-0 gap-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
      >
        {/* Header */}
        <DialogHeader className="border-b border-segal-blue/10 p-4 shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-segal-blue/10">
                <Users className="h-5 w-5 text-segal-blue" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-segal-dark">
                  Prospectos del Cohorte
                </DialogTitle>
                <DialogDescription className="text-sm text-segal-dark/60 mt-0.5">
                  {formatCohortDate(cohorteInfo.fecha)} &bull;{' '}
                  {cohorteInfo.prospectos_count.toLocaleString()} prospectos
                </DialogDescription>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-segal-dark/60 hover:text-segal-dark"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Cerrar</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Filters */}
        <div className="shrink-0">
          <CohortProspectFilters
            filters={filters}
            onFiltersChange={setFilters}
            stages={stageOptions}
            disabled={isLoading}
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-hidden min-h-0">
          <CohortProspectList
            prospects={prospects}
            total={total}
            isLoading={isLoading}
            isError={isError}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            nodeLabelMap={nodeLabelMap}
            filters={filters}
            onClearFilters={handleClearFilters}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
