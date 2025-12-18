/**
 * Fila individual de la tabla de flujos
 * Renderiza un flujo con sus datos formateados
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
import { MoreHorizontal, Eye, Edit2, Trash2, Play, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import {
  useActiveExecution,
  useLatestExecution,
  useFlowExecutionDetail,
} from '../../hooks/useFlowExecutionTracking'
import type { FlujoNurturing } from '@/types/flujo'

interface FlujoTableRowProps {
  flujo: FlujoNurturing
  onViewFlujo?: (id: number) => void
  onEditFlujo?: (id: number) => void
  onDeleteFlujo?: (id: number) => void
  onEjecutarFlujo?: (flujoId: number) => void
}

// Helper function to get tipo_prospecto name as string
function getTipoProspectoName(tipoProspecto: FlujoNurturing['tipo_prospecto']): string {
  if (typeof tipoProspecto === 'string') {
    return tipoProspecto
  }
  return tipoProspecto?.nombre || '-'
}

export function FlujoTableRow({
  flujo,
  onViewFlujo,
  onEditFlujo,
  onDeleteFlujo,
  onEjecutarFlujo,
}: FlujoTableRowProps) {
  // Obtener ejecución activa del flujo (in_progress o paused)
  const { data: activeExecutionData } = useActiveExecution(flujo.id, true)

  // Obtener última ejecución (cualquier estado) como fallback
  const { data: latestExecutionData } = useLatestExecution(flujo.id, true)

  // Calcular cantidad de etapas desde diferentes fuentes posibles
  // 1. Si existe config_structure.stages (estructura de ReactFlow)
  // 2. Si existe flujo_etapas (relación del backend)
  // 3. Si existe etapas (relación alternativa)
  const etapasCount =
    flujo.config_structure?.stages?.length ||
    flujo.flujo_etapas?.length ||
    flujo.etapas?.length ||
    0

  // Determinar qué ejecución mostrar con prioridad:
  // 1. Ejecución activa (in_progress/paused) - máxima prioridad
  // 2. Última ejecución (in_progress pero esperando próximo nodo programado)
  const hasActiveExecution = activeExecutionData?.tiene_ejecucion_activa || false
  const activeExecution = activeExecutionData?.ejecucion || null

  // Obtener última ejecución si no hay activa
  const latestExecution = latestExecutionData?.data?.[0]

  // Obtener detalles de la última ejecución para calcular progreso
  const latestExecutionId = latestExecution?.id
  const { data: latestExecutionDetail } = useFlowExecutionDetail(
    flujo.id,
    latestExecutionId || 0,
    !hasActiveExecution && !!latestExecutionId, // Solo consultar si no hay activa
  )

  // Calcular progreso desde los detalles de la última ejecución
  const progressFromLatest = latestExecutionDetail?.data?.etapas
    ? (() => {
        const etapas = latestExecutionDetail.data.etapas
        const total = etapas.length
        const completadas = etapas.filter(e => e.estado === 'completed').length
        const en_ejecucion = etapas.filter(e => e.estado === 'executing').length
        const pendientes = etapas.filter(e => e.estado === 'pending').length
        const fallidas = etapas.filter(e => e.estado === 'failed').length

        return {
          porcentaje: total > 0 ? Math.round((completadas / total) * 100) : 0,
          completadas,
          total,
          en_ejecucion,
          pendientes,
          fallidas,
        }
      })()
    : null

  // Determinar ejecución final a mostrar
  const displayExecution = hasActiveExecution
    ? activeExecution
    : latestExecution && progressFromLatest && progressFromLatest.completadas > 0
      ? {
          ...latestExecution,
          progreso: progressFromLatest,
        }
      : null

  // DEBUG: Ver qué retorna el API para cada flujo
  console.log('🔍 [FlujoTableRow] Flujo:', flujo.id, flujo.nombre, {
    tiene_ejecucion_activa: hasActiveExecution,
    activeExecution: activeExecution,
    latestExecution: latestExecution,
    progressFromLatest: progressFromLatest,
    displayExecution: displayExecution,
  })

  return (
    <TableRow className="hover:bg-segal-blue/5 border-b border-segal-blue/5 dark:border-segal-blue">
      <TableCell className="font-medium text-segal-dark dark:text-gray-300">{flujo.nombre}</TableCell>
      <TableCell className="text-segal-dark/70 dark:text-gray-300">
        {getTipoProspectoName(flujo.tipo_prospecto)}
      </TableCell>
      <TableCell className="text-segal-dark">
        <Badge variant="outline" className="border-segal-blue/30 text-segal-blue dark:text-gray-300">
          {etapasCount} etapas
        </Badge>
      </TableCell>

      {/* Columna de Progreso */}
      <TableCell className="min-w-[150px]">
        {displayExecution ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    displayExecution.estado === 'in_progress'
                      ? 'bg-blue-500'
                      : displayExecution.estado === 'paused'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${displayExecution.progreso?.porcentaje || 0}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-segal-dark/70 min-w-[35px]">
                {displayExecution.progreso?.porcentaje || 0}%
              </span>
            </div>
            <div className="flex items-center gap-1">
              {displayExecution.estado === 'in_progress' && (
                <>
                  <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />
                  <span className="text-xs text-blue-600">
                    {displayExecution.progreso
                      ? `${displayExecution.progreso.completadas}/${displayExecution.progreso.total} etapas`
                      : 'En progreso'}
                  </span>
                </>
              )}
              {displayExecution.estado === 'paused' && (
                <span className="text-xs text-yellow-600">
                  {displayExecution.progreso
                    ? `Pausada (${displayExecution.progreso.completadas}/${displayExecution.progreso.total})`
                    : 'Pausada'}
                </span>
              )}
              {displayExecution.estado === 'completed' && (
                <span className="text-xs text-green-600">
                  {displayExecution.progreso
                    ? `Completada (${displayExecution.progreso.completadas}/${displayExecution.progreso.total})`
                    : 'Completada'}
                </span>
              )}
            </div>
          </div>
        ) : (
          <span className="text-xs text-segal-dark/40">Sin ejecución</span>
        )}
      </TableCell>

      <TableCell>
        <Badge
          variant={flujo.activo ? 'default' : 'outline'}
          className={
            flujo.activo
              ? 'bg-segal-green text-white'
              : 'border-segal-red/30 text-segal-red'
          }
        >
          {flujo.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      </TableCell>
      <TableCell className="text-segal-dark/70 text-sm dark:text-gray-300">
        {flujo.user?.name || '-'}
      </TableCell>
      <TableCell className="text-segal-dark/70 text-sm dark:text-gray-300">
        {formatDate(flujo.created_at)}
      </TableCell>
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
                onClick={() => onEjecutarFlujo(flujo.id)}
                className="cursor-pointer"
              >
                <Play className="h-4 w-4 text-segal-green mr-2" />
                <span className="text-segal-dark">Ejecutar Flujo</span>
              </DropdownMenuItem>
            )}
            {onViewFlujo && (
              <DropdownMenuItem
                onClick={() => onViewFlujo(flujo.id)}
                className="cursor-pointer"
              >
                <Eye className="h-4 w-4 text-segal-blue mr-2" />
                <span className="text-segal-dark">Ver detalles</span>
              </DropdownMenuItem>
            )}
            {onEditFlujo && (
              <DropdownMenuItem
                onClick={() => onEditFlujo(flujo.id)}
                className="cursor-pointer"
              >
                <Edit2 className="h-4 w-4 text-segal-blue mr-2" />
                <span className="text-segal-dark">Editar</span>
              </DropdownMenuItem>
            )}
            {onDeleteFlujo && (
              <DropdownMenuItem
                onClick={() => onDeleteFlujo(flujo.id)}
                className="cursor-pointer"
                variant="destructive"
              >
                <Trash2 className="h-4 w-4 text-segal-red mr-2" />
                <span className="text-segal-red">Eliminar</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}
