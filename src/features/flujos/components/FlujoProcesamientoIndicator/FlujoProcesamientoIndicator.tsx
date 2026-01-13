/**
 * Indicador de progreso para asignación de prospectos a flujos.
 *
 * Muestra el estado actual cuando hay un flujo procesando la asignación
 * de prospectos en background. Se puede usar como:
 * - Componente inline dentro de un modal
 * - Componente flotante en la UI global
 *
 * @example
 * // Inline en modal
 * <FlujoProcesamientoIndicator variant="inline" />
 *
 * // Flotante global
 * <FlujoProcesamientoIndicator variant="floating" />
 */

import { Loader2, CheckCircle, XCircle, Clock, Users } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { useFlujoProcesainientoStatus } from '../../hooks/useFlujoProcesamiento'
import type { EstadoProcesamientoFlujo } from '@/types/flujoAsignacion'
import {
  formatTiempoRestante,
  formatVelocidadProcesamiento,
  getEstadoProcesamientoConfig,
} from '@/types/flujoAsignacion'
import { cn } from '@/lib/utils'

// =============================================================================
// TIPOS
// =============================================================================

export interface FlujoProcesamientoIndicatorProps {
  /** Variante de visualización */
  variant?: 'inline' | 'floating' | 'compact'
  /** Clase CSS adicional */
  className?: string
  /** Mostrar aunque no haya flujo activo (estado vacío) */
  showEmpty?: boolean
}

// =============================================================================
// SUB-COMPONENTES
// =============================================================================

function EstadoIcon({ estado }: { estado: EstadoProcesamientoFlujo }) {
  const config = getEstadoProcesamientoConfig(estado)

  const iconProps = {
    className: cn('h-5 w-5', config.colorClass, config.animate && 'animate-spin'),
  }

  switch (config.icon) {
    case 'loader':
      return <Loader2 {...iconProps} />
    case 'check':
      return <CheckCircle {...iconProps} />
    case 'x':
      return <XCircle {...iconProps} />
    case 'clock':
    default:
      return <Clock {...iconProps} />
  }
}

function BarraProgreso({
  porcentaje,
  estado,
}: {
  porcentaje: number
  estado: EstadoProcesamientoFlujo
}) {
  const config = getEstadoProcesamientoConfig(estado)

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className={config.colorClass}>{config.label}</span>
        <span className="font-medium text-segal-dark">{porcentaje.toFixed(1)}%</span>
      </div>
      <Progress value={porcentaje} className="h-2" />
    </div>
  )
}

function DetallesProgreso({
  procesados,
  total,
  velocidad,
  tiempoRestante,
}: {
  procesados: number
  total: number
  velocidad: number
  tiempoRestante: number | null
}) {
  const formatNum = (n: number) => n.toLocaleString('es-CL')

  return (
    <div className="flex items-center gap-4 text-xs text-segal-dark/70">
      <div className="flex items-center gap-1">
        <Users className="h-3.5 w-3.5" />
        <span>
          {formatNum(procesados)} / {formatNum(total)}
        </span>
      </div>

      {velocidad > 0 && (
        <div className="flex items-center gap-1">
          <span>⚡</span>
          <span>{formatVelocidadProcesamiento(velocidad)}</span>
        </div>
      )}

      {tiempoRestante !== null && tiempoRestante > 0 && (
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          <span>~{formatTiempoRestante(tiempoRestante)}</span>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// VARIANTES
// =============================================================================

function IndicatorInline({
  flujoActivo,
  className,
}: {
  flujoActivo: NonNullable<ReturnType<typeof useFlujoProcesainientoStatus>['flujoActivo']>
  className?: string
}) {
  const { estado, progreso, mensaje, flujoNombre } = flujoActivo
  const config = getEstadoProcesamientoConfig(estado)

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        config.bgClass,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <EstadoIcon estado={estado} />

        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <h4 className="font-medium text-segal-dark truncate">
              {flujoNombre}
            </h4>
            <p className="text-sm text-segal-dark/70">{mensaje}</p>
          </div>

          <BarraProgreso porcentaje={progreso.porcentaje} estado={estado} />

          {estado === 'procesando' && (
            <DetallesProgreso
              procesados={progreso.procesados}
              total={progreso.total}
              velocidad={progreso.velocidad_por_segundo}
              tiempoRestante={progreso.segundos_restantes_estimados}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function IndicatorFloating({
  flujoActivo,
  className,
}: {
  flujoActivo: NonNullable<ReturnType<typeof useFlujoProcesainientoStatus>['flujoActivo']>
  className?: string
}) {
  const { estado, progreso, flujoNombre } = flujoActivo
  const config = getEstadoProcesamientoConfig(estado)

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50',
        'w-80 rounded-lg border bg-white shadow-lg',
        'animate-in slide-in-from-bottom-4',
        className
      )}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <EstadoIcon estado={estado} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-segal-dark truncate">
              {flujoNombre}
            </p>
            <p className={cn('text-xs', config.colorClass)}>
              {config.description}
            </p>
          </div>
        </div>

        <BarraProgreso porcentaje={progreso.porcentaje} estado={estado} />

        {estado === 'procesando' && (
          <div className="text-xs text-segal-dark/60">
            {progreso.procesados.toLocaleString('es-CL')} de{' '}
            {progreso.total.toLocaleString('es-CL')} prospectos
          </div>
        )}
      </div>
    </div>
  )
}

function IndicatorCompact({
  flujoActivo,
  className,
}: {
  flujoActivo: NonNullable<ReturnType<typeof useFlujoProcesainientoStatus>['flujoActivo']>
  className?: string
}) {
  const { estado, progreso } = flujoActivo
  const config = getEstadoProcesamientoConfig(estado)

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md border px-3 py-1.5',
        config.bgClass,
        className
      )}
    >
      <EstadoIcon estado={estado} />
      <span className="text-sm font-medium">{progreso.porcentaje.toFixed(0)}%</span>
      <Progress value={progreso.porcentaje} className="h-1.5 w-20" />
    </div>
  )
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function FlujoProcesamientoIndicator({
  variant = 'inline',
  className,
  showEmpty = false,
}: FlujoProcesamientoIndicatorProps) {
  const { flujoActivo, hayFlujoActivo } = useFlujoProcesainientoStatus()

  // Early return si no hay flujo activo
  if (!hayFlujoActivo || !flujoActivo) {
    if (!showEmpty) return null

    return (
      <div className={cn('text-sm text-segal-dark/50 italic', className)}>
        No hay flujos procesando
      </div>
    )
  }

  // Renderizar variante correspondiente
  switch (variant) {
    case 'floating':
      return <IndicatorFloating flujoActivo={flujoActivo} className={className} />
    case 'compact':
      return <IndicatorCompact flujoActivo={flujoActivo} className={className} />
    case 'inline':
    default:
      return <IndicatorInline flujoActivo={flujoActivo} className={className} />
  }
}

// Export por defecto
export default FlujoProcesamientoIndicator
