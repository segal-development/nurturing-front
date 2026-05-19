/**
 * NuevosProspectosChart Component
 *
 * Displays the daily intake of new prospects entering a flujo.
 * Includes a small summary (total + daily average) above the line chart.
 */

import { LineChart } from './LineChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp } from 'lucide-react';
import type { NuevosProspectosMetric } from '@/types/metricas';

interface NuevosProspectosChartProps {
  data: NuevosProspectosMetric;
  className?: string;
}

const LINE_CONFIG = [
  { key: 'total', label: 'Nuevos prospectos', color: '#3b82f6' }, // blue-500
];

export function NuevosProspectosChart({ data, className = '' }: NuevosProspectosChartProps) {
  const isSingleDay = data.por_dia.length <= 1;
  const hasFlujoBreakdown = data.por_flujo !== undefined && data.por_flujo.length > 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base font-semibold">
              {isSingleDay ? 'Nuevos prospectos hoy' : 'Nuevos prospectos por día'}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Prospectos que entraron al flujo en el período seleccionado
            </p>
          </div>
          {!isSingleDay && (
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground leading-none">Total</p>
                  <p className="text-lg font-bold leading-tight">{data.total.toLocaleString('es-CL')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground leading-none">Promedio/día</p>
                  <p className="text-lg font-bold leading-tight">
                    {data.promedio_diario.toLocaleString('es-CL')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isSingleDay ? (
          <div className="flex flex-col items-center justify-center py-6 gap-3">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <p className="text-5xl font-bold">{data.total.toLocaleString('es-CL')}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {data.total === 0
                ? 'Sin nuevos prospectos hoy'
                : data.total === 1
                  ? 'prospecto entró al flujo hoy'
                  : 'prospectos entraron al flujo hoy'}
            </p>
            {hasFlujoBreakdown && (
              <div className="w-full max-w-md mt-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2 text-center">
                  Desglose por flujo
                </p>
                <div className="space-y-1.5">
                  {data.por_flujo!.map((f) => (
                    <div
                      key={f.flujo_id}
                      className="flex items-center justify-between py-2 px-3 rounded-md bg-segal-blue/5 dark:bg-gray-800"
                    >
                      <span className="text-sm font-medium truncate">{f.flujo_nombre}</span>
                      <span className="text-sm font-semibold ml-3">
                        {f.total.toLocaleString('es-CL')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <LineChart title="" data={data.por_dia} lines={LINE_CONFIG} height={250} />
            {hasFlujoBreakdown && (
              <div className="mt-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  Desglose por flujo
                </p>
                <div className="space-y-1.5">
                  {data.por_flujo!.map((f) => (
                    <div
                      key={f.flujo_id}
                      className="flex items-center justify-between py-2 px-3 rounded-md bg-segal-blue/5 dark:bg-gray-800"
                    >
                      <span className="text-sm font-medium truncate">{f.flujo_nombre}</span>
                      <span className="text-sm font-semibold ml-3">
                        {f.total.toLocaleString('es-CL')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default NuevosProspectosChart;
