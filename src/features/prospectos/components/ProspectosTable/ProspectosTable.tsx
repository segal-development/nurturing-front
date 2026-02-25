/**
 * Container para la tabla de prospectos
 * 
 * PERFORMANCE OPTIMIZATION:
 * - Usa VirtualizedDataTable para grandes volúmenes (>50 registros)
 * - Solo renderiza las filas visibles en el viewport
 * - Reduce tiempo de render de O(n) a O(visible)
 */

import { VirtualizedDataTable } from './VirtualizedDataTable'
import { columns } from './columns'
import type { ProspectosTableProps } from '../../types/prospectos'

interface ProspectosTableComponentProps extends Omit<ProspectosTableProps, 'isLoading'> {
  onDeleteProspecto?: (id: number) => void
  isDeleting?: boolean
  deletingId?: number | null
}

export function ProspectosTable({ 
  prospectos, 
  onViewProspecto, 
  onDeleteProspecto,
  isDeleting,
  deletingId,
}: ProspectosTableComponentProps) {
  return (
    <VirtualizedDataTable
      columns={columns}
      data={prospectos}
      onViewProspecto={onViewProspecto}
      onDeleteProspecto={onDeleteProspecto}
      isDeleting={isDeleting}
      deletingId={deletingId}
    />
  )
}
