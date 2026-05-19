/**
 * Fila individual de la tabla de flujos
 * Refactored following SOLID principles, early returns, and clean architecture
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - React.memo to prevent unnecessary re-renders
 * - Execution state received as prop from batch fetch (no hook call per row!)
 * - Before: 15 rows = 45 requests. After: 15 rows = 0 requests (batch in parent)
 */

import { memo } from 'react'
import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Edit2, Eye, Loader2, MoreHorizontal, Play, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { FlujoNurturing } from '@/types/flujo'
import type { BatchExecutionState } from '../../hooks/useBatchExecutionState'
import { getTipoProspectoName, calculateStagesCount } from './utils/flujoTableHelpers'
import { ProgressDisplay, NoExecutionDisplay } from './ProgressDisplay'
import { formatCurrency } from '@/features/costos/hooks'
import { getEstadoProcesamientoConfig, isProcesamientoActivo } from '@/types/flujoAsignacion'

interface FlujoTableRowProps {
  flujo: FlujoNurturing
  /** Execution state from batch API (passed from parent) */
  executionState: BatchExecutionState
  /** Loading state from batch fetch */
  isLoadingExecution: boolean
  onViewFlujo?: (id: number) => void
  onEditFlujo?: (id: number) => void
  onDeleteFlujo?: (id: number) => void
  onEjecutarFlujo?: (flujoId: number) => void
}

/**
 * Badge de estado de procesamiento de asignación de prospectos
 */
function ProcesamientoBadge({ estado }: { estado?: FlujoNurturing['estado_procesamiento'] }) {
  // Early return: no mostrar si no hay estado o ya completó
  if (!estado || estado === 'completado') return null

  const config = getEstadoProcesamientoConfig(estado)

  return (
    <Badge
      variant="outline"
      className={`text-xs py-0 px-1.5 ${config.bgClass} ${config.colorClass} border`}
    >
      {config.animate && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
      {config.label}
    </Badge>
  )
}

/**
 * Renders the nombre cell with optional procesamiento and perpetuo badges
 */
function NombreCell({
  nombre,
  estadoProcesamiento,
  esPerpetuo,
}: {
  nombre: string
  estadoProcesamiento?: FlujoNurturing['estado_procesamiento']
  esPerpetuo?: boolean
}) {
  return (
    <TableCell className="font-medium text-segal-dark dark:text-gray-300">
      <div className="flex items-center gap-2">
        <span>{nombre}</span>
        {esPerpetuo && (
          <Badge className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 text-xs">
            ♾️ Perpetuo
          </Badge>
        )}
        <ProcesamientoBadge estado={estadoProcesamiento} />
      </div>
    </TableCell>
  )
}

/**
 * Renders the tipo prospecto cell
 */
function TipoProspectoCell({ tipoProspecto }: { tipoProspecto: FlujoNurturing['tipo_prospecto'] }) {
  return (
    <TableCell className="text-segal-dark/70 dark:text-gray-300">
      {getTipoProspectoName(tipoProspecto)}
    </TableCell>
  )
}

/**
 * Renders the stages count badge cell
 */
function StagesCell({ count }: { count: number }) {
  return (
    <TableCell className="text-segal-dark">
      <Badge variant="outline" className="border-segal-blue/30 text-segal-blue dark:text-gray-300">
        {count} etapas
      </Badge>
    </TableCell>
  )
}

/**
 * Renders the progress cell with execution state
 * OPTIMIZED: Receives execution state as prop from batch API (no hook call per row!)
 */
function ProgressCell({
  executionState,
  isLoading,
  esPerpetuo,
}: {
  executionState: BatchExecutionState
  isLoading: boolean
  esPerpetuo: boolean
}) {
  // Show spinner while loading
  if (isLoading) {
    return (
      <TableCell className="min-w-[150px]">
        <div className="flex items-center gap-2 text-segal-dark/40">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Cargando...</span>
        </div>
      </TableCell>
    )
  }

  // Early return: no execution to display
  if (!executionState.tiene_ejecucion || !executionState.ejecucion) {
    return (
      <TableCell className="min-w-[150px]">
        <NoExecutionDisplay />
      </TableCell>
    )
  }

  // Map batch API progress to ExecutionProgress format expected by ProgressDisplay
  const batchProgreso = executionState.ejecucion.progreso
  const progreso = {
    porcentaje: batchProgreso.porcentaje,
    completadas: batchProgreso.completadas,
    total: batchProgreso.total,
    fallidas: batchProgreso.fallidas,
    // These fields are not in batch API but required by type - calculate from totals
    en_ejecucion: 0, // Could be derived from etapas if needed
    pendientes: batchProgreso.total - batchProgreso.completadas - batchProgreso.fallidas,
  }

  return (
    <TableCell className="min-w-[150px]">
      <ProgressDisplay
        estado={executionState.ejecucion.estado}
        progreso={progreso}
        esPerpetuo={esPerpetuo}
      />
    </TableCell>
  )
}

/**
 * Renders the cost cell from latest execution
 * OPTIMIZED: Receives execution state as prop from batch API (no hook call per row!)
 */
function CostoCell({ 
  executionState, 
  isLoading 
}: { 
  executionState: BatchExecutionState
  isLoading: boolean 
}) {
  // Show spinner while loading
  if (isLoading) {
    return (
      <TableCell>
        <Loader2 className="h-4 w-4 animate-spin text-segal-dark/40" />
      </TableCell>
    )
  }

  // Early return: no execution
  if (!executionState.tiene_ejecucion || !executionState.ejecucion) {
    return (
      <TableCell className="text-segal-dark/50 text-sm">
        -
      </TableCell>
    )
  }

  const ejecucion = executionState.ejecucion
  const costo = ejecucion.costo_real ?? ejecucion.costo_estimado
  const isEstimated = ejecucion.costo_real === null && ejecucion.costo_estimado !== null

  if (costo === null || costo === undefined) {
    return (
      <TableCell className="text-segal-dark/50 text-sm">
        -
      </TableCell>
    )
  }

  return (
    <TableCell>
      <div className="flex items-center gap-1.5">
        <span className={`font-medium text-sm ${isEstimated ? 'text-emerald-600/70' : 'text-emerald-700'}`}>
          {formatCurrency(costo)}
        </span>
        {isEstimated && (
          <span className="text-xs text-segal-dark/50">(est.)</span>
        )}
      </div>
    </TableCell>
  )
}

/**
 * Renders the active/inactive status badge cell
 */
function StatusCell({ activo }: { activo: boolean }) {
  return (
    <TableCell>
      <Badge
        variant={activo ? 'default' : 'outline'}
        className={
          activo ? 'bg-segal-green text-white' : 'border-segal-red/30 text-segal-red'
        }
      >
        {activo ? 'Activo' : 'Inactivo'}
      </Badge>
    </TableCell>
  )
}

/**
 * Renders the user name cell
 */
function UserCell({ userName }: { userName?: string }) {
  return (
    <TableCell className="text-segal-dark/70 text-sm dark:text-gray-300">
      {userName || '-'}
    </TableCell>
  )
}

/**
 * Renders the created date cell
 */
function CreatedDateCell({ createdAt }: { createdAt: string }) {
  return (
    <TableCell className="text-segal-dark/70 text-sm dark:text-gray-300">
      {formatDate(createdAt)}
    </TableCell>
  )
}

/**
 * Renders the actions dropdown menu cell
 */
function ActionsCell({
  flujoId,
  canExecute,
  isExecuting,
  isProcessing,
  esPerpetuo,
  onEjecutarFlujo,
  onViewFlujo,
  onEditFlujo,
  onDeleteFlujo,
}: {
  flujoId: number
  canExecute: boolean
  isExecuting: boolean
  isProcessing: boolean
  esPerpetuo: boolean
  onEjecutarFlujo?: (id: number) => void
  onViewFlujo?: (id: number) => void
  onEditFlujo?: (id: number) => void
  onDeleteFlujo?: (id: number) => void
}) {
  // Determine disabled message
  const getExecuteLabel = (): string => {
    if (isProcessing) return 'Asignando prospectos...'
    if (isExecuting) return esPerpetuo ? '♾️ Perpetuo activo' : 'En ejecución...'
    return 'Ejecutar Flujo'
  }

  const deleteLabel = isExecuting ? (esPerpetuo ? '♾️ Perpetuo activo' : 'En ejecución...') : 'Eliminar'

  return (
    <TableCell className="text-right">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-segal-blue/10 text-segal-dark dark:text-gray-300"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-white border border-segal-blue/20">
          {onEjecutarFlujo && (
            <DropdownMenuItem
              onClick={() => onEjecutarFlujo(flujoId)}
              disabled={!canExecute}
              className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="h-4 w-4 text-segal-green mr-2" />
              <span className="text-segal-dark">{getExecuteLabel()}</span>
            </DropdownMenuItem>
          )}
          {onViewFlujo && (
            <DropdownMenuItem onClick={() => onViewFlujo(flujoId)} className="cursor-pointer">
              <Eye className="h-4 w-4 text-segal-blue mr-2" />
              <span className="text-segal-dark">Ver detalles</span>
            </DropdownMenuItem>
          )}
          {/* Ocultar editar si el flujo está en ejecución o es perpetuo */}
          {onEditFlujo && !isExecuting && !esPerpetuo && (
            <DropdownMenuItem onClick={() => onEditFlujo(flujoId)} className="cursor-pointer">
              <Edit2 className="h-4 w-4 text-segal-blue mr-2" />
              <span className="text-segal-dark">Editar</span>
            </DropdownMenuItem>
          )}
          {onDeleteFlujo && (
            <DropdownMenuItem
              onClick={() => !isExecuting && onDeleteFlujo(flujoId)}
              disabled={isExecuting}
              className={`cursor-pointer ${isExecuting ? 'opacity-50 cursor-not-allowed' : ''}`}
              variant="destructive"
            >
              <Trash2 className={`h-4 w-4 mr-2 ${isExecuting ? 'text-gray-400' : 'text-segal-red'}`} />
              <span className={isExecuting ? 'text-gray-400' : 'text-segal-red'}>
                {deleteLabel}
              </span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </TableCell>
  )
}

/**
 * Main FlujoTableRow component
 * Renders a complete row in the flujos table
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - Wrapped with React.memo to prevent re-renders when props haven't changed
 * - Execution state received as prop from parent's batch fetch (no hook call per row!)
 * - Before: 15 rows = 45 requests. After: 15 rows = 0 requests (batch in parent)
 */
export const FlujoTableRow = memo(function FlujoTableRow({
  flujo,
  executionState,
  isLoadingExecution,
  onViewFlujo,
  onEditFlujo,
  onDeleteFlujo,
  onEjecutarFlujo,
}: FlujoTableRowProps) {
  // Calculate stages count
  const etapasCount = calculateStagesCount(flujo)

  // Get execution info from batch state
  const ejecucion = executionState.ejecucion
  const esPerpetuo = flujo.es_perpetuo ?? false

  // Para flujos perpetuos: in_progress, paused, waiting Y completed son estados "vivos"
  // (la ejecución sigue activa esperando nuevos prospectos del sync).
  // Para flujos no perpetuos: solo in_progress y paused cuentan como "en ejecución".
  const estadosActivos = esPerpetuo
    ? ['in_progress', 'paused', 'waiting', 'completed']
    : ['in_progress', 'paused']
  const isExecuting = ejecucion ? estadosActivos.includes(ejecucion.estado) : false

  // Check if flow is still processing prospect assignment
  const isProcesamientoEnCurso = isProcesamientoActivo(flujo.estado_procesamiento ?? 'completado')

  // Flow can only execute if:
  // 1. No active execution (puede_ejecutar from batch API)
  // 2. Prospect assignment is complete (not processing)
  // 3. Not currently in any "alive" state (covers perpetual waiting/completed too)
  const canExecute = executionState.puede_ejecutar && !isProcesamientoEnCurso && !isExecuting

  return (
    <TableRow className="hover:bg-segal-blue/5 border-b border-segal-blue/5 dark:border-segal-blue">
      <NombreCell
        nombre={flujo.nombre}
        estadoProcesamiento={flujo.estado_procesamiento}
        esPerpetuo={flujo.es_perpetuo ?? false}
      />
      <TipoProspectoCell tipoProspecto={flujo.tipo_prospecto} />
      <StagesCell count={etapasCount} />
      <ProgressCell
        executionState={executionState}
        isLoading={isLoadingExecution}
        esPerpetuo={flujo.es_perpetuo ?? false}
      />
      <CostoCell executionState={executionState} isLoading={isLoadingExecution} />
      <StatusCell activo={flujo.activo} />
      <UserCell userName={flujo.user?.name} />
      <CreatedDateCell createdAt={flujo.created_at} />
      <ActionsCell
        flujoId={flujo.id}
        canExecute={canExecute}
        isExecuting={isExecuting}
        isProcessing={isProcesamientoEnCurso}
        esPerpetuo={flujo.es_perpetuo ?? false}
        onEjecutarFlujo={onEjecutarFlujo}
        onViewFlujo={onViewFlujo}
        onEditFlujo={onEditFlujo}
        onDeleteFlujo={onDeleteFlujo}
      />
    </TableRow>
  )
})
