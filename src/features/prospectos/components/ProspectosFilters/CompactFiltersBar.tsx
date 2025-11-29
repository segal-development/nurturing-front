/**
 * Barra compacta de filtros y búsqueda
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles filter UI and state binding
 * - Composition: Uses small, focused sub-components
 * - Dependency Injection: Receives all data and callbacks via props
 */

import { Search } from 'lucide-react'
import { useCallback } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import type { OpcionesFiltrado, FiltrosState } from '../../types/prospectos'

/**
 * Props para CompactFiltersBar
 */
interface CompactFiltersBarProps {
  filtros: FiltrosState
  opciones: OpcionesFiltrado | undefined
  searchValue: string
  onFiltrosChange: (filtros: FiltrosState) => void
  onSearchChange: (value: string) => void
  isSearchDisabled?: boolean
}

/**
 * Crea un nuevo estado de filtros con una propiedad actualizada
 */
const createUpdatedFilters = (
  currentFilters: FiltrosState,
  updates: Partial<FiltrosState>
): FiltrosState => ({
  ...currentFilters,
  ...updates,
})

/**
 * Convierte un ID de tipo a número, retornando null si no es válido
 */
const parseTypeIdSafely = (value: string | null): number | null => {
  if (!value || value === 'todos-tipos') return null
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? null : parsed
}

/**
 * Obtiene el valor mostrado en el select (convierte a string o undefined)
 */
const getSelectDisplayValue = (value: number | null | undefined): string | undefined => {
  return value ? value.toString() : undefined
}

export function CompactFiltersBar({
  filtros,
  opciones,
  searchValue,
  onFiltrosChange,
  onSearchChange,
  isSearchDisabled = false,
}: CompactFiltersBarProps) {
  // ============================================================
  // MANEJADORES DE FILTROS CON EARLY RETURNS
  // ============================================================
  const handleImportacionChange = useCallback(
    (value: string) => {
      const parsedId = parseInt(value, 10)
      if (isNaN(parsedId)) return

      const updatedFilters = createUpdatedFilters(filtros, { importacionId: parsedId })
      onFiltrosChange(updatedFilters)
    },
    [filtros, onFiltrosChange]
  )

  const handleEstadoChange = useCallback(
    (value: string | null) => {
      if (!value) return

      const estadoValue = value === 'todos-estados' ? null : value
      const updatedFilters = createUpdatedFilters(filtros, { estado: estadoValue })
      onFiltrosChange(updatedFilters)
    },
    [filtros, onFiltrosChange]
  )

  const handleTipoChange = useCallback(
    (value: string | null) => {
      if (!value) return

      const tipoValue = parseTypeIdSafely(value)
      const updatedFilters = createUpdatedFilters(filtros, { tipoProspectoId: tipoValue })
      onFiltrosChange(updatedFilters)
    },
    [filtros, onFiltrosChange]
  )

  // ============================================================
  // VALORES MOSTRADOS EN SELECTS
  // ============================================================
  const selectValueImportacion = getSelectDisplayValue(filtros.importacionId)
  const selectValueEstado = filtros.estado || 'todos-estados'
  const selectValueTipo = getSelectDisplayValue(filtros.tipoProspectoId) || 'todos-tipos'

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg bg-segal-blue/5 border border-segal-blue/10">
      {/* Primera fila: Importación + Estado */}
      <div className="flex gap-3">
        <div className="flex-1 flex flex-col">
          <label className="block text-xs font-semibold text-segal-dark mb-1.5 uppercase tracking-tight">
            Importación <span className="text-segal-red">*</span>
          </label>
          {opciones?.importaciones && opciones.importaciones.length > 0 ? (
            <Select value={selectValueImportacion} onValueChange={handleImportacionChange}>
              <SelectTrigger className="h-9 w-full text-sm border-segal-blue/30 bg-white focus:border-segal-blue focus:ring-segal-blue/20 truncate">
                <SelectValue placeholder="Selecciona una fuente..." className="truncate" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-segal-blue/20 rounded-md shadow-lg">
                {opciones?.importaciones?.map((imp) => (
                  <SelectItem key={imp.id} value={imp.id.toString()}>
                    <span className="text-xs truncate">
                      {imp.nombre_archivo} - {imp.origen} ({imp.total_prospectos})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="h-9 px-3 rounded-lg border border-segal-blue/30 bg-white text-xs text-segal-dark/60 flex items-center">
              Cargando...
            </div>
          )}
        </div>

        {/* Filtro Estado */}
        {filtros.importacionId && (
          <div className="flex-1 flex flex-col">
            <label className="block text-xs font-semibold text-segal-dark mb-1.5 uppercase tracking-tight">
              Estado
            </label>
            <Select value={selectValueEstado} onValueChange={(value) => handleEstadoChange(value === 'todos-estados' ? null : value)}>
              <SelectTrigger className="h-9 w-full text-sm border-segal-blue/30 bg-white focus:border-segal-blue focus:ring-segal-blue/20">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-segal-blue/20 rounded-md shadow-lg">
                <SelectItem value="todos-estados">Todos los estados</SelectItem>
                {opciones?.estados?.map((estado) => (
                  <SelectItem key={estado.value} value={estado.value}>
                    {estado.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Segunda fila: Tipo + Búsqueda (solo si hay importación seleccionada) */}
      {filtros.importacionId && (
        <div className="flex gap-3">
          {/* Filtro Tipo de Deuda */}
          <div className="flex-1 flex flex-col">
            <label className="block text-xs font-semibold text-segal-dark mb-1.5 uppercase tracking-tight">
              Tipo de Deuda
            </label>
            <Select value={selectValueTipo} onValueChange={(value) => handleTipoChange(value === 'todos-tipos' ? null : value)}>
              <SelectTrigger className="h-9 w-full text-sm border-segal-blue/30 bg-white focus:border-segal-blue focus:ring-segal-blue/20">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-segal-blue/20 rounded-md shadow-lg">
                <SelectItem value="todos-tipos">Todos los tipos</SelectItem>
                {opciones?.tipos_prospecto?.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.id.toString()}>
                    {tipo.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Búsqueda */}
          <div className="flex-1 flex flex-col">
            <label className="block text-xs font-semibold text-segal-dark mb-1.5 uppercase tracking-tight">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-segal-dark/40" />
              <Input
                placeholder="Nombre, email o teléfono..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                disabled={isSearchDisabled}
                className="h-9 w-full pl-9 text-sm border-segal-blue/20 focus:border-segal-blue focus:ring-segal-blue/20 bg-white disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
