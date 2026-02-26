/**
 * Metric card component for displaying summary statistics
 * Used in the statistics panel to show key performance indicators
 * 
 * Colors follow Segal design system where possible:
 * - blue: segal-blue (primary brand color)
 * - green: segal-green (success/conversion)
 * - red: segal-red (error/failure)
 * - purple: segal-turquoise (clicks/engagement - closest Segal alternative)
 * - amber: segal-orange (warning/attention)
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
  blue: 'from-segal-blue/10 to-segal-blue/5 border-segal-blue/30 text-segal-blue',
  green: 'from-segal-green/10 to-segal-green/5 border-segal-green/30 text-segal-green',
  red: 'from-segal-red/10 to-segal-red/5 border-segal-red/30 text-segal-red',
  purple: 'from-segal-turquoise/10 to-segal-turquoise/5 border-segal-turquoise/30 text-segal-turquoise',
  amber: 'from-segal-orange/10 to-segal-orange/5 border-segal-orange/30 text-segal-orange',
}

const iconColorClasses: Record<MetricCardColor, string> = {
  blue: 'text-segal-blue',
  green: 'text-segal-green',
  red: 'text-segal-red',
  purple: 'text-segal-turquoise',
  amber: 'text-segal-orange',
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
