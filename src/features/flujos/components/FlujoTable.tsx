import { Calendar, FileText, Zap } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { FlujoNurturing } from '@/types/flujo'

interface FlujoTableProps {
  flujos: FlujoNurturing[] | undefined
  loading: boolean
  onEdit?: (flujo: FlujoNurturing) => void
  onDelete?: (flujo: FlujoNurturing) => void
}

// Helper function to get tipo_prospecto name as string
function getTipoProspectoName(tipoProspecto: FlujoNurturing['tipo_prospecto']): string {
  if (typeof tipoProspecto === 'string') {
    return tipoProspecto
  }
  return tipoProspecto?.nombre || '-'
}

/**
 * Displays a table of nurturing flows with status and stage information
 */
export function FlujoTable({ flujos, loading, onEdit, onDelete }: FlujoTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin">
          <Zap className="h-6 w-6 text-segal-green" />
        </div>
      </div>
    )
  }

  if (!flujos || flujos.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-segal-dark/30 mx-auto mb-4" />
        <p className="text-segal-dark/60">No hay flujos disponibles</p>
      </div>
    )
  }

  return (
    <div className="border border-segal-blue/10 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-segal-blue/5 border-b border-segal-blue/10">
            <TableHead className="text-segal-dark font-semibold">Nombre Flujo</TableHead>
            <TableHead className="text-segal-dark font-semibold">Tipo Prospecto</TableHead>
            <TableHead className="text-segal-dark font-semibold">Etapas</TableHead>
            <TableHead className="text-segal-dark font-semibold">Estado</TableHead>
            <TableHead className="text-segal-dark font-semibold">Creado</TableHead>
            <TableHead className="text-right text-segal-dark font-semibold">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flujos.map((flujo) => (
            <TableRow
              key={flujo.id}
              className="hover:bg-segal-blue/5 border-b border-segal-blue/5"
            >
              <TableCell className="font-medium text-segal-dark">{flujo.nombre}</TableCell>
              <TableCell className="text-segal-dark/70">
                <span className="inline-block px-2 py-1 rounded bg-segal-blue/10 text-xs font-medium text-segal-blue">
                  {getTipoProspectoName(flujo.tipo_prospecto)}
                </span>
              </TableCell>
              <TableCell className="text-segal-dark/70">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-segal-turquoise" />
                  {flujo.etapas?.length ?? 0} etapas
                </span>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    flujo.activo
                      ? 'bg-segal-green/10 text-segal-green'
                      : 'bg-segal-dark/10 text-segal-dark/60'
                  }`}
                >
                  {flujo.activo ? 'Activo' : 'Inactivo'}
                </span>
              </TableCell>
              <TableCell className="text-segal-dark/70 text-sm">
                {new Date(flujo.created_at).toLocaleDateString('es-ES')}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(flujo)}
                      className="px-3 py-1 text-xs bg-segal-blue/10 hover:bg-segal-blue/20 text-segal-blue rounded transition-colors"
                    >
                      Editar
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(flujo)}
                      className="px-3 py-1 text-xs bg-segal-red/10 hover:bg-segal-red/20 text-segal-red rounded transition-colors"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
