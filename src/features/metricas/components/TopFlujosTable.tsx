/**
 * TopFlujosTable Component
 *
 * Displays a ranked table of top performing flows.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatNumber, formatPercentage } from '../utils/formatters';
import type { TopFlujoMetric } from '@/types/metricas';

// ============================================================
// TYPES
// ============================================================

interface TopFlujosTableProps {
  flujos: TopFlujoMetric[];
  className?: string;
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function RankBadge({ rank }: { rank: number }) {
  const getBadgeVariant = (rank: number) => {
    if (rank === 1) return 'default';
    if (rank <= 3) return 'secondary';
    return 'outline';
  };

  return (
    <Badge variant={getBadgeVariant(rank)} className="w-6 h-6 p-0 flex items-center justify-center">
      {rank}
    </Badge>
  );
}

function PerformanceBar({ value, maxValue }: { value: number; maxValue: number }) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <div className="w-full bg-muted rounded-full h-2">
      <div
        className="bg-primary h-2 rounded-full transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function TopFlujosTable({ flujos, className = '' }: TopFlujosTableProps) {
  const hasData = flujos.length > 0;
  const maxEnvios = Math.max(...flujos.map((f) => f.total_envios), 1);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Top Flujos por Rendimiento</CardTitle>
        <CardDescription>Flujos con mayor engagement en el período</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            No hay datos para mostrar
          </div>
        ) : (
          <div className="space-y-4">
            {flujos.map((flujo, index) => (
              <div key={flujo.id} className="space-y-2">
                <div className="flex items-center gap-3">
                  <RankBadge rank={index + 1} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{flujo.nombre}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                      <span>Envíos: {formatNumber(flujo.total_envios)}</span>
                      <span>Aperturas: {formatPercentage(flujo.tasa_apertura)}</span>
                      <span>CTR: {formatPercentage(flujo.ctr)}</span>
                    </div>
                  </div>
                </div>
                <PerformanceBar value={flujo.total_envios} maxValue={maxEnvios} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TopFlujosTable;
