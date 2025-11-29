/**
 * DataTable component con TanStack Table
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles table rendering and state
 * - Open/Closed: Accepts column definitions as props
 * - Liskov Substitution: Works with any data model via generics
 * - Interface Segregation: Props are minimal and focused
 * - Dependency Inversion: Depends on abstractions, not concrete implementations
 */

import type {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  ColumnDef,
} from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Eye, EyeOff, ChevronDown } from 'lucide-react'
import type { Prospecto } from '../../types/prospectos'

/**
 * Props para DataTable
 * @template TData - Tipo de datos (ej: Prospecto)
 * @template TValue - Tipo de valor en celdas
 */
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onViewProspecto?: (id: number) => void
}

/**
 * Obtiene el nombre mostrable de una columna
 */
const getColumnDisplayName = (header: string | unknown, columnId: string): string => {
  if (typeof header === 'string') return header
  return columnId
}

/**
 * Determina si una celda tiene un icono visible o no
 */
const getVisibilityIcon = (isVisible: boolean) => {
  return isVisible ? (
    <Eye className="h-4 w-4 text-segal-green" />
  ) : (
    <EyeOff className="h-4 w-4 text-segal-dark/40" />
  )
}

export function DataTable<TData extends Prospecto, TValue>({
  columns,
  data,
  onViewProspecto,
}: DataTableProps<TData, TValue>) {
  // ============================================================
  // ESTADO DE LA TABLA
  // ============================================================
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  // ============================================================
  // INICIALIZACIÓN DE TANSTACK TABLE
  // ============================================================
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    meta: {
      onViewProspecto,
    },
  })


  return (
    <div className="w-full space-y-3">
      {/* Toolbar con botón de columnas */}
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="border-segal-blue/30 text-segal-dark hover:bg-segal-blue/5"
            >
              <Eye className="mr-2 h-4 w-4" />
              Columnas
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white">
            <DropdownMenuLabel className="text-segal-dark font-semibold">
              Mostrar/Ocultar Columnas
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                const isVisible = column.getIsVisible()
                const displayName = getColumnDisplayName(column.columnDef.header, column.id)

                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="cursor-pointer text-segal-dark"
                    checked={isVisible}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    <div className="flex items-center gap-2">
                      {getVisibilityIcon(isVisible)}
                      {displayName}
                    </div>
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tabla */}
      <div className="border border-segal-blue/10 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-segal-blue/5 border-b border-segal-blue/10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-segal-dark font-semibold">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="hover:bg-segal-blue/5 border-b border-segal-blue/5"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-segal-dark/60">
                  No hay prospectos para esta importación
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
