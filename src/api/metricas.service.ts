/**
 * MetricasService
 *
 * Handles all API calls related to metrics and analytics.
 * Follows Single Responsibility Principle - only handles API communication.
 *
 * @example
 * const dashboard = await metricasService.getDashboard(30);
 * const aperturas = await metricasService.getAperturas(7);
 */

import { apiClient } from './client';
import type {
  MetricasDashboard,
  MetricSummary,
  AperturasMetrics,
  ClicksMetrics,
  EnviosMetrics,
  DesuscripcionesMetrics,
  ConversionesMetrics,
  TrendsMetrics,
  TopFlujoMetric,
  MetricasApiResponse,
  MetricsParams,
} from '@/types/metricas';

// ============================================================
// SERVICE CLASS
// ============================================================

class MetricasService {
  private readonly basePath = '/metricas';

  // ============================================================
  // HELPER METHODS
  // ============================================================

  /**
   * Builds query params for API calls
   * Supports both period-based (dias) and custom date range (fecha_inicio, fecha_fin)
   */
  private buildParams(params: MetricsParams): Record<string, string | number> {
    const queryParams: Record<string, string | number> = {};

    if (params.fecha_inicio && params.fecha_fin) {
      // Custom date range takes priority
      queryParams.fecha_inicio = params.fecha_inicio;
      queryParams.fecha_fin = params.fecha_fin;
    } else if (params.dias && params.dias > 0) {
      // Period-based query
      queryParams.dias = params.dias;
    } else {
      // Default to 30 days
      queryParams.dias = 30;
    }

    if (params.flujo_id != null) {
      queryParams.flujo_id = params.flujo_id;
    }

    return queryParams;
  }

  // ============================================================
  // MAIN DASHBOARD
  // ============================================================

  /**
   * Fetches the complete metrics dashboard
   *
   * @param params - Period in days or custom date range
   * @returns Full dashboard data with all metrics
   */
  async getDashboard(params: MetricsParams = { dias: 30 }): Promise<MetricasDashboard> {
    const response = await apiClient.get<MetricasApiResponse<MetricasDashboard>>(
      `${this.basePath}/dashboard`,
      { params: this.buildParams(params) }
    );

    return response.data.data;
  }

  // ============================================================
  // INDIVIDUAL SECTIONS
  // ============================================================

  /**
   * Fetches KPI summary metrics
   */
  async getResumen(params: MetricsParams = { dias: 30 }): Promise<MetricSummary> {
    const response = await apiClient.get<MetricasApiResponse<MetricSummary>>(
      `${this.basePath}/resumen`,
      { params: this.buildParams(params) }
    );

    return response.data.data;
  }

  /**
   * Fetches email open metrics
   */
  async getAperturas(params: MetricsParams = { dias: 30 }): Promise<AperturasMetrics> {
    const response = await apiClient.get<MetricasApiResponse<AperturasMetrics>>(
      `${this.basePath}/aperturas`,
      { params: this.buildParams(params) }
    );

    return response.data.data;
  }

  /**
   * Fetches click metrics
   */
  async getClicks(params: MetricsParams = { dias: 30 }): Promise<ClicksMetrics> {
    const response = await apiClient.get<MetricasApiResponse<ClicksMetrics>>(
      `${this.basePath}/clicks`,
      { params: this.buildParams(params) }
    );

    return response.data.data;
  }

  /**
   * Fetches send/delivery metrics
   */
  async getEnvios(params: MetricsParams = { dias: 30 }): Promise<EnviosMetrics> {
    const response = await apiClient.get<MetricasApiResponse<EnviosMetrics>>(
      `${this.basePath}/envios`,
      { params: this.buildParams(params) }
    );

    return response.data.data;
  }

  /**
   * Fetches unsubscribe metrics
   */
  async getDesuscripciones(params: MetricsParams = { dias: 30 }): Promise<DesuscripcionesMetrics> {
    const response = await apiClient.get<MetricasApiResponse<DesuscripcionesMetrics>>(
      `${this.basePath}/desuscripciones`,
      { params: this.buildParams(params) }
    );

    return response.data.data;
  }

  /**
   * Fetches conversion metrics
   */
  async getConversiones(params: MetricsParams = { dias: 30 }): Promise<ConversionesMetrics> {
    const response = await apiClient.get<MetricasApiResponse<ConversionesMetrics>>(
      `${this.basePath}/conversiones`,
      { params: this.buildParams(params) }
    );

    return response.data.data;
  }

  /**
   * Fetches trend comparison (current vs previous period)
   */
  async getTendencias(params: MetricsParams = { dias: 30 }): Promise<TrendsMetrics> {
    const response = await apiClient.get<MetricasApiResponse<TrendsMetrics>>(
      `${this.basePath}/tendencias`,
      { params: this.buildParams(params) }
    );

    return response.data.data;
  }

  /**
   * Fetches top performing flows
   */
  async getTopFlujos(params: MetricsParams = { dias: 30 }, limit = 10): Promise<TopFlujoMetric[]> {
    const response = await apiClient.get<MetricasApiResponse<TopFlujoMetric[]>>(
      `${this.basePath}/top-flujos`,
      { params: { ...this.buildParams(params), limit } }
    );

    return response.data.data;
  }

  // ============================================================
  // CACHE MANAGEMENT
  // ============================================================

  /**
   * Invalidates the metrics cache for fresh data
   */
  async refreshCache(): Promise<void> {
    await apiClient.post(`${this.basePath}/refresh`);
  }
}

// ============================================================
// SINGLETON EXPORT
// ============================================================

export const metricasService = new MetricasService();
export default metricasService;
