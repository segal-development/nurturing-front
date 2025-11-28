/**
 * Definiciones de columnas para la tabla de prospectos
 * Usando TanStack Table v8 (React Table)
 */

import type { ColumnDef } from '@tanstack/react-table'
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
import { formatDate } from '@/lib/utils'
import { getMontoCategoryKey } from '../../utils/getMontoCategoryKey'
import type { Prospecto } from '../../types/prospectos'
import { MoreHorizontal, ArrowUpDown } from 'lucide-react'

export const columns: ColumnDef<Prospecto>[] = [
  {
    accessorKey: 'nombre',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 p-0 hover:bg-transparent text-segal-dark font-semibold"
      >
        Nombre
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium text-segal-dark">{row.getValue('nombre')}</div>,
    sortingFn: 'alphanumeric',
  },

  {
    accessorKey: 'email',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 p-0 hover:bg-transparent text-segal-dark font-semibold"
      >
        Email
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-segal-dark/70 text-sm">{row.getValue('email')}</div>,
    sortingFn: 'alphanumeric',
  },

  {
    accessorKey: 'telefono',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 p-0 hover:bg-transparent text-segal-dark font-semibold"
      >
        Teléfono
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const telefono = row.getValue('telefono') as string | undefined
      return <div className="text-segal-dark/70">{telefono || '-'}</div>
    },
    sortingFn: 'alphanumeric',
  },

  {
    accessorKey: 'monto_deuda',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 p-0 hover:bg-transparent text-segal-dark font-semibold"
      >
        Monto Deuda
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const monto = row.getValue('monto_deuda') as number
      return <div className="font-medium text-segal-dark">${monto.toLocaleString('es-CL')}</div>
    },
    sortingFn: 'basic',
  },

  {
    accessorKey: 'estado',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 p-0 hover:bg-transparent text-segal-dark font-semibold"
      >
        Estado
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const estado = row.getValue('estado') as string
      return (
        <Badge
          variant="outline"
          className={ESTADO_PROSPECTO_COLORS[estado as keyof typeof ESTADO_PROSPECTO_COLORS]}
        >
          {ESTADO_PROSPECTO_OPTIONS.find((o) => o.value === estado)?.label}
        </Badge>
      )
    },
    sortingFn: 'alphanumeric',
  },

  {
    accessorKey: 'tipo_prospecto_id',
    id: 'tipo',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 p-0 hover:bg-transparent text-segal-dark font-semibold"
      >
        Tipo
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const montoCategory = getMontoCategoryKey(row.original.monto_deuda)
      return (
        <Badge variant="secondary" className={TIPO_DEUDA_COLORS[montoCategory as keyof typeof TIPO_DEUDA_COLORS]}>
          {TIPO_DEUDA_OPTIONS.find((o) => o.value === montoCategory)?.label}
        </Badge>
      )
    },
    sortingFn: 'alphanumeric',
  },

  {
    accessorKey: 'fecha_ultimo_contacto',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 p-0 hover:bg-transparent text-segal-dark font-semibold"
      >
        Ult. Contacto
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const fecha = row.getValue('fecha_ultimo_contacto') as string | undefined
      return <div className="text-segal-dark/70 text-sm">{fecha ? formatDate(fecha) : '-'}</div>
    },
    sortingFn: 'datetime',
  },

  {
    id: 'acciones',
    header: () => <div className="text-right text-segal-dark font-semibold">Acciones</div>,
    cell: ({ row, table }) => {
      // Obtener el callback de onViewProspecto de los metadata de la tabla
      const onViewProspecto = (table.options.meta as any)?.onViewProspecto
      const prospecto = row.original

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onViewProspecto?.(prospecto.id)}>
                Ver prospecto
              </DropdownMenuItem>
              {/* Aquí se pueden agregar más acciones como editar, eliminar, etc */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]
