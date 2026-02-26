/**
 * Metric card component for displaying summary statistics
 * Used in the statistics panel to show key performance indicators
 */

export type MetricCardColor = 'blue' | 'green' | 'red' | 'purple' | 'amber'

export interface MetricCardProps {
  label: string
  value: string | number
  suffix?: string
  icon: React.ElementType
  color?: MetricCardColor
  subtext?: string
}

const colorClasses: Record<MetricCardColor, string> = {
  blue: 'from-blue-50 to-blue-100/50 border-blue-200 text-blue-700',
  green: 'from-emerald-50 to-emerald-100/50 border-emerald-200 text-emerald-700',
  red: 'from-red-50 to-red-100/50 border-red-200 text-red-700',
  purple: 'from-purple-50 to-purple-100/50 border-purple-200 text-purple-700',
  amber: 'from-amber-50 to-amber-100/50 border-amber-200 text-amber-700',
}

const iconColorClasses: Record<MetricCardColor, string> = {
  blue: 'text-blue-500',
  green: 'text-emerald-500',
  red: 'text-red-500',
  purple: 'text-purple-500',
  amber: 'text-amber-500',
}

export function MetricCard({ 
  label, 
  value, 
  suffix = '',
  icon: Icon,
  color = 'blue',
  subtext,
}: MetricCardProps) {
  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-4 border`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${iconColorClasses[color]}`} />
        <p className="text-xs font-semibold opacity-80">{label}</p>
      </div>
      <p className="text-2xl font-bold">
        {value}{suffix}
      </p>
      {subtext && (
        <p className="text-xs opacity-60 mt-1">{subtext}</p>
      )}
    </div>
  )
}
