/**
 * LineChart Component
 *
 * Reusable line chart for time-series metrics data.
 * Uses Recharts for rendering.
 */

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatDate, formatNumber } from '../utils/formatters';

// ============================================================
// TYPES
// ============================================================

interface LineConfig {
  key: string;
  label: string;
  color: string;
}

interface LineChartProps<T extends { fecha: string }> {
  title: string;
  description?: string;
  data: T[];
  lines: LineConfig[];
  height?: number;
  className?: string;
}

// ============================================================
// CUSTOM TOOLTIP
// ============================================================

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="font-medium">{label ? formatDate(label) : ''}</p>
      <div className="mt-2 space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-sm">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">{formatNumber(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// SINGLE-DAY SUMMARY
// ============================================================

/**
 * Cuando el período cubre un solo día, un line chart queda vacío (no hay línea
 * que dibujar entre puntos). Mostramos los valores de ese día como números
 * grandes, usando los labels/colores de cada serie. Sirve para que gerencia lea
 * el dato claro en "Hoy" para cualquier flujo.
 */
function SingleDaySummary({
  point,
  lines,
}: {
  point: Record<string, unknown>;
  lines: LineConfig[];
}) {
  const fecha = typeof point.fecha === 'string' ? point.fecha : '';

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-5 py-6">
      {fecha && (
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {formatDate(fecha)}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-8">
        {lines.map((line) => (
          <div key={line.key} className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: line.color }} />
              <span className="text-xs text-muted-foreground">{line.label}</span>
            </div>
            <span className="text-4xl font-bold">{formatNumber(Number(point[line.key] ?? 0))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function LineChart<T extends { fecha: string }>({
  title,
  description,
  data,
  lines,
  height = 300,
  className = '',
}: LineChartProps<T>) {
  const hasData = data.length > 0;
  // Un line chart no puede dibujar una línea con un solo punto (queda vacío).
  // En ese caso mostramos los valores del día como números grandes.
  const isSingleDay = data.length === 1;

  // Normalize data: convert string values to numbers (backend sometimes sends strings)
  const normalizedData = data.map((item) => {
    const normalized = { ...item } as Record<string, unknown>;
    for (const line of lines) {
      const value = normalized[line.key];
      if (typeof value === 'string') {
        normalized[line.key] = parseFloat(value) || 0;
      }
    }
    return normalized as T;
  });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No hay datos para mostrar
          </div>
        ) : isSingleDay ? (
          <SingleDaySummary point={normalizedData[0] as Record<string, unknown>} lines={lines} />
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <RechartsLineChart data={normalizedData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="fecha"
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                tickFormatter={(value) => formatNumber(value)}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {lines.map((line) => (
                <Line
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  name={line.label}
                  stroke={line.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </RechartsLineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default LineChart;
