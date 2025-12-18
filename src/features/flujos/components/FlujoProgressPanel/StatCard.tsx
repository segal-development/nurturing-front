/**
 * Componente reutilizable para mostrar estadísticas
 * Sigue Single Responsibility: solo renderiza un stat
 * Props bien tipados, nombre descriptivo
 */

import type { ReactNode } from 'react'

interface StatCardProps {
  /**
   * Icono a mostrar (JSX)
   */
  icon: ReactNode

  /**
   * Etiqueta descriptiva
   */
  label: string

  /**
   * Valor principal (usualmente número grande)
   */
  value: number | string

  /**
   * Clase CSS para color de fondo y bordes
   */
  colorClassName: string

  /**
   * Clase CSS para el ícono (opcional)
   */
  iconClassName?: string
}

export function StatCard({
  icon,
  label,
  value,
  colorClassName,
  iconClassName = '',
}: StatCardProps) {
  return (
    <div className={`rounded-lg p-4 border ${colorClassName} dark:bg-slate-800 dark:border-slate-700`}>
      {/* Encabezado con ícono y label */}
      <div className="flex items-center gap-2 mb-1">
        <div className={iconClassName}>{icon}</div>
        <p className="text-xs font-medium text-segal-dark dark:text-white/80">{label}</p>
      </div>

      {/* Valor principal */}
      <p className="text-2xl font-bold text-segal-dark dark:text-white">{value}</p>
    </div>
  )
}
