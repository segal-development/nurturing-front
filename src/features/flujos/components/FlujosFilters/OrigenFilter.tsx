/**
 * Componente para seleccionar el origen de flujos (REQUERIDO)
 * Filtro obligatorio que debe seleccionarse primero
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { OpcionesFlujos } from '../../types/flujos'

interface OrigenFilterProps {
  selectedId: string | null
  opciones: OpcionesFlujos | undefined
  onChange: (id: string | null) => void
}

export function OrigenFilter({ selectedId, opciones, onChange }: OrigenFilterProps) {
  console.log('🔍 OrigenFilter - opciones:', opciones)
  console.log('🔍 OrigenFilter - opciones.origenes:', opciones?.origenes)
  console.log('🔍 OrigenFilter - total origenes:', opciones?.origenes?.length || 0)
  console.log('🔍 OrigenFilter - selectedId:', selectedId)

  // Convertir selectedId a string solo si existe, undefined si no
  const selectValue = selectedId || undefined

  return (
    <div className="flex-1">
      <label className="block text-sm font-semibold text-segal-dark mb-2">
        Origen de Flujos <span className="text-segal-red">*</span>
      </label>
      {/* Solo renderizar el Select cuando hay origenes disponibles */}
      {opciones?.origenes && opciones.origenes.length > 0 ? (
        <Select value={selectValue} onValueChange={(value) => onChange(value || null)}>
          <SelectTrigger className="w-full border-segal-blue/30 bg-white focus:border-segal-blue focus:ring-segal-blue/20">
            <SelectValue placeholder="Selecciona un origen..." />
          </SelectTrigger>
          <SelectContent className="bg-white border border-segal-blue/20 rounded-md shadow-lg">
            {opciones.origenes.map((origen) => {
              console.log('🔍 Renderizando origen:', origen)
              return (
                <SelectItem key={origen.id} value={origen.id}>
                  <span className="text-sm">
                    {origen.nombre} ({origen.total_flujos} flujos)
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      ) : (
        <div className="w-full p-3 rounded-lg border border-segal-blue/30 bg-white text-sm text-segal-dark/60">
          Cargando orígenes...
        </div>
      )}
    </div>
  )
}
