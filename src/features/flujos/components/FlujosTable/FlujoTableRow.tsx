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
import { MoreHorizontal, Eye, Edit2, Trash2, Play } from 'lucide-react'
import { formatDate } from '@/lib/utils'
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
  // Calcular cantidad de etapas desde diferentes fuentes posibles
  // 1. Si existe config_structure.stages (estructura de ReactFlow)
  // 2. Si existe flujo_etapas (relación del backend)
  // 3. Si existe etapas (relación alternativa)
  const etapasCount =
    flujo.config_structure?.stages?.length ||
    flujo.flujo_etapas?.length ||
    flujo.etapas?.length ||
    0

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
