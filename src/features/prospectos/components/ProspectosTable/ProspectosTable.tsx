/**
 * Container para la tabla de prospectos
 * Usa TanStack Table con DataTable para sorting y column visibility
 */

import { DataTable } from './DataTable'
import { columns } from './columns'
import type { ProspectosTableProps } from '../../types/prospectos'

interface ProspectosTableComponentProps extends Omit<ProspectosTableProps, 'isLoading'> {
  onDeleteProspecto?: (id: number) => void
}

export function ProspectosTable({ prospectos, onViewProspecto, onDeleteProspecto }: ProspectosTableComponentProps) {
  return (
    <DataTable
      columns={columns}
      data={prospectos}
      onViewProspecto={onViewProspecto}
      onDeleteProspecto={onDeleteProspecto}
    />
  )
}
