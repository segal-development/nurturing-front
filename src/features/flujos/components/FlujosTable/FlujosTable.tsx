/**
 * Container para la tabla de flujos
 * Composición de header y rows
 */

import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { FlujoTableHeader } from './FlujoTableHeader'
import { FlujoTableRow } from './FlujoTableRow'
import type { FlujosTableProps } from '../../types/flujos'

export function FlujosTable({
  flujos,
  onViewFlujo,
  onEditFlujo,
  onDeleteFlujo,
  onEjecutarFlujo,
}: Omit<FlujosTableProps, 'isLoading'>) {
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
