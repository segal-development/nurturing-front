/**
 * BatchingProgress Component
 * Shows real-time progress of batch email sends
 *
 * Features:
 * - Overall progress bar with percentage
 * - Per-batch status cards
 * - Estimated completion time
 * - Auto-refresh every 5 seconds
 */

import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Layers,
  Loader2,
  Package,
  Users,
} from 'lucide-react'
import { useBatchingStatus } from '@/features/envios/hooks'
import type { BatchInfo, BatchingSummary } from '@/types/flowExecution'

interface BatchingProgressProps {
  flujoId: number
  ejecucionId: string
}

/**
 * Status badge component for batch items
 */
function BatchStatusBadge({ status }: { status: BatchInfo['status'] }) {
  const config = {
    pending: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-700 dark:text-yellow-400',
      label: 'Pendiente',
      icon: <Clock className="h-3 w-3" />,
    },
    completed: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-400',
      label: 'Completado',
      icon: <CheckCircle className="h-3 w-3" />,
    },
    failed: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-400',
      label: 'Fallido',
      icon: <AlertCircle className="h-3 w-3" />,
    },
  }

  const { bg, text, label, icon } = config[status]

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${bg} ${text}`}>
      {icon}
      {label}
    </span>
  )
}

/**
 * Summary card for overall batching progress
 */
function BatchingSummaryCard({ summary }: { summary: BatchingSummary }) {
  if (summary.status === 'none' || !summary.batches) {
    return null
  }

  const progressPercentage = summary.batches.percentage

  return (
    <Card className="dark:bg-slate-900 dark:border-slate-700 border-l-4 border-l-segal-blue">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-segal-dark dark:text-white">
          <Layers className="h-5 w-5 text-segal-blue" />
          Progreso de Batching
        </CardTitle>
        <CardDescription className="dark:text-slate-400">
          Envío dividido en {summary.batches.total} lotes para evitar sobrecarga
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-segal-dark dark:text-white">
              {progressPercentage}% completado
            </span>
            <span className="text-sm text-segal-dark/60 dark:text-slate-400">
              {summary.batches.completed} / {summary.batches.total} lotes
            </span>
          </div>
          <div className="w-full bg-segal-blue/10 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-segal-blue to-segal-turquoise h-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
              role="progressbar"
              aria-valuenow={summary.batches.completed}
              aria-valuemin={0}
              aria-valuemax={summary.batches.total}
            />
          </div>
        </div>

        {/* Stats Grid */}
        {summary.prospectos && (
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center">
              <p className="text-xs text-segal-dark/60 dark:text-slate-400">Total</p>
              <p className="text-lg font-bold text-segal-dark dark:text-white">
                {summary.prospectos.total.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-green-600 dark:text-green-400">Enviados</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {summary.prospectos.enviados.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-yellow-600 dark:text-yellow-400">Pendientes</p>
              <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                {summary.prospectos.pendientes.toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Individual batch item in the list
 */
function BatchItem({ batch }: { batch: BatchInfo }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-segal-blue/10 dark:bg-slate-700 flex items-center justify-center">
          <Package className="h-4 w-4 text-segal-blue dark:text-segal-turquoise" />
        </div>
        <div>
          <p className="text-sm font-medium text-segal-dark dark:text-white">
            Lote #{batch.batch_number}
          </p>
          <p className="text-xs text-segal-dark/60 dark:text-slate-400 flex items-center gap-1">
            <Users className="h-3 w-3" />
            {batch.prospectos_count.toLocaleString()} prospectos
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {batch.completed_at && (
          <span className="text-xs text-segal-dark/60 dark:text-slate-400">
            {format(new Date(batch.completed_at), 'HH:mm:ss', { locale: es })}
          </span>
        )}
        <BatchStatusBadge status={batch.status} />
      </div>
    </div>
  )
}

/**
 * Main BatchingProgress component
 */
export function BatchingProgress({ flujoId, ejecucionId }: BatchingProgressProps) {
  const { data, isLoading, isError, error } = useBatchingStatus(flujoId, ejecucionId)

  // Loading state
  if (isLoading) {
    return (
      <Card className="dark:bg-slate-900 dark:border-slate-700">
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-segal-blue" />
            <p className="text-sm text-segal-dark/70 dark:text-slate-400">
              Cargando estado de batching...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (isError) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900">
        <CardContent className="py-4">
          <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error?.message || 'Error al cargar estado de batching'}
          </p>
        </CardContent>
      </Card>
    )
  }

  // No batching active
  if (!data?.data.has_batching) {
    return null // Don't render anything if no batching
  }

  const { resumen, etapas } = data.data

  // Get all batches from all etapas
  const allBatches = etapas?.flatMap((etapa) => etapa.batches || []) || []

  // Get estimated completion from first etapa with timing
  const estimatedCompletion = etapas?.find((e) => e.timing?.estimated_completion)?.timing?.estimated_completion

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      {resumen && <BatchingSummaryCard summary={resumen} />}

      {/* Estimated Completion */}
      {estimatedCompletion && resumen?.status === 'in_progress' && (
        <div className="flex items-center gap-2 text-sm p-3 bg-segal-blue/5 dark:bg-slate-800 rounded-lg">
          <Clock className="h-4 w-4 text-segal-blue dark:text-segal-turquoise" />
          <span className="text-segal-dark dark:text-slate-300">
            Finaliza aproximadamente{' '}
            <strong>
              {formatDistanceToNow(new Date(estimatedCompletion), {
                addSuffix: true,
                locale: es,
              })}
            </strong>
          </span>
        </div>
      )}

      {/* Batches List */}
      {allBatches.length > 0 && (
        <Card className="dark:bg-slate-900 dark:border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-segal-dark dark:text-white">
              Detalle de Lotes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {allBatches.map((batch) => (
                <BatchItem key={batch.batch_number} batch={batch} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default BatchingProgress
