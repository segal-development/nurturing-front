/**
 * KpiSummary Component
 *
 * Displays the main KPI cards at the top of the dashboard.
 */

import { Mail, MousePointerClick, UserMinus, Send, Eye, UserPlus } from 'lucide-react';
import { MetricCard } from './MetricCard';
import type { ClientesIngresadosMetric, MetricSummary, TrendsMetrics } from '@/types/metricas';

// ============================================================
// TYPES
// ============================================================

interface KpiSummaryProps {
  summary: MetricSummary;
  trends?: TrendsMetrics;
  clientesIngresados?: ClientesIngresadosMetric;
  /** true cuando hay un flujo seleccionado: "Clientes ingresados" pasa a ser de ese flujo */
  porFlujo?: boolean;
  className?: string;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function KpiSummary({
  summary,
  trends,
  clientesIngresados,
  porFlujo = false,
  className = '',
}: KpiSummaryProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Separador: deja claro que estas tarjetas miden los EMAILS de la campaña,
          NO los ingresos que reporta SYSGAL (que es la tarjeta de arriba). */}
      <div>
        <h3 className="text-sm font-semibold tracking-tight">
          {porFlujo ? 'Rendimiento de los emails de esta campaña' : 'Rendimiento de emails'}
        </h3>
        <p className="text-xs text-muted-foreground">
          {porFlujo
            ? 'Mide los correos que envió la campaña. Es distinto del total que ingresó a SYSGAL (arriba): no todos los que ingresan entran a recibir el email.'
            : 'Resumen de los correos enviados en el período.'}
        </p>
      </div>

      {/* Orden de embudo: entran → se les envía → llega → abren → clickean → se dan de baja */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6">
        <MetricCard
          title={porFlujo ? 'Incorporados al flujo' : 'Clientes ingresados'}
          value={clientesIngresados?.total ?? 0}
          subtitle={porFlujo ? 'Nuevos que entraron a la campaña' : 'Entraron al sistema (total)'}
          icon={<UserPlus className="h-4 w-4" />}
        />

        <MetricCard
          title="Total Envíos"
          value={summary.total_envios}
          subtitle={`${summary.envios_exitosos} exitosos`}
          trend={trends?.envios}
          icon={<Send className="h-4 w-4" />}
        />

        <MetricCard
          title="Tasa de Entrega"
          value={summary.tasas.entrega}
          isPercentage
          icon={<Mail className="h-4 w-4" />}
        />

        <MetricCard
          title="Tasa de Apertura"
          value={summary.tasas.apertura}
          subtitle={`${summary.aperturas_unicas} únicos`}
          isPercentage
          trend={trends?.aperturas}
          icon={<Eye className="h-4 w-4" />}
        />

        <MetricCard
          title="CTR (Click-Through)"
          value={summary.tasas.ctr}
          subtitle={`${summary.clicks_unicos} clicks únicos`}
          isPercentage
          trend={trends?.clicks}
          icon={<MousePointerClick className="h-4 w-4" />}
        />

        <MetricCard
          title="Desuscripciones"
          value={summary.desuscripciones}
          subtitle={`${summary.tasas.desuscripcion}% del total`}
          trend={trends?.desuscripciones}
          isInverseMetric
          icon={<UserMinus className="h-4 w-4" />}
        />
      </div>
    </div>
  );
}

export default KpiSummary;
