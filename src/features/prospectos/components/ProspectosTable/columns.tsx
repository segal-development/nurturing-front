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
  ESTADO_PROSPECTO_OPTIONS,
  ESTADO_PROSPECTO_COLORS,
  TIPO_DEUDA_OPTIONS,
  TIPO_DEUDA_COLORS,
} from '@/lib/constants'
import { getMontoCategoryKey } from '../../utils/getMontoCategoryKey'
import type { Prospecto } from '../../types/prospectos'
import { MoreHorizontal, ArrowUpDown, FileText } from 'lucide-react'

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
 * Formatea un monto en moneda chilena
 */
const formatCurrencyAmount = (amount: number): string => {
  return `$${amount.toLocaleString('es-CL')}`
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
 * Obtiene el label de tipo de deuda con su correspondiente color basado en monto
 */
const getTipoDeudaBadge = (monto: number) => {
  const montoCategory = getMontoCategoryKey(monto)
  const tipoOption = TIPO_DEUDA_OPTIONS.find((o) => o.value === montoCategory)
  const colorClass = TIPO_DEUDA_COLORS[montoCategory as keyof typeof TIPO_DEUDA_COLORS]

  return {
    label: tipoOption?.label || montoCategory,
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
 * Formatea un RUT, retornando '-' si es nulo/vacío
 */
const formatRut = (rut: string | undefined): string => {
  return rut?.trim() ? rut : '-'
}

/**
 * Abre una URL en una nueva pestaña de forma segura
 */
const openUrlInNewTab = (url: string | undefined): void => {
  if (!url?.trim()) return
  window.open(url, '_blank', 'noopener,noreferrer')
}

export const columns: ColumnDef<Prospecto>[] = [
  // ============================================================
  // COLUMNA: NOMBRE
  // ============================================================
  {
    accessorKey: 'nombre',
    header: ({ column }) => (
      <SortableColumnHeader
        label="Nombre"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      />
    ),
    cell: ({ row }) => (
      <div className="font-medium text-segal-dark dark:text-white">
        {row.getValue('nombre')}
      </div>
    ),
    sortingFn: 'alphanumeric',
  },

  // ============================================================
  // COLUMNA: EMAIL
  // ============================================================
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <SortableColumnHeader
        label="Email"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      />
    ),
    cell: ({ row }) => (
      <div className="text-segal-dark/70 text-sm dark:text-white/70">
        {row.getValue('email')}
      </div>
    ),
    sortingFn: 'alphanumeric',
  },

  // ============================================================
  // COLUMNA: TELÉFONO
  // ============================================================
  {
    accessorKey: 'telefono',
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
  // COLUMNA: RUT
  // ============================================================
  {
    accessorKey: 'rut',
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
  // COLUMNA: INFORME
  // ============================================================
  {
    id: 'informe',
    header: () => (
      <div className="text-segal-dark dark:text-white font-semibold">
        Informe
      </div>
    ),
    cell: ({ row }) => {
      const prospecto = row.original
      const urlInforme = prospecto.url_informe as string | null | undefined
      const hasUrl = urlInforme && typeof urlInforme === 'string' && urlInforme.trim().length > 0

      return (
        <div className="flex items-center justify-center">
          {hasUrl ? (
            <button
              onClick={() => openUrlInNewTab(urlInforme)}
              className="p-2 rounded-lg hover:bg-segal-blue/10 transition-colors text-segal-blue dark:hover:bg-slate-800 dark:text-segal-turquoise dark:hover:text-white"
              aria-label="Ver informe"
              title="Descargar informe"
            >
              <FileText className="h-5 w-5" />
            </button>
          ) : (
            <span className="text-segal-dark/30 dark:text-white/30 text-sm">-</span>
          )}
        </div>
      )
    },
    enableSorting: false,
  },

  // ============================================================
  // COLUMNA: MONTO DEUDA
  // ============================================================
  {
    accessorKey: 'monto_deuda',
    header: ({ column }) => (
      <SortableColumnHeader
        label="Monto Deuda"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      />
    ),
    cell: ({ row }) => {
      const monto = row.getValue('monto_deuda') as number
      return (
        <div className="font-medium text-segal-dark dark:text-white">
          {formatCurrencyAmount(monto)}
        </div>
      )
    },
    sortingFn: 'basic',
  },

  // ============================================================
  // COLUMNA: ESTADO
  // ============================================================
  {
    accessorKey: 'estado',
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
  // COLUMNA: TIPO DE DEUDA
  // ============================================================
  {
    accessorKey: 'tipo_prospecto_id',
    id: 'tipo',
    header: ({ column }) => (
      <SortableColumnHeader
        label="Tipo"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      />
    ),
    cell: ({ row }) => {
      const { label, colorClass } = getTipoDeudaBadge(row.original.monto_deuda)

      return (
        <Badge variant="secondary" className={colorClass}>
          {label}
        </Badge>
      )
    },
    sortingFn: 'alphanumeric',
  },

  // ============================================================
  // COLUMNA: ACCIONES
  // ============================================================
  {
    id: 'acciones',
    header: () => (
      <div className="text-right text-segal-dark dark:text-white font-semibold">
        Acciones
      </div>
    ),
    cell: ({ row, table }) => {
      const onViewProspecto = getViewProspectoCallback(table)
      const prospecto = row.original

      if (!onViewProspecto) {
        return null
      }

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="dark:bg-slate-900 dark:border-slate-700">
              <DropdownMenuLabel className="dark:text-white">Acciones</DropdownMenuLabel>
              <DropdownMenuSeparator className="dark:bg-slate-700" />
              <DropdownMenuItem className="dark:text-white dark:focus:bg-slate-800" onClick={() => onViewProspecto(prospecto.id)}>
                Ver prospecto
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]
