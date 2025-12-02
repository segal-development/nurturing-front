/**
 * Container para todos los filtros de flujos
 * Composición de filtro requerido y filtros opcionales
 */

import { OrigenFilter } from './OrigenFilter'
import { OptionalFilters } from './OptionalFilters'
import type { FlujosFiltersProps, FiltrosState } from '../../types/flujos'

interface FlujosFiltersExtendedProps extends FlujosFiltersProps {
  isLoadingOpciones?: boolean
}

export function FlujosFilters({
  filtros,
  opciones,
  onFiltrosChange,
  isLoadingOpciones,
}: FlujosFiltersExtendedProps) {
  const handleOrigenChange = (id: string | null) => {
    const newFiltros: FiltrosState = {
      ...filtros,
      origenId: id,
    }
    onFiltrosChange(newFiltros)
  }

  const handleTipoDeudorChange = (value: string | null) => {
    const newFiltros: FiltrosState = {
      ...filtros,
      tipoDeudor: value,
    }
    onFiltrosChange(newFiltros)
  }

  return (
    <div className="p-4 rounded-lg bg-segal-blue/5 border border-segal-blue/10">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Filtro requerido: Origen */}
        <div className="flex-1">
          <OrigenFilter
            selectedId={filtros.origenId}
            opciones={opciones}
            onChange={handleOrigenChange}
            isLoading={isLoadingOpciones}
          />
        </div>

        {/* Filtros opcionales (se muestran solo si hay origen seleccionado) */}
        {filtros.origenId && (
          <div className="flex-1">
            <OptionalFilters
              tipoDeudorValue={filtros.tipoDeudor}
              opciones={opciones}
              onTipoDeudorChange={handleTipoDeudorChange}
            />
          </div>
        )}
      </div>
    </div>
  )
}
