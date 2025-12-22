/**
 * Envios List Component
 *
 * Displays paginated list of shipments with filtering
 * Professional UI/UX with clear status indicators and modern design
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  AlertCircle, 
  Eye, 
  Mail, 
  Smartphone, 
  CheckCircle2, 
  XCircle, 
  Clock,
  MousePointerClick,
  MailOpen,
  Send,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useEnviosListWithFilters } from '@/features/envios/hooks'
import { EnviosFilters } from './EnviosFilters'

/**
 * Status configuration with icons, colors and labels
 */
const STATUS_CONFIG: Record<string, { 
  label: string
  icon: React.ReactNode
  className: string 
}> = {
  enviado: {
    label: 'Enviado',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  abierto: {
    label: 'Abierto',
    icon: <MailOpen className="h-3.5 w-3.5" />,
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  clickeado: {
    label: 'Clickeado',
    icon: <MousePointerClick className="h-3.5 w-3.5" />,
    className: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  fallido: {
    label: 'Fallido',
    icon: <XCircle className="h-3.5 w-3.5" />,
    className: 'bg-red-100 text-red-700 border-red-200',
  },
  pendiente: {
    label: 'Pendiente',
    icon: <Clock className="h-3.5 w-3.5" />,
    className: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  programado: {
    label: 'Programado',
    icon: <Clock className="h-3.5 w-3.5" />,
    className: 'bg-amber-100 text-amber-700 border-amber-200',
  },
}

/**
 * Get status badge config
 */
function getStatusConfig(estado: string) {
  return STATUS_CONFIG[estado] || {
    label: estado,
    icon: <Send className="h-3.5 w-3.5" />,
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  }
}

/**
 * Format date in a readable way
 */
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '-'
  }
}

/**
 * Main envios list component with professional UI
 */
export function EnviosList({
  onViewDetail,
}: {
  onViewDetail?: (envioId: number) => void
}) {
  const { envios, meta, isLoading, isError, error, filters, setFilters, setPage } =
    useEnviosListWithFilters()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-segal-dark dark:text-white">Historial de Envíos</h1>
        <p className="text-sm text-segal-dark/60 dark:text-gray-400">
          Seguimiento completo de todos los emails y SMS enviados
        </p>
      </div>

      {/* Filters */}
      <EnviosFilters filters={filters} onFiltersChange={setFilters} />

      {/* Stats Summary */}
      {!isLoading && !isError && meta.total > 0 && (
        <div className="flex items-center gap-4 text-sm">
          <Badge variant="outline" className="bg-white dark:bg-gray-800 border-segal-blue/20 dark:border-gray-600 text-segal-dark dark:text-white font-medium px-3 py-1">
            📊 {meta.total} envíos encontrados
          </Badge>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <p className="font-medium text-red-800">Error al cargar envíos</p>
              <p className="text-sm text-red-600">{error?.message || 'Intenta de nuevo más tarde'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card className="border-segal-blue/10">
          <CardContent className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-segal-blue" />
              <p className="text-segal-dark/60">Cargando envíos...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !isError && envios.length === 0 && (
        <Card className="border-segal-blue/10">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-12 w-12 rounded-full bg-segal-blue/10 flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-segal-blue/60" />
            </div>
            <p className="text-segal-dark font-medium">No hay envíos para mostrar</p>
            <p className="text-sm text-segal-dark/60 mt-1">
              Intenta cambiar los filtros o ejecuta un flujo para generar envíos
            </p>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {!isLoading && !isError && envios.length > 0 && (
        <Card className="border-segal-blue/10 dark:border-gray-700 dark:bg-gray-900 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-segal-blue/5 to-transparent dark:from-gray-800 dark:to-gray-900 border-b border-segal-blue/10 dark:border-gray-700 py-4">
            <CardTitle className="text-base font-semibold text-segal-dark dark:text-white flex items-center gap-2">
              <Send className="h-4 w-4 text-segal-blue dark:text-segal-turquoise" />
              Lista de Envíos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                    <TableHead className="font-semibold text-segal-dark/80 dark:text-gray-300 w-[250px]">
                      Destinatario
                    </TableHead>
                    <TableHead className="font-semibold text-segal-dark/80 dark:text-gray-300 w-[80px] text-center">
                      Canal
                    </TableHead>
                    <TableHead className="font-semibold text-segal-dark/80 dark:text-gray-300 w-[120px]">
                      Estado
                    </TableHead>
                    <TableHead className="font-semibold text-segal-dark/80 dark:text-gray-300 w-[180px]">
                      Flujo
                    </TableHead>
                    <TableHead className="font-semibold text-segal-dark/80 dark:text-gray-300 w-[160px]">
                      Fecha de Envío
                    </TableHead>
                    <TableHead className="font-semibold text-segal-dark/80 dark:text-gray-300 w-[80px] text-center">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {envios.map((envio) => {
                    const statusConfig = getStatusConfig(envio.estado)
                    
                    return (
                      <TableRow
                        key={envio.id}
                        className="hover:bg-segal-blue/5 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-700"
                      >
                        {/* Destinatario */}
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-segal-blue/10 dark:bg-segal-blue/20 flex items-center justify-center shrink-0">
                              <span className="text-xs font-semibold text-segal-blue dark:text-segal-turquoise uppercase">
                                {envio.metadata?.destinatario?.charAt(0) || '?'}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-segal-dark dark:text-white truncate max-w-[180px]">
                              {envio.metadata?.destinatario || 'Sin destinatario'}
                            </span>
                          </div>
                        </TableCell>

                        {/* Canal */}
                        <TableCell className="text-center py-3">
                          <div className="flex justify-center">
                            {envio.canal === 'email' ? (
                              <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center" title="Email">
                                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                            ) : (
                              <div className="h-8 w-8 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center" title="SMS">
                                <Smartphone className="h-4 w-4 text-green-600 dark:text-green-400" />
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Estado */}
                        <TableCell className="py-3">
                          <Badge 
                            variant="outline" 
                            className={`${statusConfig.className} gap-1.5 font-medium border`}
                          >
                            {statusConfig.icon}
                            {statusConfig.label}
                          </Badge>
                        </TableCell>

                        {/* Flujo */}
                        <TableCell className="py-3">
                          <span className="text-sm text-segal-dark/70 dark:text-gray-300">
                            {envio.flujo?.nombre || `Flujo #${envio.flujo_id}`}
                          </span>
                        </TableCell>

                        {/* Fecha */}
                        <TableCell className="py-3">
                          <span className="text-sm text-segal-dark/60 dark:text-gray-400">
                            {formatDate(envio.fecha_creacion)}
                          </span>
                        </TableCell>

                        {/* Acciones */}
                        <TableCell className="text-center py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDetail?.(envio.id)}
                            className="h-8 w-8 p-0 hover:bg-segal-blue/10 dark:hover:bg-gray-700"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4 text-segal-blue dark:text-segal-turquoise" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/30">
            <p className="text-sm text-segal-dark/60 dark:text-gray-400">
              Mostrando <span className="font-medium text-segal-dark dark:text-white">{envios.length}</span> de{' '}
              <span className="font-medium text-segal-dark dark:text-white">{meta.total}</span> envíos
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.pagina <= 1}
                onClick={() => setPage(meta.pagina - 1)}
                className="h-8 px-3 border-segal-blue/20 dark:border-gray-600 hover:bg-segal-blue/5 dark:hover:bg-gray-700 dark:text-white"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <div className="flex items-center gap-1 px-3">
                <span className="text-sm font-medium text-segal-dark dark:text-white">{meta.pagina}</span>
                <span className="text-sm text-segal-dark/40 dark:text-gray-500">/</span>
                <span className="text-sm text-segal-dark/60 dark:text-gray-400">{meta.total_paginas || 1}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.pagina >= meta.total_paginas}
                onClick={() => setPage(meta.pagina + 1)}
                className="h-8 px-3 border-segal-blue/20 dark:border-gray-600 hover:bg-segal-blue/5 dark:hover:bg-gray-700 dark:text-white"
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default EnviosList
