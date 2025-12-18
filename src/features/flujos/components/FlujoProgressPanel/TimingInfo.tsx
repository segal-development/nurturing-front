/**
 * Componente para mostrar información de tiempos
 * Reutilizable y type-safe
 */

import { Clock, CheckCircle } from 'lucide-react'

interface TimingInfoProps {
  /**
   * Fecha de inicio programada o real (ISO string)
   */
  startDate: string | null

  /**
   * Fecha de finalización (ISO string o null si no está completado)
   */
  endDate: string | null
}

/**
 * Formatea una fecha ISO al formato localizado
 * Retorna string legible o null si la fecha es inválida
 */
function formatDate(isoDate: string | null): string | null {
  if (!isoDate) return null

  try {
    const date = new Date(isoDate)

    // Validar que la fecha sea válida
    if (isNaN(date.getTime())) return null

    return date.toLocaleString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/Santiago',
    })
  } catch {
    return null
  }
}

export function TimingInfo({ startDate, endDate }: TimingInfoProps) {
  const formattedStartDate = formatDate(startDate)
  const formattedEndDate = formatDate(endDate)

  return (
    <div className="space-y-3">
      {/* Fecha de inicio */}
      {formattedStartDate && (
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-segal-blue shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-segal-dark/70 dark:text-white/60">Inicio</p>
            <p className="text-sm font-medium text-segal-dark dark:text-white">{formattedStartDate}</p>
          </div>
        </div>
      )}

      {/* Fecha de finalización */}
      {formattedEndDate && (
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-segal-dark/70 dark:text-white/60">Finalización</p>
            <p className="text-sm font-medium text-segal-dark dark:text-white">{formattedEndDate}</p>
          </div>
        </div>
      )}

      {/* Mensaje si aún no finaliza */}
      {!formattedEndDate && formattedStartDate && (
        <div className="text-sm text-segal-blue/70 italic">Ejecución en progreso...</div>
      )}
    </div>
  )
}
