/**
 * Combobox para seleccionar lotes/cargas con búsqueda
 * Permite filtrar rápidamente entre muchas cargas
 */

import { useState } from 'react'
import {
  Check,
  ChevronsUpDown,
  FileStack,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { LoteOpcion } from '../../types/prospectos'

interface LoteComboboxProps {
  lotes: LoteOpcion[] | undefined
  selectedId: number | null
  onChange: (id: number) => void
  placeholder?: string
}

/**
 * Obtiene el ícono de estado del lote
 */
function getLoteStatusIcon(estado: LoteOpcion['estado']) {
  switch (estado) {
    case 'completado':
      return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
    case 'procesando':
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0" />
    case 'fallido':
      return <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
    default:
      return <FileStack className="h-4 w-4 text-gray-400 shrink-0" />
  }
}

/**
 * Formatea el número con separador de miles
 */
function formatNumber(num: number): string {
  return num.toLocaleString('es-CL')
}

/**
 * Extrae la fecha del nombre del lote si existe (formato: _YYYY-MM-DD)
 */
function extractDateFromName(nombre: string): string | null {
  const match = nombre.match(/_(\d{4}-\d{2}-\d{2})$/)
  if (match) {
    const [year, month, day] = match[1].split('-')
    return `${day}/${month}/${year}`
  }
  return null
}

/**
 * Obtiene un nombre más legible del lote
 */
function getDisplayName(nombre: string): string {
  // Remover la fecha del final si existe
  return nombre.replace(/_\d{4}-\d{2}-\d{2}$/, '').replace(/_/g, ' ')
}

export function LoteCombobox({
  lotes,
  selectedId,
  onChange,
  placeholder = 'Buscar carga...',
}: LoteComboboxProps) {
  const [open, setOpen] = useState(false)

  const selectedLote = lotes?.find((lote) => lote.id === selectedId)

  if (!lotes || lotes.length === 0) {
    return (
      <div className="h-9 px-3 rounded-lg border border-segal-blue/30 bg-white text-xs text-segal-dark/60 flex items-center dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
        {lotes?.length === 0 ? 'Sin cargas disponibles' : 'Cargando...'}
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'h-9 w-full justify-between text-sm border-segal-blue/30 bg-white hover:bg-slate-50',
            'focus:border-segal-blue focus:ring-segal-blue/20',
            'dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600',
            'dark:focus:border-segal-blue dark:focus:ring-segal-blue/20'
          )}
        >
          {selectedLote ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {getLoteStatusIcon(selectedLote.estado)}
              <span className="truncate">{getDisplayName(selectedLote.nombre)}</span>
              <span className="text-slate-500 dark:text-slate-400 shrink-0">
                ({formatNumber(selectedLote.total_prospectos)})
              </span>
            </div>
          ) : (
            <span className="text-slate-500 dark:text-slate-400">Selecciona una carga...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[450px] p-0 bg-white dark:bg-gray-800 border-segal-blue/20 dark:border-gray-600"
        align="start"
      >
        <Command className="dark:bg-gray-800">
          <CommandInput
            placeholder={placeholder}
            className="dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
          />
          <CommandList className="max-h-[350px]">
            <CommandEmpty className="dark:text-gray-400">
              No se encontraron cargas.
            </CommandEmpty>
            <CommandGroup>
              {lotes.map((lote) => {
                const fecha = extractDateFromName(lote.nombre)
                const displayName = getDisplayName(lote.nombre)

                return (
                  <CommandItem
                    key={lote.id}
                    value={`${lote.nombre} ${lote.total_prospectos}`}
                    onSelect={() => {
                      onChange(lote.id)
                      setOpen(false)
                    }}
                    className="flex items-center gap-3 py-2.5 px-2 cursor-pointer dark:text-white dark:data-[selected=true]:bg-gray-700"
                  >
                    <Check
                      className={cn(
                        'h-4 w-4 shrink-0',
                        selectedId === lote.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {getLoteStatusIcon(lote.estado)}
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium text-sm truncate">{displayName}</span>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>
                          {formatNumber(lote.total_prospectos)} prospectos
                        </span>
                        <span>•</span>
                        <span>
                          {lote.total_archivos}{' '}
                          {lote.total_archivos === 1 ? 'archivo' : 'archivos'}
                        </span>
                        {fecha && (
                          <>
                            <span>•</span>
                            <span>{fecha}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
