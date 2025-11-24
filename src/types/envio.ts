export type EstadoEnvio = 'pendiente' | 'enviado' | 'fallido' | 'programado';
export type TipoEnvio = 'email' | 'sms';

export interface EnvioProgramado {
  id: number;
  prospecto_id: number;
  prospecto?: {
    id: number;
    nombre: string;
    email: string;
  };
  etapa_flujo_id: number;
  etapa?: {
    id: number;
    dia_envio: number;
    flujo: {
      nombre: string;
    };
  };
  fecha_programada: string;
  estado: EstadoEnvio;
  created_at: string;
  updated_at: string;
}

export interface HistorialEnvio {
  id: number;
  prospecto_id: number;
  prospecto?: {
    id: number;
    nombre: string;
    email: string;
  };
  etapa_flujo_id: number;
  oferta_infocom_id?: number;
  oferta?: {
    id: number;
    titulo: string;
  };
  tipo_envio: TipoEnvio;
  fecha_envio: string;
  estado: EstadoEnvio;
  respuesta_api?: any;
  error_mensaje?: string;
  created_at: string;
}

export interface DashboardStats {
  total_prospectos: number;
  envios_hoy: number;
  envios_programados: number;
  ofertas_activas: number;
  tasa_entrega: number;
  prospectos_por_flujo: {
    flujo: string;
    cantidad: number;
  }[];
  envios_por_dia: {
    fecha: string;
    exitosos: number;
    fallidos: number;
  }[];
}