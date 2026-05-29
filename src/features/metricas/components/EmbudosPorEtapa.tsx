/**
 * EmbudosPorEtapa
 *
 * Renderiza un mini-embudo por cada etapa del flujo Clientes por Fecha Ingreso.
 * Cada etapa tiene su offset desde el ingreso (3, 4, 5, 10, 18 días) — el SYSGAL de cada
 * embudo consulta un día distinto (hoy − offset). Permite a gerencia ver el rendimiento
 * de cada email del drip por separado.
 */

import type { ReactNode } from 'react';
import { ArrowRight, FileText, UserPlus, MailCheck, Eye, MousePointerClick, Mail, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSysgalConteo } from '../hooks/useSysgalConteo';
import { formatNumber } from '../utils/formatters';
import type { EmbudoEtapaMetric } from '@/types/metricas';

interface EmbudosPorEtapaProps {
  etapas: EmbudoEtapaMetric[];
  className?: string;
}

function Paso({ icon, label, valor, nota }: { icon: ReactNode; label: string; valor: ReactNode; nota?: string | null }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 px-2 text-center">
      <span className="text-segal-blue dark:text-segal-turquoise">{icon}</span>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-2xl font-bold leading-none">{valor}</span>
      {nota ? <span className="text-xs text-muted-foreground">{nota}</span> : <span className="text-xs">&nbsp;</span>}
    </div>
  );
}

function Flecha() {
  return <ArrowRight className="hidden h-4 w-4 shrink-0 text-muted-foreground/50 sm:block" />;
}

function MiniTasas({ etapa }: { etapa: EmbudoEtapaMetric }) {
  const tasas = [
    { label: 'Tasa de Entrega', valor: etapa.tasa_entrega, icon: <Mail className="h-4 w-4" /> },
    { label: 'Tasa de Apertura', valor: etapa.tasa_apertura, icon: <Eye className="h-4 w-4" /> },
    { label: 'CTR', valor: etapa.tasa_ctr, icon: <MousePointerClick className="h-4 w-4" /> },
  ];
  return (
    <div className="mt-3 grid grid-cols-3 gap-3 border-t pt-3">
      {tasas.map((t) => (
        <div key={t.label} className="flex flex-col items-center text-center">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            {t.icon} {t.label}
          </span>
          <span className="text-lg font-semibold">{t.valor}%</span>
        </div>
      ))}
    </div>
  );
}

function EtapaCard({ etapa }: { etapa: EmbudoEtapaMetric }) {
  // SYSGAL para el día específico de ingreso que corresponde a esta etapa.
  const { estado, count } = useSysgalConteo('clientes-ingreso', etapa.desde_ingreso, etapa.hasta_ingreso);

  const valorSysgal: ReactNode =
    estado === 'listo' ? formatNumber(count ?? 0)
    : estado === 'error' ? <AlertTriangle className="h-5 w-5 text-amber-500" />
    : <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;

  const sinEntrar = estado === 'listo' && count !== null ? Math.max(count - etapa.entraron, 0) : 0;
  const notaEntraron = estado !== 'listo' || count === null
    ? null
    : sinEntrar === 0
      ? 'entraron todos'
      : `${formatNumber(sinEntrar)} aún no`;
  const sinRecibir = Math.max(etapa.entraron - etapa.recibieron, 0);
  const notaRecibieron = sinRecibir > 0 ? `${formatNumber(sinRecibir)} sin recibir` : null;

  return (
    <Card className="border-l-4 border-l-segal-blue/40 dark:border-l-segal-turquoise/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{etapa.label}</CardTitle>
        <CardDescription className="text-xs">
          Email a los <strong>{etapa.offset_dias} días</strong> del ingreso · ingreso = {etapa.desde_ingreso}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <Paso icon={<FileText className="h-4 w-4" />} label="SYSGAL" valor={valorSysgal} nota="clientes" />
          <Flecha />
          <Paso icon={<UserPlus className="h-4 w-4" />} label="Entraron" valor={formatNumber(etapa.entraron)} nota={notaEntraron} />
          <Flecha />
          <Paso icon={<MailCheck className="h-4 w-4" />} label="Recibieron" valor={formatNumber(etapa.recibieron)} nota={notaRecibieron} />
          <Flecha />
          <Paso icon={<Eye className="h-4 w-4" />} label="Abrieron" valor={formatNumber(etapa.abrieron)} nota={`${etapa.tasa_apertura}% apertura`} />
        </div>
        <MiniTasas etapa={etapa} />
      </CardContent>
    </Card>
  );
}

export function EmbudosPorEtapa({ etapas, className = '' }: EmbudosPorEtapaProps) {
  if (!etapas || etapas.length === 0) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold tracking-tight">Embudo por etapa del flujo</h3>
        <p className="text-sm text-muted-foreground">
          Cada etapa envía el email un número específico de días después del ingreso del cliente.
          El SYSGAL, los que entraron y las tasas se calculan para la cohorte específica de cada
          etapa según el día seleccionado.
        </p>
      </div>
      {etapas.map((etapa) => (
        <EtapaCard key={etapa.stage_id} etapa={etapa} />
      ))}
    </div>
  );
}

export default EmbudosPorEtapa;
