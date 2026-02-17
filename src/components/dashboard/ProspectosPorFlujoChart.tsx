/**
 * ProspectosPorFlujoChart - Presentational pie chart for prospects per flow
 *
 * SRP: Only renders the pie chart with its Card wrapper.
 * Performance: Theme, colors, legends, and tooltip are module-level
 * constants/components to avoid re-renders from nivo.
 */

import { ResponsivePie } from '@nivo/pie';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ProspectoPorFlujo } from '@/api/dashboard.service';

// =============================================================================
// Types
// =============================================================================

interface ProspectosPorFlujoChartProps {
  data: ProspectoPorFlujo[];
  isDark: boolean;
}

// =============================================================================
// Data Transform (colocated — only used by this chart)
// =============================================================================

function transformPieChartData(data: ProspectoPorFlujo[]) {
  return data.map((item) => ({
    id: item.flujo,
    value: item.cantidad,
  }));
}

// =============================================================================
// Constants (module-level to avoid re-renders)
// =============================================================================

const SEGAL_PIE_COLORS = ['#086DBD', '#32BFD0', '#78B52E', '#F8991D', '#E74C3C', '#9B59B6'];

const CHART_MARGIN = { top: 20, right: 100, bottom: 60, left: 100 };

const LIGHT_PIE_THEME = {
  text: { fill: '#333333' },
  labels: { text: { fill: '#333333' } },
} as const;

const DARK_PIE_THEME = {
  text: { fill: '#e5e7eb' },
  labels: { text: { fill: '#e5e7eb' } },
} as const;

// =============================================================================
// Legends Config (function — varies by isDark)
// =============================================================================

function getLegends(isDark: boolean) {
  return [
    {
      anchor: 'bottom' as const,
      direction: 'row' as const,
      justify: false,
      translateX: 0,
      translateY: 80,
      itemsSpacing: 15,
      itemWidth: 120,
      itemHeight: 18,
      itemTextColor: isDark ? '#e5e7eb' : '#333333',
      itemDirection: 'left-to-right' as const,
      symbolSize: 16,
      symbolShape: 'circle' as const,
      effects: [
        {
          on: 'hover' as const,
          style: {
            itemTextColor: isDark ? '#32BFD0' : '#086DBD',
            itemOpacity: 1,
          },
        },
      ],
    },
  ];
}

// =============================================================================
// Tooltip Component (named — avoids inline function re-renders)
// =============================================================================

function PieChartTooltip({
  datum,
  total,
  isDark,
}: {
  datum: any;
  total: number;
  isDark: boolean;
}) {
  const percentage = ((datum.value / total) * 100).toFixed(1);

  return (
    <div
      style={{
        background: isDark ? '#1f2937' : 'white',
        padding: '12px 16px',
        border: `2px solid ${isDark ? '#32BFD0' : '#086DBD'}`,
        borderRadius: '6px',
        fontSize: '13px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      <div
        style={{
          fontWeight: 'bold',
          color: isDark ? '#32BFD0' : '#086DBD',
          marginBottom: '4px',
        }}
      >
        {datum.label}
      </div>
      <div style={{ color: isDark ? '#e5e7eb' : '#333' }}>
        Cantidad: <strong>{datum.value.toLocaleString()}</strong>
      </div>
      <div style={{ color: isDark ? '#9ca3af' : '#666', fontSize: '12px', marginTop: '4px' }}>
        {percentage}% del total
      </div>
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

export function ProspectosPorFlujoChart({ data, isDark }: ProspectosPorFlujoChartProps) {
  const theme = isDark ? DARK_PIE_THEME : LIGHT_PIE_THEME;
  const total = data.reduce((sum, item) => sum + item.cantidad, 0);
  const hasData = data.length > 0 && total > 0;

  return (
    <Card className="border-segal-turquoise/10 dark:border-gray-700 dark:bg-gray-900">
      <CardHeader>
        <CardTitle className="text-segal-dark dark:text-white">
          Distribución de Prospectos por Flujo
        </CardTitle>
        <p className="text-xs text-segal-dark/60 dark:text-gray-400 mt-1">
          Cantidad total de prospectos en cada flujo de nurturing
        </p>
      </CardHeader>
      <CardContent>
        <div style={{ height: '350px' }}>
          {hasData ? (
            <ResponsivePie
              data={transformPieChartData(data)}
              margin={CHART_MARGIN}
              innerRadius={0.5}
              padAngle={1.2}
              cornerRadius={4}
              colors={SEGAL_PIE_COLORS}
              borderWidth={2}
              borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
              arcLabelsSkipAngle={5}
              arcLabelsTextColor="#ffffff"
              arcLabelsRadiusOffset={0.6}
              enableArcLinkLabels={true}
              arcLinkLabelsSkipAngle={5}
              arcLinkLabelsTextColor={isDark ? '#e5e7eb' : '#333333'}
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: 'color' }}
              theme={theme}
              tooltip={({ datum }: any) => (
                <PieChartTooltip datum={datum} total={total} isDark={isDark} />
              )}
              legends={getLegends(isDark)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              No hay flujos con prospectos asignados
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
