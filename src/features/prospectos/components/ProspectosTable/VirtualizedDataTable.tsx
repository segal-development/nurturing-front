/**
 * VirtualizedDataTable - Tabla con virtualización para grandes volúmenes de datos
 *
 * PERFORMANCE:
 * - Solo renderiza las filas visibles en el viewport
 * - Con 391k prospectos, renderiza ~20 filas en vez de todas
 * - Tiempo de render: O(visible) en vez de O(total)
 *
 * Usa @tanstack/react-virtual + @tanstack/react-table
 */

import { useRef, useCallback } from 'react';
import type {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  ColumnDef,
} from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Eye, EyeOff, ChevronDown } from 'lucide-react';
import type { Prospecto } from '../../types/prospectos';

// Altura fija de cada fila para virtualización
const ROW_HEIGHT = 53;
// Altura del contenedor de la tabla
const TABLE_HEIGHT = 600;
// Cuántas filas extra renderizar fuera del viewport (overscan)
const OVERSCAN_COUNT = 5;

interface VirtualizedDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onViewProspecto?: (id: number) => void;
  onDeleteProspecto?: (id: number) => void;
  isDeleting?: boolean;
  deletingId?: number | null;
}

const getColumnDisplayName = (header: string | unknown, columnId: string): string => {
  if (typeof header === 'string') return header;
  return columnId;
};

const getVisibilityIcon = (isVisible: boolean) => {
  return isVisible ? (
    <Eye className="h-4 w-4 text-segal-green dark:text-emerald-400" />
  ) : (
    <EyeOff className="h-4 w-4 text-segal-dark/40 dark:text-white/40" />
  );
};

export function VirtualizedDataTable<TData extends Prospecto, TValue>({
  columns,
  data,
  onViewProspecto,
  onDeleteProspecto,
  isDeleting = false,
  deletingId = null,
}: VirtualizedDataTableProps<TData, TValue>) {
  // ============================================================
  // REFS
  // ============================================================
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // ============================================================
  // ESTADO DE LA TABLA
  // ============================================================
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // ============================================================
  // TANSTACK TABLE
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
      onDeleteProspecto,
      isDeleting,
      deletingId,
    },
  });

  const { rows } = table.getRowModel();

  // ============================================================
  // VIRTUALIZACIÓN
  // ============================================================
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: useCallback(() => ROW_HEIGHT, []),
    getScrollElement: () => tableContainerRef.current,
    overscan: OVERSCAN_COUNT,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  // Padding para mantener el scroll correcto
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0)
      : 0;

  return (
    <div className="w-full space-y-3">
      {/* Toolbar con botón de columnas */}
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="border-segal-blue/30 text-segal-dark hover:bg-segal-blue/5 dark:text-white dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
            >
              <Eye className="mr-2 h-4 w-4" />
              Columnas
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-slate-900 dark:border-slate-700">
            <DropdownMenuLabel className="text-segal-dark font-semibold dark:text-white">
              Mostrar/Ocultar Columnas
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="dark:bg-slate-700" />
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                const isVisible = column.getIsVisible();
                const displayName = getColumnDisplayName(column.columnDef.header, column.id);

                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="cursor-pointer text-segal-dark dark:text-white hover:bg-segal-blue/5 dark:hover:bg-slate-800"
                    checked={isVisible}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    <div className="flex items-center gap-2">
                      {getVisibilityIcon(isVisible)}
                      {displayName}
                    </div>
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tabla virtualizada */}
      <div className="border border-segal-blue/10 rounded-lg overflow-hidden dark:border-slate-700 dark:bg-slate-900">
        <Table className="table-fixed w-full">
          <TableHeader className="bg-segal-blue/5 border-b border-segal-blue/10 dark:bg-slate-800 dark:border-slate-700">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead 
                    key={header.id} 
                    className="text-segal-dark font-semibold dark:text-white"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
        </Table>

        {/* Contenedor scrolleable con virtualización */}
        <div
          ref={tableContainerRef}
          className="overflow-auto"
          style={{ height: TABLE_HEIGHT, maxHeight: TABLE_HEIGHT }}
        >
          <Table className="table-fixed w-full">
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-segal-dark/60 dark:text-white/60"
                  >
                    No hay prospectos para esta importación
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {/* Padding superior para mantener posición de scroll */}
                  {paddingTop > 0 && (
                    <tr>
                      <td style={{ height: paddingTop }} />
                    </tr>
                  )}

                  {/* Filas virtualizadas */}
                  {virtualRows.map((virtualRow) => {
                    const row = rows[virtualRow.index];
                    return (
                      <TableRow
                        key={row.id}
                        data-index={virtualRow.index}
                        data-state={row.getIsSelected() && 'selected'}
                        className="hover:bg-segal-blue/5 border-b border-segal-blue/5 dark:hover:bg-slate-800 dark:border-slate-700"
                        style={{ height: ROW_HEIGHT }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell 
                            key={cell.id}
                            style={{ width: cell.column.getSize() }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}

                  {/* Padding inferior para mantener posición de scroll */}
                  {paddingBottom > 0 && (
                    <tr>
                      <td style={{ height: paddingBottom }} />
                    </tr>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Indicador de filas renderizadas (debug, se puede quitar en prod) */}
      {rows.length > 0 && (
        <div className="text-xs text-segal-dark/50 dark:text-white/50 text-right">
          Renderizando {virtualRows.length} de {rows.length} filas
        </div>
      )}
    </div>
  );
}
