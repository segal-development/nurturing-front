/**
 * EnviosChart Component
 *
 * Displays send/delivery metrics over time.
 */

import { LineChart } from './LineChart';
import type { DailyEnvioMetric } from '@/types/metricas';

// ============================================================
// TYPES
// ============================================================

interface EnviosChartProps {
  data: DailyEnvioMetric[];
  className?: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const LINE_CONFIG = [
  { key: 'exitosos', label: 'Exitosos', color: 'hsl(var(--chart-1))' },
  { key: 'fallidos', label: 'Fallidos', color: 'hsl(var(--chart-2))' },
  { key: 'pendientes', label: 'Pendientes', color: 'hsl(var(--chart-3))' },
];

// ============================================================
// MAIN COMPONENT
// ============================================================

export function EnviosChart({ data, className = '' }: EnviosChartProps) {
  return (
    <LineChart
      title="Envíos por Día"
      description="Evolución de envíos exitosos, fallidos y pendientes"
      data={data}
      lines={LINE_CONFIG}
      className={className}
    />
  );
}

export default EnviosChart;
