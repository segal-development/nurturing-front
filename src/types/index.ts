/**
 * Barrel file para exportar todos los tipos del proyecto
 * 
 * Esto permite importar tipos de forma más limpia:
 * 
 * @example
 * // Antes:
 * import type { User } from '@/types/auth'
 * import type { Prospecto } from '@/types/prospecto'
 * import type { FlujoNurturing } from '@/types/flujo'
 * 
 * // Después:
 * import type { User, Prospecto, FlujoNurturing } from '@/types'
 */

// ============================================================================
// Auth Types
// ============================================================================
export type {
  AuthError,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
} from './auth'

// ============================================================================
// Prospecto Types
// ============================================================================
export type {
  EstadoProspecto,
  PaginatedResponse,
  Prospecto,
  ProspectoEstadisticas,
  ProspectoExcelRow,
  ProspectoFormData,
  TipoProspectoBackend,
} from './prospecto'

// ============================================================================
// Flujo Types
// ============================================================================
export type {
  CondicionFlujo,
  ConfigStructure,
  ConfigVisual,
  DetalleEnvio,
  EjecucionFlujo,
  EjecucionFlujoStats,
  EstadisticasFlujo,
  EtapaFlujo,
  EtapaFormData,
  FlujoFormData,
  FlujoNurturing,
  NodoFinalFlujo,
  ProspectoEnFlujo,
  RamificacionFlujo,
  TipoMensaje,
  TipoProspectoObject,
} from './flujo'

// ============================================================================
// Envio Types (envio.ts - legacy)
// ============================================================================
export type {
  DashboardStats,
  EnvioProgramado,
  EstadoEnvio,
  HistorialEnvio,
  TipoEnvio,
} from './envio'

// ============================================================================
// Envios Types (envios.ts - newer)
// ============================================================================
export type {
  Envio,
  EnvioCanal,
  EnvioEstado,
  EnviosDailyStatsResponse,
  EnviosFilterOptions,
  EnviosFilters,
  EnviosFlowStats,
  EnviosFlowStatsResponse,
  EnviosListResponse,
  EnviosStats,
  EnviosTodayStats,
  PeriodStats,
} from './envios'

// ============================================================================
// Flow Execution Types
// ============================================================================
export type {
  ExecutionEvent,
  ExecutionEventType,
  ExecutionMetrics,
  FlowExecution,
  FlowExecutionResponse,
  FlowExecutionState,
  StartFlowExecutionPayload,
  StartFlowExecutionResponse,
} from './flowExecution'

// ============================================================================
// Flow Execution Tracking Types
// ============================================================================
export type {
  ActiveExecutionInfo,
  ActiveExecutionResponse,
  CancelExecutionResponse,
  EvaluatedCondition,
  ExecutionConditionEvaluation,
  ExecutionJob,
  ExecutionProgress,
  ExecutionTimeline,
  FlowExecutionDetail,
  FlowExecutionDetailResponse,
  FlowExecutionMainState,
  FlowExecutionsListResponse,
  FlowExecutionVisualization,
  FlowNodeInfo,
  PauseExecutionPayload,
  PauseExecutionResponse,
  ResumeExecutionResponse,
  StageEnvios,
  StageExecution,
  StageExecutionState,
  StageProgressStats,
} from './flowExecutionTracking'

// ============================================================================
// Plantilla Types
// ============================================================================
export type {
  AnyEmailComponent,
  AnyPlantilla,
  BotonComponent,
  EmailComponent,
  FooterComponent,
  GuardarPlantillaResponse,
  LogoComponent,
  PlantillaBase,
  PlantillaEmail,
  PlantillaSMS,
  PlantillasResponse,
  SeparadorComponent,
  TextoComponent,
  ValidacionPlantilla,
} from './plantilla'

// ============================================================================
// Oferta Types
// ============================================================================
export type { OfertaFormData, OfertaInfocom } from './oferta'

// ============================================================================
// Importacion Types
// ============================================================================
export type { Importacion, ImportarResponse } from './importacion'

// ============================================================================
// Configuracion Types
// ============================================================================
export type {
  ActualizarConfiguracionPayload,
  Configuracion,
  ConfiguracionLimites,
  ConfiguracionNotificaciones,
  ConfiguracionPrecio,
} from './configuracion'
