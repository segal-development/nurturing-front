/**
 * CohortProspectList
 *
 * Virtualized list component for displaying cohort prospects.
 * Uses @tanstack/react-virtual for efficient rendering of large datasets (up to 300k).
 *
 * Features:
 * - Virtual scrolling (only renders visible rows)
 * - Infinite scroll pagination
 * - Loading skeleton state
 * - Empty state with filter awareness
 *
 * @module CohortProspectList
 */

import { useRef, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Loader2, Search, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { CohortProspecto, CohortProspectFilters } from '@/types/flowExecutionTracking'

import { CohortProspectRow } from './CohortProspectRow'

// ============================================================================
// Types
// ============================================================================

interface CohortProspectListProps {
  prospects: CohortProspecto[]
  total: number
  isLoading: boolean
  isError: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  fetchNextPage: () => void
  nodeLabelMap: Map<string, string>
  filters: CohortProspectFilters
  onClearFilters: () => void
}

// ============================================================================
// Constants
// ============================================================================

const ROW_HEIGHT = 72 // px - consistent with CohortProspectRow
const OVERSCAN = 5 // Extra rows to render above/below viewport

// ============================================================================
// Sub-Components
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 10 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 p-3 rounded-lg bg-segal-blue/5 animate-pulse"
        >
          {/* Avatar skeleton */}
          <div className="w-10 h-10 rounded-full bg-segal-blue/20" />

          {/* Content skeleton */}
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 bg-segal-blue/20 rounded" />
            <div className="h-3 w-1/2 bg-segal-blue/10 rounded" />
          </div>

          {/* Pills skeleton */}
          <div className="flex gap-1">
            <div className="h-5 w-12 bg-segal-blue/10 rounded-full" />
            <div className="h-5 w-12 bg-segal-blue/10 rounded-full" />
          </div>

          {/* Last send skeleton */}
          <div className="w-24 space-y-1">
            <div className="h-5 w-16 bg-segal-blue/10 rounded-full ml-auto" />
            <div className="h-3 w-20 bg-segal-blue/10 rounded ml-auto" />
          </div>
        </div>
      ))}
    </div>
  )
}

interface EmptyStateProps {
  hasFilters: boolean
  onClearFilters: () => void
}

function EmptyState({ hasFilters, onClearFilters }: EmptyStateProps) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Search className="h-12 w-12 text-segal-blue/40 mb-3" />
        <p className="text-segal-dark/60 font-medium">
          No se encontraron prospectos
        </p>
        <p className="text-sm text-segal-dark/40 mt-1">
          Probá ajustando los filtros o la búsqueda
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearFilters}
          className="mt-4 border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5"
        >
          Limpiar filtros
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <Users className="h-12 w-12 text-segal-blue/40 mb-3" />
      <p className="text-segal-dark/60 font-medium">
        No hay prospectos en esta cohorte
      </p>
      <p className="text-sm text-segal-dark/40 mt-1">
        Esta ejecución no tiene prospectos asignados
      </p>
    </div>
  )
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
        <span className="text-2xl">!</span>
      </div>
      <p className="text-segal-dark/60 font-medium">Error de conexión</p>
      <p className="text-sm text-segal-dark/40 mt-1">
        No se pudieron cargar los prospectos
      </p>
    </div>
  )
}

function LoadingMoreIndicator() {
  return (
    <div className="flex items-center justify-center p-4 gap-2 text-segal-dark/60">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm">Cargando más prospectos...</span>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Virtualized list of cohort prospects with infinite scroll
 *
 * @param prospects - Array of prospects to display
 * @param total - Total count of prospects (for display)
 * @param isLoading - Whether initial load is in progress
 * @param isError - Whether there was an error loading
 * @param isFetchingNextPage - Whether next page is loading
 * @param hasNextPage - Whether more pages are available
 * @param fetchNextPage - Function to load next page
 * @param nodeLabelMap - Map of node IDs to human-readable labels
 * @param filters - Current filter state (for empty state logic)
 * @param onClearFilters - Callback to clear all filters
 */
export function CohortProspectList({
  prospects,
  total,
  isLoading,
  isError,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  nodeLabelMap,
  filters,
  onClearFilters,
}: CohortProspectListProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  // Determine if any filters are active
  const hasFilters = !!(filters.node_id || filters.envio_estado || filters.search)

  // Setup virtualizer
  const virtualizer = useVirtualizer({
    count: prospects.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  })

  const virtualItems = virtualizer.getVirtualItems()

  // Infinite scroll: fetch next page when scrolling near bottom
  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1]
    if (!lastItem) return

    // If we're near the end and have more pages, fetch next
    if (
      lastItem.index >= prospects.length - 5 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage()
    }
  }, [virtualItems, prospects.length, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton />
  }

  // Error state
  if (isError) {
    return <ErrorState />
  }

  // Empty state
  if (prospects.length === 0) {
    return <EmptyState hasFilters={hasFilters} onClearFilters={onClearFilters} />
  }

  return (
    <div className="flex flex-col h-full">
      {/* Results count */}
      <div className="px-4 py-2 bg-segal-blue/5 border-b border-segal-blue/10 text-sm text-segal-dark/70">
        Mostrando <strong>{prospects.length.toLocaleString()}</strong> de{' '}
        <strong>{total.toLocaleString()}</strong> prospectos
      </div>

      {/* Virtualized list */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto"
        style={{ contain: 'strict' }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => {
            const prospect = prospects[virtualItem.index]
            if (!prospect) return null

            const nodeLabel =
              nodeLabelMap.get(prospect.ultima_etapa_node_id ?? '') ??
              prospect.ultima_etapa_node_id ??
              'Sin etapa'

            return (
              <div
                key={prospect.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <CohortProspectRow
                  prospect={prospect}
                  nodeLabel={nodeLabel}
                />
              </div>
            )
          })}
        </div>

        {/* Loading more indicator */}
        {isFetchingNextPage && <LoadingMoreIndicator />}
      </div>
    </div>
  )
}
