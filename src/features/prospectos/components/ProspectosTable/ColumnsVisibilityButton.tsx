/**
 * Botón de visibilidad de columnas reutilizable
 * Se puede usar en diferentes ubicaciones de la UI
 */

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
import type { Table } from '@tanstack/react-table'

interface ColumnsVisibilityButtonProps<TData> {
  table: Table<TData>
}

export function ColumnsVisibilityButton<TData>({
  table,
}: ColumnsVisibilityButtonProps<TData>) {
  return (
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
  )
}
