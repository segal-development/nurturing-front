/**
 * Definiciones de columnas para la tabla de prospectos
 *
 * SOLID Principles:
 * - Single Responsibility: Each function/component has one reason to change
 * - Composition: Small, reusable functions for rendering
 * - Dependency Injection: All dependencies injected via parameters
 * - Type Safety: Strict TypeScript with no-implicit-any
 */

import type { ColumnDef, Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  ESTADO_PROSPECTO_OPTIONS,
  ESTADO_PROSPECTO_COLORS,
} from '@/lib/constants'
import type { Prospecto } from '../../types/prospectos'
import { MoreHorizontal, ArrowUpDown, Trash2, Eye, Loader2 } from 'lucide-react'

/**
 * Componente reutilizable para headers de columnas sortables
 */
const SortableColumnHeader = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <Button
    variant="ghost"
    onClick={onClick}
    className="h-8 p-0 hover:bg-transparent text-segal-dark dark:text-white font-semibold"
  >
    {label}
    <ArrowUpDown className="ml-2 h-4 w-4" />
  </Button>
)

/**
 * Formatea un valor de teléfono, retornando '-' si es nulo/vacío
 */
const formatPhoneNumber = (phone: string | undefined): string => {
  return phone?.trim() ? phone : '-'
}

/**
 * Obtiene el label de estado con su correspondiente color
 */
const getEstadoBadge = (estado: string) => {
  const estadoOption = ESTADO_PROSPECTO_OPTIONS.find((o) => o.value === estado)
  const colorClass = ESTADO_PROSPECTO_COLORS[estado as keyof typeof ESTADO_PROSPECTO_COLORS]

  return {
    label: estadoOption?.label || estado,
    colorClass: colorClass || '',
  }
}

/**
 * Obtiene el callback onViewProspecto del metadata de la tabla
 */
const getViewProspectoCallback = (table: Table<Prospecto>): ((id: number) => void) | undefined => {
  return (table.options.meta as any)?.onViewProspecto
}

/**
 * Obtiene el callback onDeleteProspecto del metadata de la tabla
 */
const getDeleteProspectoCallback = (table: Table<Prospecto>): ((id: number) => void) | undefined => {
  return (table.options.meta as any)?.onDeleteProspecto
}

/**
 * Obtiene el estado de eliminación del metadata de la tabla
 */
const getIsDeleting = (table: Table<Prospecto>): boolean => {
  return (table.options.meta as any)?.isDeleting ?? false
}

/**
 * Obtiene el ID del prospecto que se está eliminando
 */
const getDeletingId = (table: Table<Prospecto>): number | null => {
  return (table.options.meta as any)?.deletingId ?? null
}

/**
 * Formatea un RUT, retornando '-' si es nulo/vacío
 */
const formatRut = (rut: string | undefined): string => {
  return rut?.trim() ? rut : '-'
}

export const columns: ColumnDef<Prospecto>[] = [
  // ============================================================
  // COLUMNA: NOMBRE (25% del ancho)
  // ============================================================
  {
    accessorKey: 'nombre',
    size: 250,
    header: ({ column }) => (
      <SortableColumnHeader
        label="Nombre"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      />
    ),
    cell: ({ row }) => (
      <div className="font-medium text-segal-dark dark:text-white truncate">
        {row.getValue('nombre')}
      </div>
    ),
    sortingFn: 'alphanumeric',
  },

  // ============================================================
  // COLUMNA: EMAIL (25% del ancho)
  // ============================================================
  {
    accessorKey: 'email',
    size: 250,
    header: ({ column }) => (
      <SortableColumnHeader
        label="Email"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      />
    ),
    cell: ({ row }) => (
      <div className="text-segal-dark/70 text-sm dark:text-white/70 truncate">
        {row.getValue('email')}
      </div>
    ),
    sortingFn: 'alphanumeric',
  },

  // ============================================================
  // COLUMNA: TELÉFONO (15% del ancho)
  // ============================================================
  {
    accessorKey: 'telefono',
    size: 150,
    header: ({ column }) => (
      <SortableColumnHeader
        label="Teléfono"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      />
    ),
    cell: ({ row }) => {
      const telefono = row.getValue('telefono') as string | undefined
      return (
        <div className="text-segal-dark/70 dark:text-white/70">
          {formatPhoneNumber(telefono)}
        </div>
      )
    },
    sortingFn: 'alphanumeric',
  },

  // ============================================================
  // COLUMNA: RUT (15% del ancho)
  // ============================================================
  {
    accessorKey: 'rut',
    size: 130,
    header: ({ column }) => (
      <SortableColumnHeader
        label="RUT"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      />
    ),
    cell: ({ row }) => {
      const rut = row.getValue('rut') as string | undefined
      return (
        <div className="text-segal-dark/70 text-sm dark:text-white/70">
          {formatRut(rut)}
        </div>
      )
    },
    sortingFn: 'alphanumeric',
  },

  // ============================================================
  // COLUMNA: ESTADO (10% del ancho)
  // ============================================================
  {
    accessorKey: 'estado',
    size: 100,
    header: ({ column }) => (
      <SortableColumnHeader
        label="Estado"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      />
    ),
    cell: ({ row }) => {
      const estado = row.getValue('estado') as string
      const { label, colorClass } = getEstadoBadge(estado)

      return (
        <Badge variant="outline" className={colorClass}>
          {label}
        </Badge>
      )
    },
    sortingFn: 'alphanumeric',
  },

  // ============================================================
  // COLUMNA: ACCIONES (ancho fijo)
  // ============================================================
  {
    id: 'acciones',
    size: 80,
    header: () => (
      <div className="text-center text-segal-dark dark:text-white font-semibold">
        Acciones
      </div>
    ),
    cell: ({ row, table }) => {
      const onViewProspecto = getViewProspectoCallback(table)
      const onDeleteProspecto = getDeleteProspectoCallback(table)
      const isDeleting = getIsDeleting(table)
      const deletingId = getDeletingId(table)
      const prospecto = row.original
      
      const isThisDeleting = isDeleting && deletingId === prospecto.id

      // Si este prospecto se está eliminando, mostrar spinner
      if (isThisDeleting) {
        return (
          <div className="flex items-center justify-end gap-2 text-red-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">Eliminando...</span>
          </div>
        )
      }

      return (
        <div className="flex justify-center">
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-segal-blue/10">
                  <span className="sr-only">Abrir menú</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-900 dark:border-slate-700">
                <DropdownMenuLabel className="dark:text-white">Acciones</DropdownMenuLabel>
                <DropdownMenuSeparator className="dark:bg-slate-700" />
                {onViewProspecto && (
                  <DropdownMenuItem 
                    className="cursor-pointer dark:text-white dark:focus:bg-slate-800" 
                    onClick={() => onViewProspecto(prospecto.id)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver prospecto
                  </DropdownMenuItem>
                )}
                {onDeleteProspecto && (
                  <>
                    <DropdownMenuSeparator className="dark:bg-slate-700" />
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem 
                        className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:text-red-400 dark:focus:bg-red-950"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Diálogo de confirmación para eliminar */}
            <AlertDialogContent className="bg-white dark:bg-slate-900">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-segal-dark dark:text-white">
                  ¿Eliminar prospecto?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-segal-dark/70 dark:text-white/70">
                  Estás por eliminar a <span className="font-semibold">{prospecto.nombre}</span>.
                  Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDeleteProspecto?.(prospecto.id)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )
    },
  },
]
