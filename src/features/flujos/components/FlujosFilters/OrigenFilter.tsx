/**
 * Componente para seleccionar el origen de flujos (REQUERIDO)
 * Filtro obligatorio que debe seleccionarse primero
 */

import { logger } from '@/lib/logger'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import type { OpcionesFlujos } from '../../types/flujos'

interface OrigenFilterProps {
  selectedId: string | null
  opciones: OpcionesFlujos | undefined
  onChange: (id: string | null) => void
  isLoading?: boolean
}

/** Special filter values for non-origin views */
const FILTER_ALL = '_todos'
const FILTER_NO_ORIGIN = '_sin_origen'

export function OrigenFilter({ selectedId, opciones, onChange, isLoading }: OrigenFilterProps) {
  // Convertir selectedId a string solo si existe, undefined si no
  const selectValue = selectedId || undefined

  return (
    <div className="flex-1">
      <label className="block text-sm font-semibold text-segal-dark mb-2 dark:text-white">
        Origen de Flujos
      </label>
      {/* Solo renderizar el Select cuando hay origenes disponibles */}
      {!isLoading && opciones?.origenes && opciones.origenes.length > 0 ? (
        <Select value={selectValue} onValueChange={(value) => onChange(value || null)}>
          <SelectTrigger className="w-full border-segal-blue/30 bg-white focus:border-segal-blue focus:ring-segal-blue/20 dark:bg-gray-700 dark:border-gray-600 dark:focus:border-segal-blue dark:focus:ring-segal-blue/20">
            <SelectValue placeholder="Selecciona un origen..." />
          </SelectTrigger>
          <SelectContent className="bg-white border border-segal-blue/20 rounded-md shadow-lg dark:bg-gray-700 dark:border-gray-600 dark:focus:border-segal-blue dark:focus:ring-segal-blue/20">
            <SelectItem value={FILTER_ALL}>
              <span className="text-sm font-medium">Todos los flujos</span>
            </SelectItem>
            <SelectItem value={FILTER_NO_ORIGIN}>
              <span className="text-sm text-segal-dark/70">Sin origen asignado</span>
            </SelectItem>
            <div className="my-1 border-t border-segal-blue/10" />
            {opciones.origenes.map((origen) => (
              <SelectItem key={origen.id} value={origen.id}>
                <span className="text-sm">
                  {origen.nombre} ({origen.total_flujos} flujos)
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="w-full p-3 rounded-lg border border-segal-blue/30 bg-white text-sm text-segal-dark/60 flex items-center gap-2">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? 'Cargando orígenes...' : 'No hay orígenes disponibles'}
        </div>
      )}
    </div>
  )
}

export { FILTER_ALL, FILTER_NO_ORIGIN }
