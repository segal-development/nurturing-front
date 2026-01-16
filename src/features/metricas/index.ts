/**
 * Metricas feature barrel export
 */

// Page
export { MetricasPage } from './MetricasPage';

// Hooks
export {
  useMetricasDashboard,
  useMetricasResumen,
  useMetricasAperturas,
  useMetricasClicks,
  useMetricasEnvios,
  useMetricasDesuscripciones,
  useMetricasConversiones,
  useMetricasTendencias,
  useMetricasTopFlujos,
  useRefreshMetricas,
  metricasQueryKeys,
} from './hooks/useMetricas';

// Components
export * from './components';

// Utils
export * from './utils/formatters';
