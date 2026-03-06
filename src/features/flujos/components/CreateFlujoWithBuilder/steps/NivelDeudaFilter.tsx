/**
 * Filter component for nivel_deuda metadata field
 * Allows user to filter prospectos by debt level when creating a flujo
 */

import { Loader2, Filter, AlertCircle } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { useMetadataValues, NIVEL_DEUDA_LABELS, NIVEL_DEUDA_COLORS } from '@/hooks/useMetadataValues'

interface NivelDeudaFilterProps {
  /** Selected lote IDs to filter metadata values */
  loteIds: number[]
  /** Currently selected nivel_deuda values */
  selectedValues: Set<string>
  /** Callback when selection changes */
  onSelectionChange: (values: Set<string>) => void
  /** Whether to show the filter (hidden if no metadata available) */
  className?: string
}

export function NivelDeudaFilter({
  loteIds,
  selectedValues,
  onSelectionChange,
  className = '',
}: NivelDeudaFilterProps) {
  const { data, isLoading, error } = useMetadataValues(
    'nivel_deuda',
    loteIds.length > 0 ? loteIds : undefined,
    loteIds.length > 0
  )

  const valores = data?.valores ?? []

  // Don't show filter if no metadata values available
  if (!isLoading && valores.length === 0) {
    return null
  }

  const handleToggleValue = (valor: string) => {
    const newSelection = new Set(selectedValues)
    if (newSelection.has(valor)) {
      newSelection.delete(valor)
    } else {
      newSelection.add(valor)
    }
    onSelectionChange(newSelection)
  }

  const handleSelectAll = () => {
    if (selectedValues.size === valores.length) {
      // Deselect all
      onSelectionChange(new Set())
    } else {
      // Select all
      onSelectionChange(new Set(valores.map((v) => v.valor)))
    }
  }

  // Calculate total selected prospectos
  const totalSelected = valores
    .filter((v) => selectedValues.has(v.valor))
    .reduce((acc, v) => acc + v.total, 0)

  if (isLoading) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Cargando filtros de deuda...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-red-50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Error al cargar filtros</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white border border-segal-blue/20 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-segal-blue" />
          <span className="font-medium text-segal-dark">Filtrar por nivel de deuda</span>
        </div>
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-xs text-segal-blue hover:underline"
        >
          {selectedValues.size === valores.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
        </button>
      </div>

      {/* Filter options */}
      <div className="space-y-2">
        {valores.map((item) => {
          const isSelected = selectedValues.has(item.valor)
          const label = NIVEL_DEUDA_LABELS[item.valor] || item.valor
          const colorClass = NIVEL_DEUDA_COLORS[item.valor] || 'bg-gray-100 text-gray-600'

          return (
            <label
              key={item.valor}
              className={`
                flex items-center justify-between p-3 rounded-lg border cursor-pointer
                transition-all duration-150
                ${isSelected ? 'border-segal-blue bg-segal-blue/5' : 'border-gray-200 hover:border-segal-blue/40'}
              `}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => handleToggleValue(item.valor)}
                  className="border-segal-blue data-[state=checked]:bg-segal-blue"
                />
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${colorClass}`}>
                  {label}
                </span>
              </div>
              <span className="text-sm font-semibold text-segal-dark">
                {item.total.toLocaleString('es-CL')} prospectos
              </span>
            </label>
          )
        })}
      </div>

      {/* Summary */}
      {selectedValues.size > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-segal-dark/60">
              {selectedValues.size} de {valores.length} niveles seleccionados
            </span>
            <span className="font-semibold text-segal-blue">
              {totalSelected.toLocaleString('es-CL')} prospectos
            </span>
          </div>
        </div>
      )}

      {/* Help text */}
      {selectedValues.size === 0 && (
        <p className="mt-3 text-xs text-segal-dark/50">
          Selecciona uno o más niveles para filtrar los prospectos. Si no seleccionas ninguno, se
          incluirán todos.
        </p>
      )}
    </div>
  )
}
