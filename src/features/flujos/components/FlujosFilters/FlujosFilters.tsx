/**
 * Container para todos los filtros de flujos
 * Selector de flujo + filtros opcionales
 */

import { FlujoSelector } from './FlujoSelector'
import type { FlujoNurturing } from '@/types/flujo'

interface FiltrosState {
  flujoId: number | null
}

interface FlujosFiltersProps {
  filtros: FiltrosState
  flujos: FlujoNurturing[]
  onFiltrosChange: (filtros: FiltrosState) => void
  isLoading?: boolean
}

export function FlujosFilters({
  filtros,
  flujos,
  onFiltrosChange,
  isLoading,
}: FlujosFiltersProps) {
  const handleFlujoChange = (id: number | null) => {
    onFiltrosChange({ flujoId: id })
  }

  return (
    <div className="p-4 rounded-lg bg-segal-blue/5 border border-segal-blue/10">
      <div className="flex flex-col md:flex-row gap-4">
        <FlujoSelector
          selectedId={filtros.flujoId}
          flujos={flujos}
          onChange={handleFlujoChange}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
