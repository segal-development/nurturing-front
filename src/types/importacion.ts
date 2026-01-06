/**
 * Tipos de Importaciones para el backend Laravel 12
 */

export interface Importacion {
  id: number;
  nombre_archivo: string;
  origen: string;
  total_registros: number;
  registros_exitosos: number;
  registros_fallidos: number;
  estado: 'pendiente' | 'procesando' | 'completado' | 'fallido';
  fecha_importacion: string; // "20/11/2025 09:55:37"
  user_id: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  metadata: {
    modo?: 'directo' | 'background';
    errores?: Array<{
      fila: number;
      errores: Record<string, string[]>;
    }>;
    registros_sin_email?: number;
    registros_sin_telefono?: number;
    error?: string;
    procesamiento_iniciado_en?: string;
    encolado_en?: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface ImportarResponse {
  mensaje: string;
  data: Importacion;
  procesamiento: 'directo' | 'background';
  instrucciones?: string;
  resumen?: {
    total_registros: number;
    registros_exitosos: number;
    registros_fallidos: number;
    registros_sin_email?: number;
    registros_sin_telefono?: number;
    errores: Array<{
      fila: number;
      errores: Record<string, string[]>;
    }>;
  };
}

export interface ImportacionProgreso {
  id: number;
  estado: 'pendiente' | 'procesando' | 'completado' | 'fallido';
  nombre_archivo: string;
  total_registros: number | null;
  registros_exitosos: number | null;
  registros_fallidos: number | null;
  progreso_porcentaje: number;
  metadata: {
    total_estimado?: number;
    file_size_mb?: number;
    error?: string;
    errores?: Array<{ fila: number; errores: Record<string, string[]> }>;
    registros_sin_email?: number;
    registros_sin_telefono?: number;
    procesado_con?: string;
    completado_en?: string;
    [key: string]: any;
  } | null;
  created_at: string;
  updated_at: string;
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
