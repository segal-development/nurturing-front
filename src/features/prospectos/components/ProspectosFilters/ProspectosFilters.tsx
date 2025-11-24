/**
 * Container para todos los filtros de prospectos
 * Composición de filtro requerido y filtros opcionales
 */

import { ImportacionFilter } from './ImportacionFilter'
import { OptionalFilters } from './OptionalFilters'
import type { ProspectosFiltersProps, FiltrosState } from '../../types/prospectos'

export function ProspectosFilters({
  filtros,
  opciones,
  onFiltrosChange,
}: Omit<ProspectosFiltersProps, 'isLoading'>) {
  const handleEstadoChange = (value: string | null) => {
    const newFiltros: FiltrosState = {
      ...filtros,
      estado: value,
    }
    onFiltrosChange(newFiltros)
  }

  const handleTipoChange = (value: string | null) => {
    const newFiltros: FiltrosState = {
      ...filtros,
      tipoProspectoId: value ? parseInt(value) : null,
    }
    onFiltrosChange(newFiltros)
  }

  return (
    <div className="flex flex-col gap-4 p-4 rounded-lg bg-segal-blue/5 border border-segal-blue/10">
      {/* Filtro requerido: Importación */}
      <ImportacionFilter
        selectedId={filtros.importacionId}
        opciones={opciones}
        onChange={(id) => {
          const newFiltros: FiltrosState = {
            ...filtros,
            importacionId: id,
          }
          onFiltrosChange(newFiltros)
        }}
      />

      {/* Filtros opcionales (se muestran solo si hay importación seleccionada) */}
      {filtros.importacionId && (
        <OptionalFilters
          estadoValue={filtros.estado}
          tipoValue={filtros.tipoProspectoId?.toString() || null}
          opciones={opciones}
          onEstadoChange={handleEstadoChange}
          onTipoChange={handleTipoChange}
        />
      )}
    </div>
  )
}
