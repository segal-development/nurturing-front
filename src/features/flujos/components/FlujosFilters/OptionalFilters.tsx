/**
 * Componente para filtros opcionales (Tipo de Deudor)
 * Solo se muestra cuando hay un origen seleccionado
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { OpcionesFlujos } from '../../types/flujos'

interface OptionalFiltersProps {
  tipoDeudorValue: string | null
  opciones: OpcionesFlujos | undefined
  onTipoDeudorChange: (value: string | null) => void
}

export function OptionalFilters({
  tipoDeudorValue,
  opciones,
  onTipoDeudorChange,
}: OptionalFiltersProps) {
  // Convertir null a "todos" para Radix UI (acepta undefined)
  const tipoDeudorSelectValue = tipoDeudorValue || 'todos-tipos'

  return (
    <div className="flex gap-4 flex-wrap">
      {/* Filtro: TIPO DE DEUDOR (OPCIONAL) */}
      <div className="flex-1 min-w-[200px]">
        <label className="block text-sm font-semibold text-segal-dark mb-2">Tipo de Deudor</label>
        <Select
          value={tipoDeudorSelectValue}
          onValueChange={(value) => onTipoDeudorChange(value === 'todos-tipos' ? null : value)}
        >
          <SelectTrigger className="w-full border-segal-blue/30 bg-white focus:border-segal-blue focus:ring-segal-blue/20">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-segal-blue/20 rounded-md shadow-lg">
            <SelectItem value="todos-tipos">Todos los tipos</SelectItem>
            {opciones?.tipos_deudor?.map((tipo) => (
              <SelectItem key={tipo.value} value={tipo.value}>
                {tipo.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
