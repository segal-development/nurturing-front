/**
 * ProblemasEnvioCard
 *
 * Muestra los prospectos del flujo que tienen datos que impiden el envío
 * (email faltante/inválido, teléfono faltante): resumen por motivo + drill-down.
 * Pensado para detectar y corregir calidad de dato en el origen (SYSGAL).
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Pagination } from '@/components/shared/Pagination';
import {
  AlertTriangle,
  MailX,
  MailWarning,
  PhoneOff,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  UserX,
} from 'lucide-react';
import { formatNumber } from '../utils/formatters';
import type {
  MotivoProblemaEnvio,
  ProblemaEnvioDetalle,
  ProblemasEnvioMetric,
} from '@/types/metricas';

// ============================================================
// TYPES
// ============================================================

interface ProblemasEnvioCardProps {
  data: ProblemasEnvioMetric;
  className?: string;
}

// ============================================================
// META + HELPERS
// ============================================================

/** Cuántos prospectos se muestran por página en el detalle. Debajo de esto no hay paginador. */
const DETALLE_PAGE_SIZE = 30;

const MOTIVO_META: Record<
  MotivoProblemaEnvio,
  { label: string; icon: React.ReactNode; badge: string }
> = {
  sin_email: {
    label: 'Sin email',
    icon: <MailX className="h-3.5 w-3.5" />,
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  email_invalido: {
    label: 'Email inválido',
    icon: <MailWarning className="h-3.5 w-3.5" />,
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  },
  sin_telefono: {
    label: 'Sin teléfono',
    icon: <PhoneOff className="h-3.5 w-3.5" />,
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  },
};

/** "dominio_typo:gmial.com" → "gmial.com" ; "tld_invalido:ccom" → "ccom" */
function emailErrorHint(motivo: string | null): string | null {
  if (!motivo) return null;
  const [, detail] = motivo.split(':');
  return detail ?? motivo;
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function MotivoStat({ motivo, count }: { motivo: MotivoProblemaEnvio; count: number }) {
  const meta = MOTIVO_META[motivo];
  return (
    <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
      <span className="text-muted-foreground">{meta.icon}</span>
      <div className="flex flex-col">
        <span className="text-lg font-bold leading-none">{formatNumber(count)}</span>
        <span className="text-xs text-muted-foreground">{meta.label}</span>
      </div>
    </div>
  );
}

function DetalleRow({ prospecto }: { prospecto: ProblemaEnvioDetalle }) {
  const hint = emailErrorHint(prospecto.email_invalido_motivo);
  return (
    <div className="flex items-center justify-between gap-3 border-b py-2 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{prospecto.nombre ?? 'Sin nombre'}</p>
        <p className="text-xs text-muted-foreground">{prospecto.rut ?? '—'}</p>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        {prospecto.motivos.map((m) => (
          <span
            key={m}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${MOTIVO_META[m].badge}`}
          >
            {MOTIVO_META[m].icon}
            {MOTIVO_META[m].label}
            {m === 'email_invalido' && hint ? <span className="opacity-70">· {hint}</span> : null}
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function ProblemasEnvioCard({ data, className = '' }: ProblemasEnvioCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);

  // Vuelve a la primera página al abrir/cerrar el detalle o cuando cambia el set de datos.
  useEffect(() => {
    setPage(1);
  }, [data.detalle.length, expanded]);

  const motivos = (Object.entries(data.por_motivo) as [MotivoProblemaEnvio, number][]).filter(
    ([, n]) => (n ?? 0) > 0,
  );
  const sinProblemas = data.total_con_problemas === 0;

  // Paginación del detalle: si no supera DETALLE_PAGE_SIZE, totalPages = 1 y el paginador no se muestra.
  const totalDetalle = data.detalle.length;
  const totalPages = Math.ceil(totalDetalle / DETALLE_PAGE_SIZE);
  const safePage = Math.min(page, Math.max(totalPages, 1));
  const detalleVisible = data.detalle.slice(
    (safePage - 1) * DETALLE_PAGE_SIZE,
    safePage * DETALLE_PAGE_SIZE,
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          {sinProblemas ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          )}
          <CardTitle>Datos con problemas de envío</CardTitle>
        </div>
        <CardDescription>
          Prospectos que entraron al flujo pero tienen datos que impiden el envío por algún canal.
          El dato hay que corregirlo en el origen (SYSGAL).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sinProblemas ? (
          <div className="flex flex-col items-center justify-center h-[140px] gap-2 text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 opacity-60" />
            <p className="text-sm">Todos los prospectos del período tienen datos válidos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Resumen por motivo */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-col">
                <span className="text-2xl font-bold leading-none">
                  {formatNumber(data.total_con_problemas)}
                </span>
                <span className="text-xs text-muted-foreground">con problemas de dato</span>
              </div>
              <div className="h-10 w-px bg-border" />
              {motivos.map(([motivo, count]) => (
                <MotivoStat key={motivo} motivo={motivo} count={count} />
              ))}
            </div>

            {/* Crítico: no recibieron NINGÚN canal */}
            {data.no_contactables > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm">
                <UserX className="h-4 w-4 text-destructive" />
                <span>
                  <strong>{formatNumber(data.no_contactables)}</strong> no recibieron nada (sin ningún
                  canal válido)
                </span>
              </div>
            )}

            {/* Drill-down detallado */}
            <div>
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1.5 text-sm font-medium text-segal-blue hover:underline dark:text-segal-turquoise"
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {expanded ? 'Ocultar detalle' : `Ver detalle (${formatNumber(data.detalle.length)})`}
              </button>

              {expanded && (
                <>
                  <div className="mt-3 rounded-lg border p-3">
                    {detalleVisible.map((p) => (
                      <DetalleRow key={p.prospecto_id} prospecto={p} />
                    ))}
                    {data.detalle_truncado && (
                      <p className="pt-2 text-xs text-muted-foreground">
                        Hay más de los {formatNumber(totalDetalle)} cargados — afiná el período para
                        verlos.
                      </p>
                    )}
                  </div>
                  <Pagination
                    currentPage={safePage}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    className="mt-3"
                  />
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ProblemasEnvioCard;
