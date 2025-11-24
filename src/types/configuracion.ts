/**
 * Tipos para configuraciones del sistema
 */

/**
 * Configuración de precios de envío
 */
export interface ConfiguracionPrecio {
  email_costo: number;
  sms_costo: number;
}

/**
 * Configuración de límites y restricciones
 */
export interface ConfiguracionLimites {
  max_prospectos_por_flujo?: number;
  max_emails_por_dia?: number;
  max_sms_por_dia?: number;
  reintentos_envio?: number;
}

/**
 * Configuración de notificaciones
 */
export interface ConfiguracionNotificaciones {
  notificar_flujo_completado?: boolean;
  notificar_errores_envio?: boolean;
  email_notificaciones?: string;
}

/**
 * Configuración completa del sistema
 */
export interface Configuracion {
  id: number;
  // Precios
  email_costo: number;
  sms_costo: number;
  // Límites
  max_prospectos_por_flujo?: number;
  max_emails_por_dia?: number;
  max_sms_por_dia?: number;
  reintentos_envio?: number;
  // Notificaciones
  notificar_flujo_completado?: boolean;
  notificar_errores_envio?: boolean;
  email_notificaciones?: string;
  // Metadata
  created_at: string;
  updated_at: string;
}

/**
 * Datos para actualizar configuración
 */
export interface ActualizarConfiguracionPayload {
  email_costo?: number;
  sms_costo?: number;
  max_prospectos_por_flujo?: number;
  max_emails_por_dia?: number;
  max_sms_por_dia?: number;
  reintentos_envio?: number;
  notificar_flujo_completado?: boolean;
  notificar_errores_envio?: boolean;
  email_notificaciones?: string;
}
