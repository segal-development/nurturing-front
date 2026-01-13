import type { Node, Edge } from 'reactflow'
import type { Prospecto } from './prospecto'

// ============================================================================
// Canal de Envío Types & Utils
// ============================================================================

/**
 * Tipos de mensaje/canal de envío disponibles.
 * Mantener sincronizado con App\Enums\CanalEnvio en el backend.
 */
export type CanalEnvio = 'email' | 'sms' | 'ambos'

/** @deprecated Use CanalEnvio instead */
export type TipoMensaje = CanalEnvio

/**
 * Configuración de cada canal de envío para mostrar en UI.
 */
export interface CanalEnvioConfig {
  readonly value: CanalEnvio
  readonly label: string
  readonly icon: string
  readonly description: string
}

/**
 * Mapa de configuración para cada canal de envío.
 * Inmutable y type-safe.
 */
export const CANAL_ENVIO_CONFIG: Readonly<Record<CanalEnvio, CanalEnvioConfig>> = {
  email: {
    value: 'email',
    label: 'Email',
    icon: '📧',
    description: 'Solo correo electrónico',
  },
  sms: {
    value: 'sms',
    label: 'SMS',
    icon: '📱',
    description: 'Solo mensajes de texto',
  },
  ambos: {
    value: 'ambos',
    label: 'Email y SMS',
    icon: '📨',
    description: 'Correo electrónico y mensajes de texto',
  },
} as const

/**
 * Obtiene el label para un canal de envío.
 */
export function getCanalEnvioLabel(canal: CanalEnvio | string | undefined): string {
  if (!canal) return CANAL_ENVIO_CONFIG.email.label
  
  const config = CANAL_ENVIO_CONFIG[canal as CanalEnvio]
  return config?.label ?? canal
}

/**
 * Obtiene el icono para un canal de envío.
 */
export function getCanalEnvioIcon(canal: CanalEnvio | string | undefined): string {
  if (!canal) return CANAL_ENVIO_CONFIG.email.icon
  
  const config = CANAL_ENVIO_CONFIG[canal as CanalEnvio]
  return config?.icon ?? '📧'
}

/**
 * Infiere el canal de envío basándose en las etapas del flujo.
 * Replica la lógica del backend CanalEnvioResolver.
 * 
 * @param etapas - Array de etapas con tipo_mensaje
 * @returns El canal inferido
 */
export function inferirCanalEnvioDesdeEtapas(
  etapas: Array<{ tipo_mensaje?: string }> | undefined
): CanalEnvio {
  if (!etapas || etapas.length === 0) {
    return 'email' // Default cuando no hay etapas
  }

  const tiposValidos = etapas
    .map((e) => e.tipo_mensaje?.toLowerCase())
    .filter((t): t is string => t === 'email' || t === 'sms')

  if (tiposValidos.length === 0) {
    return 'email'
  }

  const uniqueTipos = [...new Set(tiposValidos)]

  if (uniqueTipos.length === 1) {
    return uniqueTipos[0] as CanalEnvio
  }

  return 'ambos'
}

/**
 * Obtiene el canal de envío "real" de un flujo.
 * Prioriza el canal inferido de las etapas sobre el campo canal_envio.
 * 
 * @param flujo - El flujo a analizar
 * @returns El canal de envío correcto
 */
export function getCanalEnvioReal(flujo: {
  canal_envio?: string
  flujo_etapas?: Array<{ tipo_mensaje?: string }>
  config_structure?: { stages?: Array<{ tipo_mensaje?: string }> }
}): CanalEnvio {
  // Prioridad 1: Etapas cargadas de la BD
  if (flujo.flujo_etapas && flujo.flujo_etapas.length > 0) {
    return inferirCanalEnvioDesdeEtapas(flujo.flujo_etapas)
  }

  // Prioridad 2: Estructura guardada
  if (flujo.config_structure?.stages && flujo.config_structure.stages.length > 0) {
    return inferirCanalEnvioDesdeEtapas(flujo.config_structure.stages)
  }

  // Fallback: usar el campo canal_envio
  const canal = flujo.canal_envio?.toLowerCase()
  if (canal === 'email' || canal === 'sms' || canal === 'ambos') {
    return canal
  }

  return 'email'
}

// ============================================================================
// Legacy Types (mantener compatibilidad)
// ============================================================================

export interface TipoProspectoObject {
  id: number;
  nombre: string;
  descripcion?: string;
  monto_min?: number;
  monto_max?: number;
  orden?: number;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EtapaFlujo {
  id: number;
  flujo_id: number;
  dia_envio: number;
  tipo_mensaje: TipoMensaje;
  // Plantilla: either ID reference or inline content
  plantilla_id?: number; // Reference to saved plantilla (SMS or Email)
  plantilla_id_email?: number; // For tipo_mensaje='ambos': Email plantilla ID
  plantilla_mensaje?: string; // Fallback: inline template content
  plantilla_type?: 'reference' | 'inline'; // Which type is being used
  oferta_infocom_id?: number;
  oferta?: {
    id: number;
    titulo: string;
  };
  activo: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Condición para ramificaciones en el flujo
 */
export interface CondicionFlujo {
  id: number;
  flujo_id: number;
  tipo: string;
  descripcion?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Ramificación/conexión condicional en el flujo
 */
export interface RamificacionFlujo {
  id: number;
  flujo_id: number;
  nodo_origen_id: number;
  nodo_destino_id: number;
  condicion_id?: number;
  etiqueta?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Nodo final del flujo
 */
export interface NodoFinalFlujo {
  id: number;
  flujo_id: number;
  tipo: string;
  descripcion?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Estadísticas completas de un flujo
 */
export interface EstadisticasFlujo {
  total_prospectos: number;
  prospectos_pendientes: number;
  prospectos_en_proceso: number;
  prospectos_completados: number;
  prospectos_cancelados: number;
  total_etapas: number;
  total_condiciones: number;
  total_ramificaciones: number;
  total_nodos_finales: number;
}

/**
 * Configuración visual del flujo (para reconstruir en editor)
 * Uses ReactFlow Node and Edge types with generic data
 */
export interface ConfigVisual {
  nodes: Node[];
  edges: Edge[];
}

/**
 * Initial node data in config structure
 */
export interface InitialNodeConfig {
  id: string;
  label: string;
  origen_id?: string;
  origen_nombre?: string;
  prospectos_count?: number;
  position?: { x: number; y: number };
}

/**
 * Configuración estructural del flujo (para ejecución)
 */
export interface ConfigStructure {
  stages: EtapaFlujo[];
  conditions: CondicionFlujo[];
  branches: RamificacionFlujo[];
  initial_node: InitialNodeConfig;
  end_nodes: NodoFinalFlujo[];
}

/**
 * Prospecto en un flujo (relación)
 */
export interface ProspectoEnFlujo {
  id: number;
  flujo_id: number;
  prospecto_id: number;
  prospecto?: Prospecto;
  estado: 'pendiente' | 'en_proceso' | 'completado' | 'cancelado';
  created_at: string;
  updated_at: string;
}

export interface FlujoNurturing {
  id: number;
  nombre: string;
  descripcion?: string;
  tipo_prospecto: string | TipoProspectoObject;
  tipo_prospecto_id?: number;
  origen_id?: string;
  origen?: string;
  canal_envio?: string;
  activo: boolean;
  user_id?: number;
  user?: {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  metadata?: Record<string, unknown>;

  /**
   * Estado de procesamiento de asignación de prospectos.
   * Cuando se crean flujos con >100 prospectos, se procesan en background.
   */
  estado_procesamiento?: 'pendiente' | 'procesando' | 'completado' | 'fallido';

  // Configuraciones para reconstrucción y ejecución
  config_visual?: ConfigVisual;
  config_structure?: ConfigStructure;

  // Relaciones cargadas
  etapas?: EtapaFlujo[];
  flujo_etapas?: EtapaFlujo[];
  flujo_condiciones?: CondicionFlujo[];
  flujo_ramificaciones?: RamificacionFlujo[];
  flujo_nodos_finales?: NodoFinalFlujo[];
  prospectos_en_flujo?: ProspectoEnFlujo[];
  flujo_ejecuciones?: EjecucionFlujo[];

  // Conteos
  prospectos_en_flujo_count?: number;

  // Estadísticas
  estadisticas?: EstadisticasFlujo;

  created_at: string;
  updated_at: string;
}

export interface FlujoFormData {
  nombre: string;
  descripcion?: string;
  tipo_prospecto: string;
  activo: boolean;
}

export interface EtapaFormData {
  dia_envio: number;
  tipo_mensaje: TipoMensaje;
  plantilla_mensaje: string;
  oferta_infocom_id?: number;
  activo: boolean;
}

/**
 * Detalle de envío individual para un prospecto
 */
export interface DetalleEnvio {
  id?: number;
  prospecto_id: number;
  prospecto_nombre: string;
  prospecto_email?: string;
  prospecto_telefono?: string;
  tipo_mensaje: 'email' | 'sms';
  estado: 'enviado' | 'fallido' | 'pendiente' | 'programado';
  fecha_envio?: string;
  motivo_fallo?: string;
  abierto?: boolean;
  fecha_apertura?: string;
  clics?: number;
}

/**
 * Estadísticas de ejecución de un flujo
 */
export interface EjecucionFlujoStats {
  total_prospectos: number;
  total_enviados: number;
  total_fallidos: number;
  total_pendientes: number;
  email_enviados: number;
  email_fallidos: number;
  sms_enviados: number;
  sms_fallidos: number;
  porcentaje_completado: number;
}

/**
 * Ejecución/instancia de un flujo
 */
export interface EjecucionFlujo {
  id: number;
  flujo_id: number;
  flujo?: FlujoNurturing;
  estado: 'en_progreso' | 'completado' | 'fallido' | 'pausado';
  fecha_inicio: string;
  fecha_fin?: string;

  // Estadísticas
  stats: EjecucionFlujoStats;

  // Detalles de cada envío
  detalle_envios?: DetalleEnvio[];

  // Metadatos
  total_items_procesados?: number;
  user_id?: number;
  created_at: string;
  updated_at: string;
}