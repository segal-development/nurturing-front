/**
 * ReconciliacionSysgalCard
 *
 * Muestra el cruce SYSGAL ↔ ingresados (Contratos + Onboarding), HOY y mes en curso.
 * El dato lo refresca cada hora `nurturing:cache-reconciliacion` (no pega en vivo a SYSGAL
 * en cada carga). El "Hoy" coincide exactamente con lo que devuelve /ContratosNuevos (el CSV).
 * Métrica GLOBAL (no depende del flujo seleccionado).
 */

import { ShieldCheck, CheckCircle2, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatNumber } from '../utils/formatters';
import type { ReconciliacionPorPeriodo, ReconciliacionSysgalMetric } from '@/types/metricas';

interface ReconciliacionSysgalCardProps {
  data?: ReconciliacionSysgalMetric | null;
  className?: string;
}

const ENDPOINTS: { key: 'contratos' | 'clientes-ingreso'; label: string }[] = [
  { key: 'contratos', label: 'Contratos Nuevos' },
  { key: 'clientes-ingreso', label: 'Onboarding (Clientes ingreso)' },
];

function EndpointBlock({ label, data }: { label: string; data: ReconciliacionPorPeriodo }) {
  const hoy = data.hoy;
  const mes = data.mes;
  const pendientes = mes?.faltantes_count ?? hoy?.faltantes_count ?? 0;
  const ok = pendientes === 0;

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
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

      <div className="flex items-end gap-6">
        <div className="flex flex-col">
          <span className="text-3xl font-bold leading-none">{formatNumber(hoy?.sysgal_total ?? 0)}</span>
          <span className="mt-1 text-xs text-muted-foreground">registrados HOY</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-semibold leading-none text-muted-foreground">
            {formatNumber(mes?.sysgal_total ?? 0)}
          </span>
          <span className="mt-1 text-xs text-muted-foreground">este mes</span>
        </div>
      </div>

      {mes && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {formatNumber(mes.desglose.ingresado)} ingresados (mes)
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3 text-sky-500" /> {formatNumber(mes.desglose.duplicado)} ya en sistema
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3 text-amber-500" /> {formatNumber(pendientes)} por ingresar
          </span>
        </div>
      )}
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
          Lo que reporta SYSGAL vs lo ingresado al sistema. "Hoy" coincide con los contratos del día
          (el mismo dato que el Excel). Garantiza que no se escape ninguno. Se verifica cada hora.
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
                const periodo = data?.[key];
                return periodo ? <EndpointBlock key={key} label={label} data={periodo} /> : null;
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
