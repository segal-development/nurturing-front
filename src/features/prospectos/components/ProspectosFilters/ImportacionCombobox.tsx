/**
 * Combobox para seleccionar la fuente de importación con búsqueda
 * Agrupa las importaciones por origen y permite búsqueda rápida
 */

import { useState } from 'react'
import { Check, ChevronsUpDown, FileSpreadsheet, Globe, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatDate } from '@/lib/utils'
import type { OpcionesFiltrado, Importacion } from '../../types/prospectos'

interface ImportacionComboboxProps {
  selectedId: number | null
  opciones: OpcionesFiltrado | undefined
  onChange: (id: number | null) => void
}

// Agrupar importaciones por origen
interface ImportacionGroup {
  label: string
  icon: typeof FileSpreadsheet
  importaciones: Importacion[]
}

function groupImportaciones(importaciones: Importacion[] | undefined): ImportacionGroup[] {
  if (!importaciones || importaciones.length === 0) return []

  const groups: Record<string, Importacion[]> = {}

  for (const imp of importaciones) {
    const origen = imp.origen || 'Otros'
    if (!groups[origen]) {
      groups[origen] = []
    }
    groups[origen].push(imp)
  }

  // Ordenar cada grupo por fecha descendente (más recientes primero)
  for (const key of Object.keys(groups)) {
    groups[key].sort(
      (a, b) =>
        new Date(b.fecha_importacion).getTime() - new Date(a.fecha_importacion).getTime()
    )
  }

  // Mapear a grupos con iconos
  const getIcon = (origen: string) => {
    if (origen.toLowerCase().includes('sysgal')) return Users
    if (origen.toLowerCase().includes('informes')) return Globe
    return FileSpreadsheet
  }

  // Ordenar grupos: primero los de API, luego Excel
  const orderedKeys = Object.keys(groups).sort((a, b) => {
    const isApiA = a.toLowerCase().includes('sysgal') || a.toLowerCase().includes('informes')
    const isApiB = b.toLowerCase().includes('sysgal') || b.toLowerCase().includes('informes')
    if (isApiA && !isApiB) return 1
    if (!isApiA && isApiB) return -1
    return a.localeCompare(b)
  })

  return orderedKeys.map((origen) => ({
    label: origen,
    icon: getIcon(origen),
    importaciones: groups[origen],
  }))
}

export function ImportacionCombobox({
  selectedId,
  opciones,
  onChange,
}: ImportacionComboboxProps) {
  const [open, setOpen] = useState(false)

  const groups = groupImportaciones(opciones?.importaciones)
  const allImportaciones = opciones?.importaciones || []

  // Encontrar la importación seleccionada
  const selectedImportacion = allImportaciones.find((imp) => imp.id === selectedId)

  return (
    <div className="flex-1">
      <label className="block text-sm font-semibold text-segal-dark mb-2">
        Fuente de Importación <span className="text-segal-red">*</span>
      </label>

      {allImportaciones.length > 0 ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between border-segal-blue/30 bg-white hover:bg-slate-50 focus:border-segal-blue focus:ring-segal-blue/20 h-auto min-h-10 py-2"
            >
              {selectedImportacion ? (
                <span className="text-sm text-left truncate pr-2">
                  <span className="font-medium">{selectedImportacion.nombre_archivo}</span>
                  <span className="text-slate-500 ml-2">
                    ({selectedImportacion.total_prospectos.toLocaleString('es-CL')} prospectos)
                  </span>
                </span>
              ) : (
                <span className="text-slate-500">Buscar o seleccionar carga...</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[500px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar por nombre, origen o fecha..." />
              <CommandList className="max-h-[400px]">
                <CommandEmpty>No se encontraron cargas.</CommandEmpty>

                {groups.map((group, index) => (
                  <div key={group.label}>
                    {index > 0 && <CommandSeparator />}
                    <CommandGroup
                      heading={
                        <div className="flex items-center gap-2">
                          <group.icon className="h-4 w-4" />
                          <span>{group.label}</span>
                          <span className="text-slate-400">
                            ({group.importaciones.length})
                          </span>
                        </div>
                      }
                    >
                      {group.importaciones.map((imp) => (
                        <CommandItem
                          key={imp.id}
                          value={`${imp.nombre_archivo} ${imp.origen} ${formatDate(imp.fecha_importacion)}`}
                          onSelect={() => {
                            onChange(imp.id)
                            setOpen(false)
                          }}
                          className="flex items-center gap-2 py-2"
                        >
                          <Check
                            className={cn(
                              'h-4 w-4 shrink-0',
                              selectedId === imp.id ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-medium text-sm truncate">
                              {imp.nombre_archivo}
                            </span>
                            <span className="text-xs text-slate-500">
                              {imp.total_prospectos.toLocaleString('es-CL')} prospectos
                              {' • '}
                              {formatDate(imp.fecha_importacion)}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </div>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      ) : (
        <div className="w-full p-3 rounded-lg border border-segal-blue/30 bg-white text-sm text-segal-dark/60">
          Cargando importaciones...
        </div>
      )}

      {/* Info de la selección actual */}
      {selectedImportacion && (
        <p className="mt-1.5 text-xs text-slate-500">
          Origen: {selectedImportacion.origen} • Fecha:{' '}
          {formatDate(selectedImportacion.fecha_importacion)}
        </p>
      )}
    </div>
  )
}
