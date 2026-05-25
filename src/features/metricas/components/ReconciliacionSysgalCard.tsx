/**
 * ReconciliacionSysgalCard
 *
 * Muestra el cruce SYSGAL ↔ ingresados (Contratos + Onboarding) del mes en curso.
 * El dato lo refresca cada hora el comando `nurturing:cache-reconciliacion` (no pega
 * en vivo a SYSGAL en cada carga). Sirve para que gerencia confirme que no se escapa
 * ningún contrato, sin pedirle nada al equipo técnico.
 *
 * Es una métrica GLOBAL (no depende del flujo seleccionado).
 */

import { ShieldCheck, CheckCircle2, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatNumber } from '../utils/formatters';
import type { ReconciliacionEndpoint, ReconciliacionSysgalMetric } from '@/types/metricas';

interface ReconciliacionSysgalCardProps {
  data?: ReconciliacionSysgalMetric | null;
  className?: string;
}

const ENDPOINTS: { key: 'contratos' | 'clientes-ingreso'; label: string }[] = [
  { key: 'contratos', label: 'Contratos Nuevos' },
  { key: 'clientes-ingreso', label: 'Onboarding (Clientes ingreso)' },
];

function EndpointBlock({ label, r }: { label: string; r: ReconciliacionEndpoint }) {
  const pendientes = r.faltantes_count ?? 0;
  const ok = pendientes === 0;

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{label}</span>
        {ok ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" /> Todo ingresado
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            <Clock className="h-3.5 w-3.5" /> {formatNumber(pendientes)} por ingresar
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold leading-none">{formatNumber(r.sysgal_total)}</span>
        <span className="text-xs text-muted-foreground">registros en SYSGAL (mes)</span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {formatNumber(r.desglose.ingresado)} ingresados
        </span>
        <span className="inline-flex items-center gap-1">
          <Users className="h-3 w-3 text-sky-500" /> {formatNumber(r.desglose.duplicado)} ya en sistema
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3 text-amber-500" /> {formatNumber(pendientes)} por ingresar
        </span>
      </div>
    </div>
  );
}

export function ReconciliacionSysgalCard({ data, className = '' }: ReconciliacionSysgalCardProps) {
  const sinDatos = !data || (!data.contratos && !data['clientes-ingreso']);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-segal-blue dark:text-segal-turquoise" />
          <CardTitle>Reconciliación SYSGAL</CardTitle>
        </div>
        <CardDescription>
          Cruce entre lo que reporta SYSGAL y lo ingresado al sistema (mes en curso). Garantiza que no
          se escape ningún contrato. Se verifica automáticamente cada hora.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sinDatos ? (
          <div className="flex h-[120px] items-center justify-center text-sm text-muted-foreground">
            Aún no calculado — se actualiza automáticamente cada hora.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {ENDPOINTS.map(({ key, label }) => {
                const r = data?.[key];
                return r ? <EndpointBlock key={key} label={label} r={r} /> : null;
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Los "por ingresar" suelen ser registros recién llegados que entran en el próximo sync.
              {data?.generado_at && (
                <> · Última verificación: {new Date(data.generado_at).toLocaleString('es-CL')}</>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ReconciliacionSysgalCard;
