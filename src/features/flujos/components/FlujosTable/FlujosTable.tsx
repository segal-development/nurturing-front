/**
 * Container para la tabla de flujos
 * 
 * PERFORMANCE OPTIMIZATION:
 * - Uses batch API call to fetch execution state for ALL flujos in 1 request
 * - Before: 15 flujos = 45 requests (3 per flujo)
 * - After: 15 flujos = 1 request
 */

import { useMemo } from 'react'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { FlujoTableHeader } from './FlujoTableHeader'
import { FlujoTableRow } from './FlujoTableRow'
import type { FlujosTableProps } from '../../types/flujos'
import { useBatchExecutionState, getFlowExecutionState } from '../../hooks/useBatchExecutionState'

export function FlujosTable({
  flujos,
  onViewFlujo,
  onEditFlujo,
  onDeleteFlujo,
  onEjecutarFlujo,
}: Omit<FlujosTableProps, 'isLoading'>) {
  // Extract all flujo IDs for batch fetch
  const flujoIds = useMemo(() => flujos.map((f) => f.id), [flujos])

  // PERFORMANCE: Single batch request for ALL flujos execution state
  // Show loading only on initial fetch, not on polling refetches
  const { data: batchExecutionData, isLoading, isFetching } = useBatchExecutionState(flujoIds)
  
  // Show spinner only when: initial load OR fetching with no real data yet
  const hasRealData = batchExecutionData && Object.keys(batchExecutionData).length > 0
  const isLoadingExecutions = isLoading || (isFetching && !hasRealData)

  return (
    <div className="border border-segal-blue/10 rounded-lg overflow-hidden">
      <Table>
        <FlujoTableHeader />
        <TableBody>
          {flujos.length > 0 ? (
            flujos.map((flujo) => (
              <FlujoTableRow
                key={flujo.id}
                flujo={flujo}
                executionState={getFlowExecutionState(batchExecutionData, flujo.id)}
                isLoadingExecution={isLoadingExecutions}
                onViewFlujo={onViewFlujo}
                onEditFlujo={onEditFlujo}
                onDeleteFlujo={onDeleteFlujo}
                onEjecutarFlujo={onEjecutarFlujo}
              />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-segal-dark/60 dark:text-white">
                No hay flujos para este origen
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
