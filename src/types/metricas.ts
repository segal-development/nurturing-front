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
  flujo_id?: number | null; // null/omitido = todos los flujos
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

export interface NuevosProspectosPorFlujo {
  flujo_id: number;
  flujo_nombre: string;
  total: number;
}

export interface NuevosProspectosMetric {
  total: number;
  promedio_diario: number;
  por_dia: Array<{ fecha: string; total: number }>;
  /** Solo populated cuando no hay filtro de flujo, para dar contexto al total */
  por_flujo?: NuevosProspectosPorFlujo[];
}

export interface EnviosHoyEtapa {
  node_id: string;
  etapa_nombre: string;
  total: number;
  ultimo?: string | null;
}

export interface EnviosHoyMetric {
  total_hoy: number;
  por_etapa_hoy: EnviosHoyEtapa[];
  /** Solo populated cuando total_hoy === 0: último envío histórico por etapa */
  ultimo_por_etapa: EnviosHoyEtapa[];
}

export type MotivoProblemaEnvio = 'sin_email' | 'email_invalido' | 'sin_telefono';

export interface ProblemaEnvioDetalle {
  prospecto_id: number;
  nombre: string | null;
  rut: string | null;
  motivos: MotivoProblemaEnvio[];
  /** Código del validador, ej: "dominio_typo:gmial.com", "tld_invalido:ccom" */
  email_invalido_motivo: string | null;
}

/**
 * Prospectos del flujo con datos que impiden el envío por algún canal.
 * El canal se deriva de los stages reales del flujo (tipo_mensaje).
 */
export interface ProblemasEnvioMetric {
  canal: 'email' | 'sms' | 'ambos';
  por_flujo: boolean;
  total_miembros: number;
  total_con_problemas: number;
  /** No tienen NINGÚN canal válido (no recibieron nada) */
  no_contactables: number;
  por_motivo: {
    sin_email?: number;
    email_invalido?: number;
    sin_telefono?: number;
  };
  detalle: ProblemaEnvioDetalle[];
  detalle_truncado: boolean;
}

/** Clientes que ingresaron al sistema (prospectos creados), independiente de si fueron asignados a un flujo */
export interface ClientesIngresadosMetric {
  total: number;
  por_dia: Array<{ fecha: string; total: number }>;
}

/** Un endpoint reconciliado (contratos | clientes-ingreso): cuánto reporta SYSGAL vs lo explicado. */
export interface ReconciliacionEndpoint {
  endpoint: string;
  sysgal_total: number;
  desglose: {
    ingresado: number;
    sin_contacto: number;
    sin_nombre: number;
    sin_tipo: number;
    duplicado: number;
    faltante: number;
  };
  explicado: number;
  sin_explicar: number;
  cuadra: boolean;
  faltantes_count: number;
  faltantes_ids: Array<string | number>;
}

/** Reconciliación de un endpoint en dos ventanas: hoy y mes en curso. */
export interface ReconciliacionPorPeriodo {
  hoy?: ReconciliacionEndpoint;
  ayer?: ReconciliacionEndpoint;
  mes?: ReconciliacionEndpoint;
}

/** Reconciliación SYSGAL ↔ ingresados (hoy + mes), cacheada por nurturing:cache-reconciliacion. */
export interface ReconciliacionSysgalMetric {
  contratos?: ReconciliacionPorPeriodo;
  'clientes-ingreso'?: ReconciliacionPorPeriodo;
  generado_at?: string;
}

export interface MetricasDashboard {
  resumen: MetricSummary;
  aperturas: AperturasMetrics;
  clicks: ClicksMetrics;
  envios: EnviosMetrics;
  desuscripciones: DesuscripcionesMetrics;
  conversiones: ConversionesMetrics;
  tendencias: TrendsMetrics;
  nuevos_prospectos: NuevosProspectosMetric;
  /** Clientes que ingresaron al sistema (prospectos creados). Distinto de nuevos_prospectos que cuenta incorporaciones a flujos. */
  clientes_ingresados?: ClientesIngresadosMetric;
  problemas_envio: ProblemasEnvioMetric;
  /** Reconciliación SYSGAL ↔ ingresados (mes en curso), cacheada. null si aún no se computó. */
  reconciliacion_sysgal?: ReconciliacionSysgalMetric | null;
  envios_hoy?: EnviosHoyMetric;
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
