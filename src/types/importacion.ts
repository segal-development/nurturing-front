/**
 * Types para el sistema de Importaciones
 * 
 * @description Define todos los tipos relacionados con importaciones de prospectos
 * desde archivos Excel. Incluye estados, progreso, metadata y respuestas de API.
 */

// =============================================================================
// TIPOS BASE REUTILIZABLES
// =============================================================================

/** Estados posibles de una importación */
export type ImportacionEstado = 'pendiente' | 'procesando' | 'completado' | 'fallido'

/** Modos de procesamiento de importación */
export type ImportacionModo = 'directo' | 'background'

/** Usuario simplificado para relaciones */
export interface UserReference {
  id: number
  name: string
  email: string
}

/** Error de validación por fila del Excel */
export interface ImportacionRowError {
  fila: number
  errores: Record<string, string[]>
}

// =============================================================================
// METADATA DE IMPORTACIÓN
// =============================================================================

/** Metadata base común a todas las importaciones */
interface ImportacionMetadataBase {
  modo?: ImportacionModo
  errores?: ImportacionRowError[]
  registros_sin_email?: number
  registros_sin_telefono?: number
}

/** Metadata para importación pendiente/procesando */
interface ImportacionMetadataProcesando extends ImportacionMetadataBase {
  encolado_en?: string
  procesamiento_iniciado_en?: string
  total_estimado?: number
  last_processed_row?: number
  checkpoint_exitosos?: number
  checkpoint_fallidos?: number
}

/** Metadata para importación completada */
interface ImportacionMetadataCompletada extends ImportacionMetadataBase {
  completado_en?: string
  procesado_con?: string
  file_size_mb?: number
}

/** Metadata para importación fallida */
interface ImportacionMetadataFallida extends ImportacionMetadataBase {
  error?: string
  ultimo_error?: string
  ultimo_error_en?: string
}

/** Metadata unificada de importación */
export type ImportacionMetadata = 
  | ImportacionMetadataProcesando 
  | ImportacionMetadataCompletada 
  | ImportacionMetadataFallida
  | null

// =============================================================================
// ENTIDAD IMPORTACIÓN
// =============================================================================

/** Contadores de registros de una importación */
export interface ImportacionContadores {
  total_registros: number
  registros_exitosos: number
  registros_fallidos: number
}

/** Entidad Importación completa */
export interface Importacion extends ImportacionContadores {
  id: number
  nombre_archivo: string
  origen: string
  estado: ImportacionEstado
  fecha_importacion: string
  user_id: number
  user?: UserReference
  metadata: ImportacionMetadata
  created_at: string
  updated_at: string
  lote_id?: number
}

// =============================================================================
// PROGRESO DE IMPORTACIÓN
// =============================================================================

/** Progreso de una importación individual (para polling) */
export interface ImportacionProgreso {
  id: number
  nombre_archivo: string
  estado: ImportacionEstado
  total_registros: number | null
  registros_exitosos: number | null
  registros_fallidos: number | null
  progreso_porcentaje: number
  metadata: ImportacionMetadata
  created_at: string
  updated_at: string
}

/** Indica si la importación está en un estado terminal */
export function isImportacionTerminada(estado: ImportacionEstado): boolean {
  return estado === 'completado' || estado === 'fallido'
}

/** Indica si la importación está activa (procesando o pendiente) */
export function isImportacionActiva(estado: ImportacionEstado): boolean {
  return estado === 'pendiente' || estado === 'procesando'
}

// =============================================================================
// RESPUESTAS DE API
// =============================================================================

/** Resumen de resultados de importación directa */
export interface ImportacionResumen {
  total_registros: number
  registros_exitosos: number
  registros_fallidos: number
  registros_sin_email?: number
  registros_sin_telefono?: number
  errores: ImportacionRowError[]
}

/** Lote incluido en respuesta de importación */
export interface ImportarResponseLote {
  id: number
  nombre: string
  estado: 'abierto' | 'procesando' | 'completado' | 'fallido'
  total_archivos: number
  total_registros: number
  registros_exitosos: number
  registros_fallidos: number
  importaciones?: Array<{
    id: number
    nombre_archivo: string
    estado: string
  }>
}

/** Respuesta al importar un archivo */
export interface ImportarResponse {
  mensaje: string
  data: Importacion
  lote?: ImportarResponseLote
  procesamiento: ImportacionModo
  instrucciones?: string
  resumen?: ImportacionResumen
}

/** Respuesta al obtener progreso */
export interface ProgresoResponse {
  data: ImportacionProgreso
}

// =============================================================================
// PAGINACIÓN
// =============================================================================

/** Metadata de paginación */
export interface PaginationMeta {
  current_page: number
  total: number
  per_page: number
  last_page: number
}

/** Respuesta paginada genérica */
export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

/** Respuesta paginada de importaciones */
export type ImportacionesPaginatedResponse = PaginatedResponse<Importacion>

// =============================================================================
// FILTROS Y QUERIES
// =============================================================================

/** Parámetros para filtrar importaciones */
export interface ImportacionFiltros {
  origen?: string
  estado?: ImportacionEstado
  fecha_desde?: string
  fecha_hasta?: string
  page?: number
  per_page?: number
}
