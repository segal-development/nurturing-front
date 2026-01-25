/**
 * AperturasChart Component
 *
 * Displays email open metrics over time.
 */

import { LineChart } from './LineChart';
import type { DailyMetric } from '@/types/metricas';

// ============================================================
// TYPES
// ============================================================

interface AperturasChartProps {
  data: DailyMetric[];
  className?: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const LINE_CONFIG = [
  { key: 'total', label: 'Total Aperturas', color: '#3b82f6' },    // blue-500
  { key: 'unicos', label: 'Aperturas Únicas', color: '#8b5cf6' },  // violet-500
];

// ============================================================
// MAIN COMPONENT
// ============================================================

export function AperturasChart({ data, className = '' }: AperturasChartProps) {
  return (
    <LineChart
      title="Aperturas de Email"
      description="Total de aperturas vs aperturas únicas por día"
      data={data}
      lines={LINE_CONFIG}
      className={className}
    />
  );
}

export default AperturasChart;
