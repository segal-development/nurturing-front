/**
 * MetricCard Component
 *
 * Displays a single KPI metric with optional trend indicator.
 * Follows Single Responsibility - only displays metric data.
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTrendDisplay, formatNumber, formatPercentage } from '../utils/formatters';
import type { TrendData } from '@/types/metricas';

// ============================================================
// TYPES
// ============================================================

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: TrendData;
  isPercentage?: boolean;
  isInverseMetric?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function TrendIndicator({
  trend,
  isInverseMetric = false,
}: {
  trend: TrendData;
  isInverseMetric?: boolean;
}) {
  const { value, colorClass, icon } = formatTrendDisplay(trend, isInverseMetric);

  const IconComponent = icon === 'TrendingUp' ? TrendingUp : icon === 'TrendingDown' ? TrendingDown : Minus;

  return (
    <div className={`flex items-center gap-1 text-sm ${colorClass}`}>
      <IconComponent className="h-4 w-4" />
      <span>{value}</span>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  isPercentage = false,
  isInverseMetric = false,
  icon,
  className = '',
}: MetricCardProps) {
  const formattedValue = typeof value === 'number'
    ? isPercentage
      ? formatPercentage(value)
      : formatNumber(value)
    : value;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold">{formattedValue}</div>
          {trend && <TrendIndicator trend={trend} isInverseMetric={isInverseMetric} />}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default MetricCard;
