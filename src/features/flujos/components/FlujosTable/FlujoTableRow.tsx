/**
 * Fila individual de la tabla de flujos
 * Refactored following SOLID principles, early returns, and clean architecture
 *
 * Key improvements:
 * - Single Responsibility: Each function/component has one clear purpose
 * - Open/Closed: Extensible through composition
 * - Liskov Substitution: Uses interfaces and abstractions
 * - Interface Segregation: Small, focused interfaces
 * - Dependency Inversion: Depends on abstractions (hooks, utils)
 * - Early returns for better readability
 * - Type-safe with strict TypeScript
 */

import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Edit2, Eye, MoreHorizontal, Play, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { FlujoNurturing } from '@/types/flujo'
import { useFlujoExecutionState } from './hooks/useFlujoExecutionState'
import { getTipoProspectoName, calculateStagesCount } from './utils/flujoTableHelpers'
import { ProgressDisplay, NoExecutionDisplay } from './ProgressDisplay'
import { formatCurrency } from '@/features/costos/hooks'

interface FlujoTableRowProps {
  flujo: FlujoNurturing
  onViewFlujo?: (id: number) => void
  onEditFlujo?: (id: number) => void
  onDeleteFlujo?: (id: number) => void
  onEjecutarFlujo?: (flujoId: number) => void
}

/**
 * Renders the nombre cell
 */
function NombreCell({ nombre }: { nombre: string }) {
  return (
    <TableCell className="font-medium text-segal-dark dark:text-gray-300">{nombre}</TableCell>
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
 */
function ProgressCell({ flujoId }: { flujoId: number }) {
  const { displayExecution } = useFlujoExecutionState(flujoId)

  // Early return: no execution to display
  if (!displayExecution) {
    return (
      <TableCell className="min-w-[150px]">
        <NoExecutionDisplay />
      </TableCell>
    )
  }

  return (
    <TableCell className="min-w-[150px]">
      <ProgressDisplay estado={displayExecution.estado} progreso={displayExecution.progreso} />
    </TableCell>
  )
}

/**
 * Renders the cost cell from latest execution
 */
function CostoCell({ flujoId }: { flujoId: number }) {
  const { displayExecution } = useFlujoExecutionState(flujoId)

  // Early return: no execution
  if (!displayExecution) {
    return (
      <TableCell className="text-segal-dark/50 text-sm">
        -
      </TableCell>
    )
  }

  const costo = displayExecution.costo_real ?? displayExecution.costo_estimado
  const isEstimated = displayExecution.costo_real === null && displayExecution.costo_estimado !== null

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
  onEjecutarFlujo,
  onViewFlujo,
  onEditFlujo,
  onDeleteFlujo,
}: {
  flujoId: number
  canExecute: boolean
  isExecuting: boolean
  onEjecutarFlujo?: (id: number) => void
  onViewFlujo?: (id: number) => void
  onEditFlujo?: (id: number) => void
  onDeleteFlujo?: (id: number) => void
}) {
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
              <span className="text-segal-dark">
                {canExecute ? 'Ejecutar Flujo' : 'En ejecución...'}
              </span>
            </DropdownMenuItem>
          )}
          {onViewFlujo && (
            <DropdownMenuItem onClick={() => onViewFlujo(flujoId)} className="cursor-pointer">
              <Eye className="h-4 w-4 text-segal-blue mr-2" />
              <span className="text-segal-dark">Ver detalles</span>
            </DropdownMenuItem>
          )}
          {onEditFlujo && (
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
                {isExecuting ? 'En ejecución...' : 'Eliminar'}
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
 * Refactored with:
 * - SOLID principles
 * - Early returns
 * - Small, focused functions
 * - Descriptive names
 * - Type safety
 * - Proper separation of concerns
 */
export function FlujoTableRow({
  flujo,
  onViewFlujo,
  onEditFlujo,
  onDeleteFlujo,
  onEjecutarFlujo,
}: FlujoTableRowProps) {
  // Get execution state (includes canExecute logic)
  const { canExecute, displayExecution } = useFlujoExecutionState(flujo.id)

  // Calculate stages count
  const etapasCount = calculateStagesCount(flujo)

  // Check if flow is currently executing (in_progress or paused)
  const isExecuting = displayExecution?.estado === 'in_progress' || displayExecution?.estado === 'paused'

  return (
    <TableRow className="hover:bg-segal-blue/5 border-b border-segal-blue/5 dark:border-segal-blue">
      <NombreCell nombre={flujo.nombre} />
      <TipoProspectoCell tipoProspecto={flujo.tipo_prospecto} />
      <StagesCell count={etapasCount} />
      <ProgressCell flujoId={flujo.id} />
      <CostoCell flujoId={flujo.id} />
      <StatusCell activo={flujo.activo} />
      <UserCell userName={flujo.user?.name} />
      <CreatedDateCell createdAt={flujo.created_at} />
      <ActionsCell
        flujoId={flujo.id}
        canExecute={canExecute}
        isExecuting={isExecuting}
        onEjecutarFlujo={onEjecutarFlujo}
        onViewFlujo={onViewFlujo}
        onEditFlujo={onEditFlujo}
        onDeleteFlujo={onDeleteFlujo}
      />
    </TableRow>
  )
}
