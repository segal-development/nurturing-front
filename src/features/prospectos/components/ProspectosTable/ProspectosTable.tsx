/**
 * Container para la tabla de prospectos
 * Usa TanStack Table con DataTable para sorting y column visibility
 */

import { DataTable } from './DataTable'
import { columns } from './columns'
import type { ProspectosTableProps } from '../../types/prospectos'

export function ProspectosTable({ prospectos, onViewProspecto }: Omit<ProspectosTableProps, 'isLoading'>) {
  return (
    <DataTable
      columns={columns}
      data={prospectos}
      onViewProspecto={onViewProspecto}
    />
  )
}
