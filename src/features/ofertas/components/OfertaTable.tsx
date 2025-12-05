import { FileText, Zap, TrendingUp } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { OfertaInfocom } from '@/types/oferta'

interface OfertaTableProps {
  ofertas: OfertaInfocom[] | undefined
  loading: boolean
  onEdit?: (oferta: OfertaInfocom) => void
  onDelete?: (oferta: OfertaInfocom) => void
}

/**
 * Displays a table of Infocom offers with status and metrics
 */
export function OfertaTable({ ofertas, loading, onEdit, onDelete }: OfertaTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin">
          <Zap className="h-6 w-6 text-segal-orange dark:text-orange-400" />
        </div>
      </div>
    )
  }

  if (!ofertas || ofertas.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-segal-dark/30 dark:text-white/30 mx-auto mb-4" />
        <p className="text-segal-dark/60 dark:text-white/60">No hay ofertas disponibles</p>
      </div>
    )
  }

  return (
    <div className="border border-segal-orange/10 rounded-lg overflow-hidden dark:border-slate-700 dark:bg-slate-900">
      <Table>
        <TableHeader>
          <TableRow className="bg-segal-orange/5 border-b border-segal-orange/10 dark:bg-slate-800 dark:border-slate-700">
            <TableHead className="text-segal-dark font-semibold dark:text-white">Título</TableHead>
            <TableHead className="text-segal-dark font-semibold dark:text-white">Descripción</TableHead>
            <TableHead className="text-segal-dark font-semibold dark:text-white">Descuento</TableHead>
            <TableHead className="text-segal-dark font-semibold dark:text-white">Rango de Fechas</TableHead>
            <TableHead className="text-segal-dark font-semibold dark:text-white">Estado</TableHead>
            <TableHead className="text-right text-segal-dark font-semibold dark:text-white">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ofertas.map((oferta) => (
            <TableRow
              key={oferta.id}
              className="hover:bg-segal-orange/5 border-b border-segal-orange/5 dark:hover:bg-slate-800 dark:border-slate-700"
            >
              <TableCell className="font-medium text-segal-dark dark:text-white">{oferta.titulo}</TableCell>
              <TableCell className="text-segal-dark/70 max-w-xs truncate dark:text-white/70">
                {oferta.descripcion}
              </TableCell>
              <TableCell className="text-segal-dark/70 dark:text-white/70">
                {oferta.descuento ? `${oferta.descuento}%` : '-'}
              </TableCell>
              <TableCell className="text-segal-dark/70 text-sm dark:text-white/70">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-segal-turquoise dark:text-cyan-400" />
                  {new Date(oferta.fecha_inicio).toLocaleDateString('es-ES')} -{' '}
                  {new Date(oferta.fecha_fin).toLocaleDateString('es-ES')}
                </div>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    oferta.activo
                      ? 'bg-segal-orange/10 text-segal-orange dark:bg-orange-950 dark:text-orange-200'
                      : 'bg-segal-dark/10 text-segal-dark/60 dark:bg-slate-700 dark:text-white/60'
                  }`}
                >
                  {oferta.activo ? 'Activa' : 'Inactiva'}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(oferta)}
                      className="px-3 py-1 text-xs bg-segal-orange/10 hover:bg-segal-orange/20 text-segal-orange dark:bg-orange-950 dark:hover:bg-orange-900 dark:text-orange-200 rounded transition-colors"
                    >
                      Editar
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(oferta)}
                      className="px-3 py-1 text-xs bg-segal-red/10 hover:bg-segal-red/20 text-segal-red dark:bg-red-950 dark:hover:bg-red-900 dark:text-red-200 rounded transition-colors"
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
