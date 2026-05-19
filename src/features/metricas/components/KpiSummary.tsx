/**
 * KpiSummary Component
 *
 * Displays the main KPI cards at the top of the dashboard.
 */

import { Mail, MousePointerClick, UserMinus, Send, Eye } from 'lucide-react';
import { MetricCard } from './MetricCard';
import type { MetricSummary, TrendsMetrics } from '@/types/metricas';

// ============================================================
// TYPES
// ============================================================

interface KpiSummaryProps {
  summary: MetricSummary;
  trends?: TrendsMetrics;
  className?: string;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function KpiSummary({ summary, trends, className = '' }: KpiSummaryProps) {
  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 ${className}`}>
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
  );
}

export default KpiSummary;
