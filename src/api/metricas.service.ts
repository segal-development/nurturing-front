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
  MetricPeriod,
} from '@/types/metricas';

// ============================================================
// SERVICE CLASS
// ============================================================

class MetricasService {
  private readonly basePath = '/metricas';

  // ============================================================
  // MAIN DASHBOARD
  // ============================================================

  /**
   * Fetches the complete metrics dashboard
   *
   * @param dias - Period in days (7, 30, 90, 365)
   * @returns Full dashboard data with all metrics
   */
  async getDashboard(dias: MetricPeriod = 30): Promise<MetricasDashboard> {
    const response = await apiClient.get<MetricasApiResponse<MetricasDashboard>>(
      `${this.basePath}/dashboard`,
      { params: { dias } }
    );

    return response.data.data;
  }

  // ============================================================
  // INDIVIDUAL SECTIONS
  // ============================================================

  /**
   * Fetches KPI summary metrics
   */
  async getResumen(dias: MetricPeriod = 30): Promise<MetricSummary> {
    const response = await apiClient.get<MetricasApiResponse<MetricSummary>>(
      `${this.basePath}/resumen`,
      { params: { dias } }
    );

    return response.data.data;
  }

  /**
   * Fetches email open metrics
   */
  async getAperturas(dias: MetricPeriod = 30): Promise<AperturasMetrics> {
    const response = await apiClient.get<MetricasApiResponse<AperturasMetrics>>(
      `${this.basePath}/aperturas`,
      { params: { dias } }
    );

    return response.data.data;
  }

  /**
   * Fetches click metrics
   */
  async getClicks(dias: MetricPeriod = 30): Promise<ClicksMetrics> {
    const response = await apiClient.get<MetricasApiResponse<ClicksMetrics>>(
      `${this.basePath}/clicks`,
      { params: { dias } }
    );

    return response.data.data;
  }

  /**
   * Fetches send/delivery metrics
   */
  async getEnvios(dias: MetricPeriod = 30): Promise<EnviosMetrics> {
    const response = await apiClient.get<MetricasApiResponse<EnviosMetrics>>(
      `${this.basePath}/envios`,
      { params: { dias } }
    );

    return response.data.data;
  }

  /**
   * Fetches unsubscribe metrics
   */
  async getDesuscripciones(dias: MetricPeriod = 30): Promise<DesuscripcionesMetrics> {
    const response = await apiClient.get<MetricasApiResponse<DesuscripcionesMetrics>>(
      `${this.basePath}/desuscripciones`,
      { params: { dias } }
    );

    return response.data.data;
  }

  /**
   * Fetches conversion metrics
   */
  async getConversiones(dias: MetricPeriod = 30): Promise<ConversionesMetrics> {
    const response = await apiClient.get<MetricasApiResponse<ConversionesMetrics>>(
      `${this.basePath}/conversiones`,
      { params: { dias } }
    );

    return response.data.data;
  }

  /**
   * Fetches trend comparison (current vs previous period)
   */
  async getTendencias(dias: MetricPeriod = 30): Promise<TrendsMetrics> {
    const response = await apiClient.get<MetricasApiResponse<TrendsMetrics>>(
      `${this.basePath}/tendencias`,
      { params: { dias } }
    );

    return response.data.data;
  }

  /**
   * Fetches top performing flows
   */
  async getTopFlujos(dias: MetricPeriod = 30, limit = 10): Promise<TopFlujoMetric[]> {
    const response = await apiClient.get<MetricasApiResponse<TopFlujoMetric[]>>(
      `${this.basePath}/top-flujos`,
      { params: { dias, limit } }
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
