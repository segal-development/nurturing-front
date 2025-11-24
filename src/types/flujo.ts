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
  plantilla_mensaje: string;
  oferta_infocom_id?: number;
  oferta?: {
    id: number;
    titulo: string;
  };
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface FlujoNurturing {
  id: number;
  nombre: string;
  descripcion?: string;
  tipo_prospecto: string | TipoProspectoObject;
  tipo_prospecto_id?: number;
  activo: boolean;
  etapas?: EtapaFlujo[];
  user_id?: number;
  user?: {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  origen?: string;
  canal_envio?: string;
  metadata?: any;
  prospectos_en_flujo_count?: number;
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