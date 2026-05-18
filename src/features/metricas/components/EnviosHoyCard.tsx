/**
 * EnviosHoyCard Component
 *
 * Displays today's sends grouped by stage when filtering by flujo.
 * If there are no sends today, falls back to showing the last historic
 * send per stage so the user can see when each stage last fired.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Clock } from 'lucide-react';
import type { EnviosHoyMetric } from '@/types/metricas';

interface EnviosHoyCardProps {
  data: EnviosHoyMetric;
  className?: string;
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    const d = new Date(iso).getTime();
    const now = Date.now();
    const diffMs = now - d;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days === 0) return 'hoy';
    if (days === 1) return 'ayer';
    if (days < 7) return `hace ${days} días`;
    if (days < 30) return `hace ${Math.floor(days / 7)} semanas`;
    if (days < 365) return `hace ${Math.floor(days / 30)} meses`;
    return `hace ${Math.floor(days / 365)} años`;
  } catch {
    return '';
  }
}

export function EnviosHoyCard({ data, className = '' }: EnviosHoyCardProps) {
  const hasSendsToday = data.total_hoy > 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Send className="h-4 w-4 text-segal-blue" />
            Envíos de hoy
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold leading-none">
              {data.total_hoy.toLocaleString('es-CL')}
            </span>
            <span className="text-xs text-muted-foreground">enviados hoy</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {hasSendsToday ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              Desglose por etapa
            </p>
            {data.por_etapa_hoy.map((etapa) => (
              <div
                key={etapa.node_id || etapa.etapa_nombre}
                className="flex items-center justify-between py-2 px-3 rounded-md bg-segal-blue/5 dark:bg-gray-800"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium truncate">
                    {etapa.etapa_nombre}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-semibold">{etapa.total.toLocaleString('es-CL')}</span>
                  {etapa.ultimo && (
                    <span className="text-xs text-muted-foreground">
                      último: {formatDateTime(etapa.ultimo)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
              <Clock className="h-4 w-4" />
              <p className="text-sm">
                Sin envíos hoy. Último envío por etapa:
              </p>
            </div>
            {data.ultimo_por_etapa.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                Este flujo nunca ha tenido envíos registrados.
              </p>
            ) : (
              data.ultimo_por_etapa.map((etapa) => (
                <div
                  key={etapa.node_id || etapa.etapa_nombre}
                  className="flex items-center justify-between py-2 px-3 rounded-md bg-segal-blue/5 dark:bg-gray-800"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium truncate">
                      {etapa.etapa_nombre}
                    </span>
                  </div>
                  <div className="flex flex-col items-end text-sm">
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(etapa.ultimo)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(etapa.ultimo)} · {etapa.total.toLocaleString('es-CL')} env.
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EnviosHoyCard;
