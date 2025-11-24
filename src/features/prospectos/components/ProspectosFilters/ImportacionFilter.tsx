/**
 * Componente para seleccionar la fuente de importación (REQUERIDO)
 * Filtro obligatorio que debe seleccionarse primero
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDate } from '@/lib/utils'
import type { OpcionesFiltrado } from '../../types/prospectos'

interface ImportacionFilterProps {
  selectedId: number | null
  opciones: OpcionesFiltrado | undefined
  onChange: (id: number | null) => void
}

export function ImportacionFilter({ selectedId, opciones, onChange }: ImportacionFilterProps) {
  console.log('🔍 ImportacionFilter - opciones:', opciones)
  console.log('🔍 ImportacionFilter - opciones.importaciones:', opciones?.importaciones)
  console.log('🔍 ImportacionFilter - total importaciones:', opciones?.importaciones?.length || 0)
  console.log('🔍 ImportacionFilter - selectedId:', selectedId)

  // Convertir selectedId a string solo si existe
  const selectValue = selectedId ? selectedId.toString() : undefined

  return (
    <div className="flex-1">
      <label className="block text-sm font-semibold text-segal-dark mb-2">
        Fuente de Importación <span className="text-segal-red">*</span>
      </label>
      {/* Solo renderizar el Select cuando hay importaciones disponibles */}
      {opciones?.importaciones && opciones.importaciones.length > 0 ? (
        <Select value={selectValue} onValueChange={(value) => onChange(parseInt(value))}>
          <SelectTrigger className="w-full border-segal-blue/30 bg-white focus:border-segal-blue focus:ring-segal-blue/20">
            <SelectValue placeholder="Selecciona una fuente..." />
          </SelectTrigger>
          <SelectContent className="bg-white border border-segal-blue/20 rounded-md shadow-lg">
            {opciones?.importaciones?.map((imp) => {
              console.log('🔍 Renderizando importación:', imp)
              return (
                <SelectItem key={imp.id} value={imp.id.toString()}>
                  <span className="text-sm">
                    {imp.nombre_archivo} - {imp.origen} ({imp.total_prospectos} prospectos) -{' '}
                    {formatDate(imp.fecha_importacion)}
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      ) : (
        <div className="w-full p-3 rounded-lg border border-segal-blue/30 bg-white text-sm text-segal-dark/60">
          Cargando importaciones...
        </div>
      )}
    </div>
  )
}
