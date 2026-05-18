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
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base font-semibold">Nuevos prospectos por día</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Prospectos que entraron al flujo en el período seleccionado
            </p>
          </div>
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
                <p className="text-lg font-bold leading-tight">{data.promedio_diario.toLocaleString('es-CL')}</p>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <LineChart
          title=""
          data={data.por_dia}
          lines={LINE_CONFIG}
          height={250}
        />
      </CardContent>
    </Card>
  );
}

export default NuevosProspectosChart;
