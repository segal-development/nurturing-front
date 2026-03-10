/**
 * Types for the metrics/analytics dashboard
 *
 * Follows const types pattern for string unions
 * and flat interfaces for nested data
 */

// ============================================================
// CONST TYPES
// ============================================================

export const METRIC_PERIOD = {
  TODAY: 1,
  WEEK: 7,
  MONTH: 30,
  QUARTER: 90,
  YEAR: 365,
  CUSTOM: 0, // Indicates custom date range
} as const;

export type MetricPeriod = (typeof METRIC_PERIOD)[keyof typeof METRIC_PERIOD];

// Custom date range for when METRIC_PERIOD.CUSTOM is selected
export interface DateRange {
  from: Date;
  to: Date;
}

// Parameters for metrics API calls
export interface MetricsParams {
  dias?: MetricPeriod;
  fecha_inicio?: string; // ISO date string YYYY-MM-DD
  fecha_fin?: string; // ISO date string YYYY-MM-DD
}

export const TREND_DIRECTION = {
  UP: 'up',
  DOWN: 'down',
  STABLE: 'stable',
} as const;

export type TrendDirection = (typeof TREND_DIRECTION)[keyof typeof TREND_DIRECTION];

export const DEVICE_TYPE = {
  DESKTOP: 'desktop',
  MOBILE: 'mobile',
  TABLET: 'tablet',
  UNKNOWN: 'desconocido',
} as const;

export type DeviceType = (typeof DEVICE_TYPE)[keyof typeof DEVICE_TYPE];

export const EMAIL_CLIENT = {
  GMAIL: 'Gmail',
  APPLE_MAIL: 'Apple Mail',
  IOS_MAIL: 'iOS Mail',
  OUTLOOK: 'Outlook',
  YAHOO: 'Yahoo Mail',
  THUNDERBIRD: 'Thunderbird',
  OTHER: 'Otro',
  UNKNOWN: 'desconocido',
} as const;

export type EmailClient = (typeof EMAIL_CLIENT)[keyof typeof EMAIL_CLIENT];

// ============================================================
// RATE INTERFACES
// ============================================================

export interface MetricRates {
  entrega: number;
  apertura: number;
  click: number;
  ctr: number;
  desuscripcion: number;
}

// ============================================================
// SUMMARY INTERFACES
// ============================================================

export interface MetricSummary {
  periodo_dias: number;
  total_envios: number;
  envios_exitosos: number;
  total_aperturas: number;
  aperturas_unicas: number;
  total_clicks: number;
  clicks_unicos: number;
  desuscripciones: number;
  conversiones: number;
  tasas: MetricRates;
}

// ============================================================
// DAILY DATA INTERFACES
// ============================================================

export interface DailyMetric {
  fecha: string;
  total: number;
  unicos?: number;
}

export interface DailyEnvioMetric {
  fecha: string;
  exitosos: number;
  fallidos: number;
  pendientes: number;
}

// ============================================================
// BY FLUJO INTERFACES
// ============================================================

export interface FlujoAperturaMetric {
  flujo_id: number;
  flujo_nombre: string;
  total_aperturas: number;
  aperturas_unicas: number;
}

export interface FlujoClickMetric {
  flujo_id: number;
  flujo_nombre: string;
  total_clicks: number;
  clicks_unicos: number;
}

export interface FlujoEnvioMetric {
  flujo_id: number;
  flujo_nombre: string;
  total: number;
  exitosos: number;
  fallidos: number;
}

export interface FlujoDesuscripcionMetric {
  flujo_id: number;
  flujo_nombre: string | null;
  total: number;
}

// ============================================================
// DEVICE AND CLIENT INTERFACES
// ============================================================

export interface DeviceMetric {
  dispositivo: DeviceType;
  total: number;
}

export interface EmailClientMetric {
  cliente_email: EmailClient;
  total: number;
}

export interface HourlyMetric {
  hora: number;
  total: number;
}

export interface UrlClickMetric {
  url_destino: string;
  total: number;
}

export interface MotivoDesuscripcionMetric {
  motivo: string;
  total: number;
}

// ============================================================
// CHANNEL DISTRIBUTION
// ============================================================

export interface ChannelDistribution {
  email?: number;
  sms?: number;
  todos?: number;
}

export interface EnvioEstadoDistribution {
  enviado?: number;
  entregado?: number;
  fallido?: number;
  pendiente?: number;
  [key: string]: number | undefined;
}

// ============================================================
// SECTION METRICS INTERFACES
// ============================================================

export interface AperturasMetrics {
  por_dia: DailyMetric[];
  por_flujo: FlujoAperturaMetric[];
  por_dispositivo: DeviceMetric[];
  por_cliente_email: EmailClientMetric[];
  por_hora: HourlyMetric[];
}

export interface ClicksMetrics {
  por_dia: DailyMetric[];
  por_flujo: FlujoClickMetric[];
  top_urls: UrlClickMetric[];
}

export interface EnviosMetrics {
  por_estado: EnvioEstadoDistribution;
  por_canal: ChannelDistribution;
  por_dia: DailyEnvioMetric[];
  por_flujo: FlujoEnvioMetric[];
}

export interface DesuscripcionesMetrics {
  total: number;
  por_canal: ChannelDistribution;
  por_motivo: MotivoDesuscripcionMetric[];
  por_dia: DailyMetric[];
  por_flujo: FlujoDesuscripcionMetric[];
}

export interface TipoProspectoConversion {
  tipo: string;
  total: number;
}

export interface ConversionesMetrics {
  total: number;
  tasa_conversion: number;
  por_tipo: TipoProspectoConversion[];
  por_dia: DailyMetric[];
}

// ============================================================
// TREND INTERFACES
// ============================================================

export interface TrendData {
  actual: number;
  anterior: number;
  cambio_porcentaje: number;
  direccion: TrendDirection;
}

export interface TrendsMetrics {
  envios: TrendData;
  aperturas: TrendData;
  clicks: TrendData;
  desuscripciones: TrendData;
}

// ============================================================
// TOP FLUJOS
// ============================================================

export interface TopFlujoMetric {
  id: number;
  nombre: string;
  total_envios: number;
  total_aperturas: number;
  total_clicks: number;
  tasa_apertura: number;
  ctr: number;
}

// ============================================================
// FULL DASHBOARD RESPONSE
// ============================================================

export interface MetricasDashboard {
  resumen: MetricSummary;
  aperturas: AperturasMetrics;
  clicks: ClicksMetrics;
  envios: EnviosMetrics;
  desuscripciones: DesuscripcionesMetrics;
  conversiones: ConversionesMetrics;
  tendencias: TrendsMetrics;
  top_flujos: TopFlujoMetric[];
  generado_at: string;
}

// ============================================================
// API RESPONSE WRAPPER
// ============================================================

export interface MetricasApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
