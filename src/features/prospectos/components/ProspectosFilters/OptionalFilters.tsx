/**
 * Componente para filtros opcionales (Estado y Tipo de Deuda)
 * Solo se muestra cuando hay una importación seleccionada
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { OpcionesFiltrado } from '../../types/prospectos'

interface OptionalFiltersProps {
  estadoValue: string | null
  tipoValue: string | null
  opciones: OpcionesFiltrado | undefined
  onEstadoChange: (value: string | null) => void
  onTipoChange: (value: string | null) => void
}

export function OptionalFilters({
  estadoValue,
  tipoValue,
  opciones,
  onEstadoChange,
  onTipoChange,
}: OptionalFiltersProps) {
  // Convertir null a "todos" para Radix UI (acepta undefined)
  const estadoSelectValue = estadoValue || 'todos-estados'
  const tipoSelectValue = tipoValue || 'todos-tipos'

  return (
    <div className="flex gap-4 flex-wrap">
      {/* Filtro: ESTADO (OPCIONAL) */}
      <div className="flex-1 min-w-[200px]">
        <label className="block text-sm font-semibold text-segal-dark mb-2">Estado</label>
        <Select value={estadoSelectValue} onValueChange={(value) => onEstadoChange(value === 'todos-estados' ? null : value)}>
          <SelectTrigger className="w-full border-segal-blue/30 bg-white focus:border-segal-blue focus:ring-segal-blue/20">
            <SelectValue placeholder="Todos los estados" />
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

      {/* Filtro: TIPO DE DEUDA (OPCIONAL) */}
      <div className="flex-1 min-w-[200px]">
        <label className="block text-sm font-semibold text-segal-dark mb-2">Tipo de Deuda</label>
        <Select value={tipoSelectValue} onValueChange={(value) => onTipoChange(value === 'todos-tipos' ? null : value)}>
          <SelectTrigger className="w-full border-segal-blue/30 bg-white focus:border-segal-blue focus:ring-segal-blue/20">
            <SelectValue placeholder="Todos los tipos" />
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
    </div>
  )
}
