/**
 * Componente para mostrar barra de progreso
 * Reutilizable y type-safe
 */

interface ProgressBarProps {
  /**
   * Porcentaje completado (0-100)
   */
  percentage: number

  /**
   * Cantidad actual procesada
   */
  currentCount: number

  /**
   * Cantidad total
   */
  totalCount: number
}

export function ProgressBar({ percentage, currentCount, totalCount }: ProgressBarProps) {
  // Asegurar que el porcentaje está entre 0-100
  const safePercentage = Math.min(100, Math.max(0, percentage))

  return (
    <div className="space-y-4">
      {/* Encabezado con porcentaje */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-segal-dark">Progreso General</h3>
        <span className="text-2xl font-bold text-segal-blue">{safePercentage}%</span>
      </div>

      {/* Barra de progreso */}
      <div className="w-full bg-segal-blue/10 rounded-full h-3 overflow-hidden">
        <div
          className="bg-segal-blue h-full transition-all duration-300"
          style={{ width: `${safePercentage}%` }}
        />
      </div>

      {/* Descripción con números */}
      <div className="text-sm text-segal-dark/70 dark:text-white/60">
        {currentCount} de {totalCount} prospectos procesados
      </div>
    </div>
  )
}
