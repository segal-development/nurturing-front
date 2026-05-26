/**
 * PeriodSelector Component
 *
 * Allows user to select the time period for metrics display.
 * Preset dropdown and custom date-range picker are always visible side by side.
 * Picking a preset clears any active date range; picking a date range takes
 * precedence over the preset (dias) when both are present.
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-picker';
import { METRIC_PERIOD, type MetricPeriod, type DateRange } from '@/types/metricas';
import { getPeriodLabel } from '../utils/formatters';

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
// Excludes CUSTOM — the date-range picker is now always visible alongside.
// ============================================================

const PERIOD_OPTIONS = [
  { value: METRIC_PERIOD.TODAY, label: getPeriodLabel(METRIC_PERIOD.TODAY) },
  { value: METRIC_PERIOD.WEEK, label: getPeriodLabel(METRIC_PERIOD.WEEK) },
  { value: METRIC_PERIOD.MONTH, label: getPeriodLabel(METRIC_PERIOD.MONTH) },
  { value: METRIC_PERIOD.QUARTER, label: getPeriodLabel(METRIC_PERIOD.QUARTER) },
  { value: METRIC_PERIOD.YEAR, label: getPeriodLabel(METRIC_PERIOD.YEAR) },
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
  const handlePeriodChange = (v: string) => {
    const parsed = parseInt(v, 10);
    if (Number.isNaN(parsed)) return; // 'custom' no es un preset real
    onChange(parsed as MetricPeriod);
    // Preset chosen → clear the custom date range so dias takes over
    onDateRangeChange?.(undefined);
  };

  const handleFromChange = (date: Date | undefined) => {
    if (!onDateRangeChange) return;
    if (date && dateRange?.to) {
      onDateRangeChange({ from: date, to: dateRange.to });
    } else if (date) {
      onDateRangeChange({ from: date, to: date });
    } else {
      onDateRangeChange(undefined);
    }
  };

  const handleToChange = (date: Date | undefined) => {
    if (!onDateRangeChange) return;
    if (date && dateRange?.from) {
      onDateRangeChange({ from: dateRange.from, to: date });
    } else if (date) {
      onDateRangeChange({ from: date, to: date });
    } else {
      onDateRangeChange(undefined);
    }
  };

  // Use the preset value in the dropdown, but fall back to MONTH when CUSTOM
  // is the current stored value (legacy guard — CUSTOM no longer appears as option).
  const dropdownValue = value === METRIC_PERIOD.CUSTOM ? METRIC_PERIOD.MONTH : value;

  // Con un rango custom activo, el dropdown NO debe mostrar un preset: si mostrara "Hoy" y el
  // usuario hace clic en "Hoy", el valor no cambia y onValueChange NO se dispara (no limpia el
  // rango). Mostrando "Personalizado", hacer clic en cualquier preset siempre cuenta como cambio.
  const customActive = !!(dateRange?.from && dateRange?.to);
  const selectValue = customActive ? 'custom' : dropdownValue.toString();

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {/* Preset dropdown */}
      <Select value={selectValue} onValueChange={handlePeriodChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Seleccionar período">
            {customActive ? 'Personalizado' : getPeriodLabel(dropdownValue)}
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

      {/* Custom date-range picker — always visible alongside the dropdown */}
      <DateRangePicker
        from={dateRange?.from}
        to={dateRange?.to}
        onFromChange={handleFromChange}
        onToChange={handleToChange}
        placeholderFrom="Desde"
        placeholderTo="Hasta"
      />
    </div>
  );
}

export default PeriodSelector;
