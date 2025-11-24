/**
 * Tipos de Prospectos para el backend Laravel 12
 */

export type EstadoProspecto = 'activo' | 'inactivo' | 'convertido';

export interface TipoProspectoBackend {
  id: number;
  nombre: 'Deuda Baja' | 'Deuda Media' | 'Deuda Alta';
  descripcion: string;
  monto_min: number;
  monto_max: number | null;
  orden: number;
  activo: boolean;
}

export interface Prospecto {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  tipo_prospecto_id: number;
  tipo_prospecto?: {
    id: number;
    nombre: string;
  };
  estado: EstadoProspecto;
  monto_deuda: number;
  fecha_ultimo_contacto: string | null; // "20/11/2025 09:55:37"
  origen: string | null;
  importacion_id: number | null;
  importacion?: {
    id: number;
    origen: string;
    fecha_importacion: string;
  };
  metadata: Record<string, any> | null;
  created_at: string; // "20/11/2025 09:55:37"
  updated_at: string; // "20/11/2025 09:55:37"
}

export interface ProspectoFormData {
  nombre: string;
  email: string;
  telefono?: string;
  tipo_prospecto_id?: number;
  estado?: EstadoProspecto;
  monto_deuda?: number;
  fecha_ultimo_contacto?: string;
  metadata?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    total: number;
    per_page: number;
    last_page: number;
  };
}

export interface ProspectoEstadisticas {
  total_prospectos: number;
  por_estado: {
    activo?: number;
    inactivo?: number;
    convertido?: number;
  };
  por_tipo: Array<{
    nombre: string;
    total: number;
  }>;
  monto_total_deuda: number;
}

export interface ProspectoExcelRow {
  nombre: string;
  rut: string;
  email: string;
  telefono: string;
  monto_deuda: string | number;
  url_informe?: string;
}