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
  estado: 'procesando' | 'completado' | 'fallido';
  fecha_importacion: string; // "20/11/2025 09:55:37"
  user_id: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  metadata: {
    errores?: Array<{
      fila: number;
      errores: Record<string, string[]>;
    }>;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface ImportarResponse {
  mensaje: string;
  data: Importacion;
  resumen: {
    total_registros: number;
    registros_exitosos: number;
    registros_fallidos: number;
    errores: Array<{
      fila: number;
      errores: Record<string, string[]>;
    }>;
  };
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
