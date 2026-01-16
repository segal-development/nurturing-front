/**
 * PeriodSelector Component
 *
 * Allows user to select the time period for metrics display.
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { METRIC_PERIOD, type MetricPeriod } from '@/types/metricas';
import { getPeriodLabel } from '../utils/formatters';

// ============================================================
// TYPES
// ============================================================

interface PeriodSelectorProps {
  value: MetricPeriod;
  onChange: (value: MetricPeriod) => void;
  className?: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const PERIOD_OPTIONS = [
  { value: METRIC_PERIOD.WEEK, label: getPeriodLabel(METRIC_PERIOD.WEEK) },
  { value: METRIC_PERIOD.MONTH, label: getPeriodLabel(METRIC_PERIOD.MONTH) },
  { value: METRIC_PERIOD.QUARTER, label: getPeriodLabel(METRIC_PERIOD.QUARTER) },
  { value: METRIC_PERIOD.YEAR, label: getPeriodLabel(METRIC_PERIOD.YEAR) },
] as const;

// ============================================================
// MAIN COMPONENT
// ============================================================

export function PeriodSelector({ value, onChange, className = '' }: PeriodSelectorProps) {
  return (
    <Select
      value={value.toString()}
      onValueChange={(v) => onChange(parseInt(v, 10) as MetricPeriod)}
    >
      <SelectTrigger className={`w-[180px] ${className}`}>
        <SelectValue placeholder="Seleccionar período" />
      </SelectTrigger>
      <SelectContent position="popper" sideOffset={4} className="z-50">
        {PERIOD_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value.toString()}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default PeriodSelector;
