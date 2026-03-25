/**
 * CohortProspectFilters
 *
 * Filter controls for the cohort prospects drawer.
 * Includes stage dropdown, send status dropdown, and debounced search input.
 *
 * @module CohortProspectFilters
 */

import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ENVIO_ESTADO, type EnvioEstado, type CohortProspectFilters as FilterState } from '@/types/flowExecutionTracking'

// ============================================================================
// Types
// ============================================================================

interface StageOption {
  id: string
  label: string
}

interface CohortProspectFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  stages: StageOption[]
  disabled?: boolean
}

// ============================================================================
// Constants
// ============================================================================

const SEARCH_DEBOUNCE_MS = 300

const ENVIO_ESTADO_OPTIONS = [
  { value: ENVIO_ESTADO.PENDIENTE, label: 'Pendiente' },
  { value: ENVIO_ESTADO.ENVIADO, label: 'Enviado' },
  { value: ENVIO_ESTADO.FALLIDO, label: 'Fallido' },
  { value: ENVIO_ESTADO.ABIERTO, label: 'Abierto' },
  { value: ENVIO_ESTADO.CLICKEADO, label: 'Clickeado' },
] as const

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook for debounced value
 */
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Filter controls for cohort prospects
 *
 * @param filters - Current filter state
 * @param onFiltersChange - Callback when filters change
 * @param stages - Available stage options from flow configuration
 * @param disabled - Whether controls are disabled (e.g., during loading)
 */
export function CohortProspectFilters({
  filters,
  onFiltersChange,
  stages,
  disabled = false,
}: CohortProspectFiltersProps) {
  // Local search state for debouncing
  const [searchInput, setSearchInput] = useState(filters.search ?? '')
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS)

  // Update filters when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({
        ...filters,
        search: debouncedSearch || undefined,
      })
    }
  }, [debouncedSearch, filters, onFiltersChange])

  // Sync local search with external filter changes (only when filters are cleared externally)
  useEffect(() => {
    if (filters.search === undefined && searchInput !== '') {
      setSearchInput('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to external filter clear
  }, [filters.search])

  const handleStageChange = (value: string) => {
    onFiltersChange({
      ...filters,
      node_id: value === 'all' ? undefined : value,
    })
  }

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      envio_estado: value === 'all' ? undefined : (value as EnvioEstado),
    })
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
  }

  const handleClearSearch = () => {
    setSearchInput('')
    onFiltersChange({
      ...filters,
      search: undefined,
    })
  }

  const hasActiveFilters = !!(filters.node_id || filters.envio_estado || filters.search)

  const handleClearAllFilters = () => {
    setSearchInput('')
    onFiltersChange({})
  }

  return (
    <div className="space-y-3 p-4 border-b border-segal-blue/10 bg-segal-blue/5">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-segal-dark/40" />
        <Input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={searchInput}
          onChange={handleSearchChange}
          disabled={disabled}
          className="pl-9 pr-9 bg-white border-segal-blue/20 focus-visible:border-segal-blue"
        />
        {searchInput && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-segal-dark/40 hover:text-segal-dark transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdowns row */}
      <div className="flex items-center gap-3">
        {/* Stage filter */}
        <div className="flex-1">
          <Select
            value={filters.node_id ?? 'all'}
            onValueChange={handleStageChange}
            disabled={disabled}
          >
            <SelectTrigger
              className={cn(
                'bg-white border-segal-blue/20',
                filters.node_id && 'border-segal-blue text-segal-blue',
              )}
            >
              <SelectValue placeholder="Todas las etapas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las etapas</SelectItem>
              {stages.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status filter */}
        <div className="flex-1">
          <Select
            value={filters.envio_estado ?? 'all'}
            onValueChange={handleStatusChange}
            disabled={disabled}
          >
            <SelectTrigger
              className={cn(
                'bg-white border-segal-blue/20',
                filters.envio_estado && 'border-segal-blue text-segal-blue',
              )}
            >
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {ENVIO_ESTADO_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear all button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAllFilters}
            disabled={disabled}
            className="text-segal-dark/60 hover:text-segal-dark hover:bg-segal-blue/10"
          >
            <X className="h-4 w-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>
    </div>
  )
}
