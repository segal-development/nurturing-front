/**
 * PeriodSelector Component
 *
 * Allows user to select the time period for metrics display.
 * Supports predefined periods (Today, Week, Month, etc.) and custom date range.
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-picker';
import { METRIC_PERIOD, type MetricPeriod, type DateRange } from '@/types/metricas';
import { getPeriodLabel, formatDateRange } from '../utils/formatters';

// ============================================================
// TYPES
// ============================================================

interface PeriodSelectorProps {
  value: MetricPeriod;
  onChange: (value: MetricPeriod) => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  className?: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const PERIOD_OPTIONS = [
  { value: METRIC_PERIOD.TODAY, label: getPeriodLabel(METRIC_PERIOD.TODAY) },
  { value: METRIC_PERIOD.WEEK, label: getPeriodLabel(METRIC_PERIOD.WEEK) },
  { value: METRIC_PERIOD.MONTH, label: getPeriodLabel(METRIC_PERIOD.MONTH) },
  { value: METRIC_PERIOD.QUARTER, label: getPeriodLabel(METRIC_PERIOD.QUARTER) },
  { value: METRIC_PERIOD.YEAR, label: getPeriodLabel(METRIC_PERIOD.YEAR) },
  { value: METRIC_PERIOD.CUSTOM, label: getPeriodLabel(METRIC_PERIOD.CUSTOM) },
] as const;

// ============================================================
// MAIN COMPONENT
// ============================================================

export function PeriodSelector({
  value,
  onChange,
  dateRange,
  onDateRangeChange,
  className = '',
}: PeriodSelectorProps) {
  const isCustomRange = value === METRIC_PERIOD.CUSTOM;

  const handlePeriodChange = (v: string) => {
    const newValue = parseInt(v, 10) as MetricPeriod;
    onChange(newValue);

    // Clear date range when switching away from custom
    if (newValue !== METRIC_PERIOD.CUSTOM && onDateRangeChange) {
      onDateRangeChange(undefined);
    }
  };

  const handleFromChange = (date: Date | undefined) => {
    if (!onDateRangeChange) return;

    if (date && dateRange?.to) {
      onDateRangeChange({ from: date, to: dateRange.to });
    } else if (date) {
      // Default to same day if no end date
      onDateRangeChange({ from: date, to: date });
    }
  };

  const handleToChange = (date: Date | undefined) => {
    if (!onDateRangeChange) return;

    if (date && dateRange?.from) {
      onDateRangeChange({ from: dateRange.from, to: date });
    } else if (date) {
      // Default to same day if no start date
      onDateRangeChange({ from: date, to: date });
    }
  };

  // Display value for the select
  const displayValue =
    isCustomRange && dateRange?.from && dateRange?.to
      ? formatDateRange(dateRange.from, dateRange.to)
      : undefined;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Select value={value.toString()} onValueChange={handlePeriodChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Seleccionar período">
            {displayValue || getPeriodLabel(value)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          position="popper"
          sideOffset={4}
          className="z-50 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-xl"
        >
          {PERIOD_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value.toString()}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isCustomRange && (
        <DateRangePicker
          from={dateRange?.from}
          to={dateRange?.to}
          onFromChange={handleFromChange}
          onToChange={handleToChange}
          placeholderFrom="Desde"
          placeholderTo="Hasta"
          className="flex-shrink-0"
        />
      )}
    </div>
  );
}

export default PeriodSelector;
