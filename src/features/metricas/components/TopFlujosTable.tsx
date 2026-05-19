/**
 * TopFlujosTable Component
 *
 * Displays a ranked table of top performing flows.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Eye, MousePointerClick, Inbox } from 'lucide-react';
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
    <Badge variant={getBadgeVariant(rank)} className="w-7 h-7 p-0 flex items-center justify-center text-sm font-bold">
      {rank}
    </Badge>
  );
}

function MetricStat({
  icon,
  label,
  value,
  percent,
  barColor = 'bg-blue-500',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  percent?: number;
  barColor?: string;
}) {
  return (
    <div className="flex flex-col gap-1 flex-1 min-w-[110px]">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm font-semibold">{value}</div>
      {percent !== undefined && (
        <div className="w-full bg-muted rounded-full h-1.5">
          <div
            className={`${barColor} h-1.5 rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      )}
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
          <div className="flex flex-col items-center justify-center h-[200px] gap-2 text-muted-foreground">
            <Inbox className="h-8 w-8 opacity-40" />
            <p className="text-sm">Sin flujos con actividad en este período</p>
          </div>
        ) : (
          <div className="space-y-4">
            {flujos.map((flujo, index) => {
              const enviosPercent = (flujo.total_envios / maxEnvios) * 100;
              return (
                <div
                  key={flujo.id}
                  className="border rounded-lg p-3 hover:bg-segal-blue/5 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <RankBadge rank={index + 1} />
                    <p className="font-semibold truncate flex-1">{flujo.nombre}</p>
                  </div>
                  <div className="flex flex-wrap gap-4 pl-10">
                    <MetricStat
                      icon={<Send className="h-3 w-3" />}
                      label="Envíos"
                      value={formatNumber(flujo.total_envios)}
                      percent={enviosPercent}
                      barColor="bg-blue-500"
                    />
                    <MetricStat
                      icon={<Eye className="h-3 w-3" />}
                      label="Tasa de Apertura"
                      value={formatPercentage(flujo.tasa_apertura)}
                      percent={flujo.tasa_apertura}
                      barColor="bg-emerald-500"
                    />
                    <MetricStat
                      icon={<MousePointerClick className="h-3 w-3" />}
                      label="CTR"
                      value={formatPercentage(flujo.ctr)}
                      percent={flujo.ctr}
                      barColor="bg-purple-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TopFlujosTable;
