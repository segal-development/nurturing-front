/**
 * EnviosPorDiaChart - Presentational line chart for daily email sends
 *
 * SRP: Only renders the line chart with its Card wrapper.
 * Performance: Theme objects and tooltip are module-level constants/components
 * to avoid re-renders from nivo (which bypasses React Compiler).
 */

import { ResponsiveLine } from '@nivo/line';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { EnvioPorDia } from '@/api/dashboard.service';

// =============================================================================
// Types
// =============================================================================

interface EnviosPorDiaChartProps {
  data: EnvioPorDia[];
  isDark: boolean;
}

// =============================================================================
// Data Transform (colocated — only used by this chart)
// =============================================================================

function transformLineChartData(data: EnvioPorDia[]) {
  return [
    {
      id: 'Exitosos',
      data: data.map((item) => ({
        x: item.fecha,
        y: item.exitosos,
      })),
    },
    {
      id: 'Fallidos',
      data: data.map((item) => ({
        x: item.fecha,
        y: item.fallidos,
      })),
    },
  ];
}

// =============================================================================
// Theme Constants (module-level to avoid re-renders)
// =============================================================================

const LIGHT_LINE_THEME = {
  text: { fill: '#333333' },
  axis: {
    ticks: { text: { fill: '#666666' } },
    legend: { text: { fill: '#333333' } },
  },
  grid: { line: { stroke: '#e0e0e0' } },
  crosshair: { line: { stroke: '#666666' } },
} as const;

const DARK_LINE_THEME = {
  text: { fill: '#e5e7eb' },
  axis: {
    ticks: { text: { fill: '#9ca3af' } },
    legend: { text: { fill: '#e5e7eb' } },
  },
  grid: { line: { stroke: '#374151' } },
  crosshair: { line: { stroke: '#9ca3af' } },
} as const;

// =============================================================================
// Axis Config Constants
// =============================================================================

const AXIS_BOTTOM = {
  tickSize: 5,
  tickPadding: 5,
  tickRotation: 0,
  legend: 'Fecha',
  legendOffset: 36,
  legendPosition: 'middle' as const,
};

const AXIS_LEFT = {
  tickSize: 5,
  tickPadding: 5,
  tickRotation: 0,
  legend: 'Cantidad',
  legendOffset: -46,
  legendPosition: 'middle' as const,
};

const CHART_MARGIN = { top: 10, right: 30, left: 60, bottom: 40 };

const Y_SCALE = { type: 'linear' as const, min: 0, max: 'auto' as const };

// =============================================================================
// Tooltip Component (named — avoids inline function re-renders)
// =============================================================================

function LineChartTooltip({ point, isDark }: { point: any; isDark: boolean }) {
  return (
    <div
      style={{
        background: isDark ? '#1f2937' : 'white',
        color: isDark ? '#e5e7eb' : '#333333',
        padding: '8px 12px',
        border: `1px solid ${isDark ? '#374151' : '#ccc'}`,
        borderRadius: '4px',
        fontSize: '12px',
      }}
    >
      <strong>{point.data.x}</strong>
      <div>
        {point.serieId}: {point.data.y}
      </div>
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

export function EnviosPorDiaChart({ data, isDark }: EnviosPorDiaChartProps) {
  const theme = isDark ? DARK_LINE_THEME : LIGHT_LINE_THEME;
  const hasData = data.length > 0;

  return (
    <Card className="border-segal-blue/10 dark:border-gray-700 dark:bg-gray-900">
      <CardHeader>
        <CardTitle className="text-segal-dark dark:text-white">Envíos por Día</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: '300px' }}>
          {hasData ? (
            <ResponsiveLine
              data={transformLineChartData(data)}
              margin={CHART_MARGIN}
              xScale={{ type: 'point' }}
              yScale={Y_SCALE}
              theme={theme}
              axisBottom={AXIS_BOTTOM}
              axisLeft={AXIS_LEFT}
              colors={{ scheme: 'set2' }}
              pointSize={6}
              pointColor={{ from: 'color', modifiers: [['darker', 0.5]] }}
              useMesh={true}
              tooltip={({ point }: any) => <LineChartTooltip point={point} isDark={isDark} />}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              No hay datos de envíos para mostrar
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
