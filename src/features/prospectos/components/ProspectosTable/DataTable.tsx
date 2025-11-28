/**
 * DataTable component con TanStack Table
 * Proporciona sorting, column visibility, y otras funcionalidades avanzadas
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
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Eye, EyeOff, ChevronDown } from 'lucide-react'
import type { Prospecto } from '../../types/prospectos'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onViewProspecto?: (id: number) => void
}

export function DataTable<TData extends Prospecto, TValue>({
  columns,
  data,
  onViewProspecto,
}: DataTableProps<TData, TValue>) {
  // Estados de la tabla
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    // Por defecto, mostrar todas las columnas
    // Puedes comentar columnas aquí para ocultarlas por defecto
    // telefono: false,
  })

  // Crear la tabla con TanStack Table
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
    // Pasar callbacks a través de meta
    meta: {
      onViewProspecto,
    },
  })

  return (
    <div className="w-full space-y-4">
      {/* Toolbar con controles */}
      <div className="flex items-center justify-end gap-2">
        {/* Botón de visibilidad de columnas */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto border-segal-blue/30 text-segal-dark hover:bg-segal-blue/5"
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
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="cursor-pointer text-segal-dark"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  <div className="flex items-center gap-2">
                    {column.getIsVisible() ? (
                      <Eye className="h-4 w-4 text-segal-green" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-segal-dark/40" />
                    )}
                    {typeof column.columnDef.header === 'string'
                      ? column.columnDef.header
                      : column.id}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
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
