/**
 * Fila individual de la tabla de prospectos
 * Renderiza un prospecto con sus datos formateados
 */

import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ESTADO_PROSPECTO_OPTIONS,
  ESTADO_PROSPECTO_COLORS,
  TIPO_DEUDA_OPTIONS,
  TIPO_DEUDA_COLORS,
} from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { getMontoCategoryKey } from '../../utils/getMontoCategoryKey'
import type { Prospecto } from '../../types/prospectos'

interface ProspectoTableRowProps {
  prospecto: Prospecto
  onViewProspecto?: (id: number) => void
}

export function ProspectoTableRow({ prospecto, onViewProspecto }: ProspectoTableRowProps) {
  const montoCategory = getMontoCategoryKey(prospecto.monto_deuda)

  return (
    <TableRow className="hover:bg-segal-blue/5 border-b border-segal-blue/5">
      <TableCell className="font-medium text-segal-dark">{prospecto.nombre}</TableCell>
      <TableCell className="text-segal-dark/70 text-sm">{prospecto.email}</TableCell>
      <TableCell className="text-segal-dark/70">{prospecto.telefono || '-'}</TableCell>
      <TableCell className="font-medium text-segal-dark">
        ${prospecto.monto_deuda.toLocaleString('es-CL')}
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={ESTADO_PROSPECTO_COLORS[prospecto.estado as keyof typeof ESTADO_PROSPECTO_COLORS]}
        >
          {ESTADO_PROSPECTO_OPTIONS.find((o) => o.value === prospecto.estado)?.label}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className={TIPO_DEUDA_COLORS[montoCategory as keyof typeof TIPO_DEUDA_COLORS]}>
          {TIPO_DEUDA_OPTIONS.find((o) => o.value === montoCategory)?.label}
        </Badge>
      </TableCell>
      <TableCell className="text-segal-dark/70 text-sm">
        {prospecto.fecha_ultimo_contacto ? formatDate(prospecto.fecha_ultimo_contacto) : '-'}
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="sm"
          className="text-segal-blue hover:bg-segal-blue/10"
          onClick={() => onViewProspecto?.(prospecto.id)}
        >
          Ver
        </Button>
      </TableCell>
    </TableRow>
  )
}
