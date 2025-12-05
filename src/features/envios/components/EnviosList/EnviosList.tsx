/**
 * Envios List Component
 *
 * Displays paginated list of shipments with filtering
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, AlertCircle, Eye } from 'lucide-react'
import { useEnviosListWithFilters } from '@/features/envios/hooks'
import { EnviosFilters } from './EnviosFilters'

/**
 * Main envios list component
 *
 * @example
 * <EnviosList onViewDetail={(envioId) => showDetailModal(envioId)} />
 */
export function EnviosList({
  onViewDetail,
}: {
  onViewDetail?: (envioId: number) => void
}) {
  const { envios, meta, isLoading, isError, error, filters, setFilters, setPage } =
    useEnviosListWithFilters()

  const getStatusBadgeColor = (estado: string) => {
    switch (estado) {
      case 'enviado':
        return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
      case 'fallido':
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getChannelIcon = (canal: string) => {
    return canal === 'email' ? '📧' : '📱'
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-segal-dark dark:text-white">Envíos</h1>
        <p className="text-segal-dark/60 dark:text-white/60 mt-2">
          Historial completo de envíos realizados
        </p>
      </div>

      {/* Filters */}
      <EnviosFilters filters={filters} onFiltersChange={setFilters} />

      {/* Error State */}
      {isError && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-300">
                Error al cargar envíos
              </p>
              <p className="text-sm text-red-700 dark:text-red-400">
                {error?.message || 'Intenta de nuevo más tarde'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card className="dark:bg-slate-900 dark:border-slate-700">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-segal-blue dark:text-segal-turquoise" />
              <p className="text-segal-dark/60 dark:text-white/60">Cargando envíos...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !isError && envios.length === 0 && (
        <Card className="dark:bg-slate-900 dark:border-slate-700">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-segal-dark/60 dark:text-white/60">No hay envíos para mostrar</p>
              <p className="text-sm text-segal-dark/40 dark:text-white/40 mt-2">
                Intenta cambiar los filtros o crea un nuevo flujo
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {!isLoading && !isError && envios.length > 0 && (
        <>
          <Card className="dark:bg-slate-900 dark:border-slate-700 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-segal-blue/5 dark:bg-slate-800">
                    <TableRow className="dark:border-slate-700">
                      <TableHead className="text-segal-dark dark:text-white">
                        Destinatario
                      </TableHead>
                      <TableHead className="text-segal-dark dark:text-white">Canal</TableHead>
                      <TableHead className="text-segal-dark dark:text-white">Estado</TableHead>
                      <TableHead className="text-segal-dark dark:text-white">Flujo</TableHead>
                      <TableHead className="text-segal-dark dark:text-white">Fecha</TableHead>
                      <TableHead className="text-right text-segal-dark dark:text-white">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {envios.map((envio) => (
                      <TableRow
                        key={envio.id}
                        className="hover:bg-segal-blue/5 dark:hover:bg-slate-800 dark:border-slate-700"
                      >
                        <TableCell className="text-segal-dark dark:text-white">
                          {envio.metadata.destinatario}
                        </TableCell>
                        <TableCell className="text-center">{getChannelIcon(envio.canal)}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(envio.estado)}`}
                          >
                            {envio.estado === 'enviado'
                              ? '✓ Enviado'
                              : envio.estado === 'fallido'
                                ? '✗ Fallido'
                                : '⏳ Pendiente'}
                          </span>
                        </TableCell>
                        <TableCell className="text-segal-dark/70 dark:text-white/70">
                          Flujo {envio.flujo_id}
                        </TableCell>
                        <TableCell className="text-sm text-segal-dark/60 dark:text-white/60">
                          {new Date(envio.fecha_creacion).toLocaleDateString('es-CL', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDetail?.(envio.id)}
                            className="dark:text-segal-turquoise dark:hover:bg-slate-800"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-segal-dark/60 dark:text-white/60">
              Página {meta.pagina} de {meta.total_paginas} ({meta.total} envíos total)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.pagina === 1}
                onClick={() => setPage(meta.pagina - 1)}
                className="dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.pagina === meta.total_paginas}
                onClick={() => setPage(meta.pagina + 1)}
                className="dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              >
                Siguiente
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default EnviosList
