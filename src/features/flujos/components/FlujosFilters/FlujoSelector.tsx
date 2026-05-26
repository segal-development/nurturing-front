/**
 * Componente para seleccionar un flujo directamente
 * Muestra lista de todos los flujos disponibles
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import type { FlujoNurturing } from '@/types/flujo'

interface FlujoSelectorProps {
  selectedId: number | null
  flujos: FlujoNurturing[]
  onChange: (id: number | null) => void
  isLoading?: boolean
}

/** Special filter value for showing all flujos */
export const FILTER_ALL_FLUJOS = '_todos'

export function FlujoSelector({ selectedId, flujos, onChange, isLoading }: FlujoSelectorProps) {
  // Sin flujo seleccionado → value vacío para que el Select muestre el placeholder
  // ("Selecciona un flujo..."). Ya no existe la opción "Todos los flujos".
  const selectValue = selectedId ? String(selectedId) : ''

  const handleChange = (value: string) => {
    if (value === FILTER_ALL_FLUJOS) {
      onChange(null)
    } else {
      onChange(Number(value))
    }
  }

  return (
    <div className="flex-1">
      <label className="block text-sm font-semibold text-segal-dark mb-2 dark:text-white">
        Flujo
      </label>
      {isLoading ? (
        <div className="w-full p-3 rounded-lg border border-segal-blue/30 bg-white text-sm text-segal-dark/60 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando flujos...
        </div>
      ) : (
        <Select value={selectValue} onValueChange={handleChange}>
          <SelectTrigger className="w-full border-segal-blue/30 bg-white focus:border-segal-blue focus:ring-segal-blue/20 dark:bg-gray-700 dark:border-gray-600">
            <SelectValue placeholder="Selecciona un flujo..." />
          </SelectTrigger>
          <SelectContent className="bg-white border border-segal-blue/20 rounded-md shadow-lg dark:bg-gray-700 dark:border-gray-600 max-h-[300px]">
            {flujos.map((flujo) => (
              <SelectItem key={flujo.id} value={String(flujo.id)}>
                <span className="text-sm">{flujo.nombre}</span>
              </SelectItem>
            ))}
            {flujos.length === 0 && (
              <div className="px-3 py-2 text-sm text-segal-dark/50">
                No hay flujos disponibles
              </div>
            )}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
