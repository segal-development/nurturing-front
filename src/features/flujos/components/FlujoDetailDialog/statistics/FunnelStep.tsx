/**
 * Funnel step component for visualizing conversion funnel stages
 * Shows value, optional rate percentage, and connector to next step
 */

import { TrendingDown } from 'lucide-react'

export interface FunnelStepProps {
  label: string
  value: number
  /** Percentage rate to display below the step (optional) */
  rate?: number
  /** Whether this is the last step in the funnel (hides connector) */
  isLast?: boolean
  /** Tailwind background color class (e.g., 'bg-segal-blue') */
  color: string
}

export function FunnelStep({
  label,
  value,
  rate,
  isLast = false,
  color,
}: FunnelStepProps) {
  return (
    <div className="flex items-center">
      <div className="flex flex-col items-center">
        <div className={`w-24 h-16 ${color} rounded-lg flex flex-col items-center justify-center text-white shadow-md`}>
          <span className="text-lg font-bold">{value.toLocaleString()}</span>
          <span className="text-xs opacity-90">{label}</span>
        </div>
        {rate !== undefined && (
          <span className="text-xs text-segal-dark/60 mt-1 font-medium">{rate}%</span>
        )}
      </div>
      {!isLast && (
        <div className="flex items-center mx-2">
          <div className="w-8 h-0.5 bg-segal-blue/30" />
          <TrendingDown className="h-4 w-4 text-segal-blue/40 -ml-1" />
        </div>
      )}
    </div>
  )
}
