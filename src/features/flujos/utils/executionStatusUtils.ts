/**
 * Utilidades para mapear estados de ejecución
 * Proporciona funciones reutilizables y type-safe
 * Sigue principios SOLID: Single Responsibility
 */

export type ExecutionStatus = 'en_progreso' | 'completado' | 'fallido' | 'pausado'

export type IconType = 'Clock' | 'Loader2' | 'CheckCircle2' | 'XCircle'

export interface IconConfig {
  type: IconType
  colorClass: string
  animate?: boolean
}

/**
 * Mapea estado a etiqueta legible en español
 */
export const getExecutionStatusLabel = (status: ExecutionStatus): string => {
  const statusMap: Record<ExecutionStatus, string> = {
    en_progreso: 'En Progreso',
    completado: 'Completado',
    pausado: 'Pausado',
    fallido: 'Fallido',
  }

  return statusMap[status] || 'Desconocido'
}

/**
 * Mapea estado a clase de color Tailwind
 */
export const getExecutionStatusColorClass = (status: ExecutionStatus): string => {
  const colorMap: Record<ExecutionStatus, string> = {
    en_progreso: 'bg-blue-50 border-blue-200 text-blue-700',
    pausado: 'bg-orange-50 border-orange-200 text-orange-700',
    completado: 'bg-green-50 border-green-200 text-green-700',
    fallido: 'bg-red-50 border-red-200 text-red-700',
  }

  return colorMap[status]
}

/**
 * Mapea estado a configuración de icono
 * Retorna metadata sobre qué icono renderizar
 */
export const getExecutionStatusIconConfig = (status: ExecutionStatus): IconConfig => {
  const iconMap: Record<ExecutionStatus, IconConfig> = {
    en_progreso: { type: 'Loader2', colorClass: 'text-blue-600', animate: true },
    pausado: { type: 'Clock', colorClass: 'text-orange-600', animate: false },
    completado: { type: 'CheckCircle2', colorClass: 'text-green-600', animate: false },
    fallido: { type: 'XCircle', colorClass: 'text-red-600', animate: false },
  }

  return iconMap[status]
}

/**
 * Valida si la ejecución está en estado terminal (no debe continuar actualizando)
 */
export const isTerminalStatus = (status: ExecutionStatus): boolean => {
  return status === 'completado' || status === 'fallido'
}

/**
 * Calcula si debe mostrar el auto-refresh
 */
export const shouldContinueAutoRefresh = (status: ExecutionStatus): boolean => {
  return !isTerminalStatus(status)
}
