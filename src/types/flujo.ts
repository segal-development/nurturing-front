export type TipoMensaje = 'email' | 'sms' | 'ambos';

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
 */
export interface ConfigVisual {
  nodes: any[]; // ReactFlow Node[]
  edges: any[]; // ReactFlow Edge[]
}

/**
 * Configuración estructural del flujo (para ejecución)
 */
export interface ConfigStructure {
  stages: EtapaFlujo[];
  conditions: CondicionFlujo[];
  branches: RamificacionFlujo[];
  initial_node: any;
  end_nodes: NodoFinalFlujo[];
}

/**
 * Prospecto en un flujo (relación)
 */
export interface ProspectoEnFlujo {
  id: number;
  flujo_id: number;
  prospecto_id: number;
  prospecto?: any;
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
  metadata?: any;

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