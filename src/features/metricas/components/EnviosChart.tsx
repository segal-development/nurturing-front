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
  { key: 'exitosos', label: 'Exitosos', color: '#22c55e' },    // green-500
  { key: 'fallidos', label: 'Fallidos', color: '#ef4444' },    // red-500
  { key: 'pendientes', label: 'Pendientes', color: '#f59e0b' }, // amber-500
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
