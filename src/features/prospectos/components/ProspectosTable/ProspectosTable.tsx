/**
 * Container para la tabla de prospectos
 * Composición de header y rows
 */

import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { ProspectoTableHeader } from './ProspectoTableHeader'
import { ProspectoTableRow } from './ProspectoTableRow'
import type { ProspectosTableProps } from '../../types/prospectos'

export function ProspectosTable({ prospectos, onViewProspecto }: Omit<ProspectosTableProps, 'isLoading'>) {
  return (
    <div className="border border-segal-blue/10 rounded-lg overflow-hidden">
      <Table>
        <ProspectoTableHeader />
        <TableBody>
          {prospectos.length > 0 ? (
            prospectos.map((prospecto) => (
              <ProspectoTableRow
                key={prospecto.id}
                prospecto={prospecto}
                onViewProspecto={onViewProspecto}
              />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-segal-dark/60">
                No hay prospectos para esta importación
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
