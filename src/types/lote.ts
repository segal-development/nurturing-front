/**
 * Types para el sistema de Lotes
 * 
 * @description Un Lote agrupa múltiples importaciones que el usuario sube
 * en una misma sesión. Permite tracking de progreso global y cierre manual.
 */

import type { UserReference, ImportacionEstado } from './importacion'

// =============================================================================
// TIPOS BASE
// =============================================================================

/** Estados posibles de un lote */
export type LoteEstado = 'abierto' | 'procesando' | 'completado' | 'fallido'

/** Indica si el lote acepta más archivos */
export function isLoteAbierto(estado: LoteEstado): boolean {
  return estado === 'abierto' || estado === 'procesando'
}

/** Indica si el lote está en un estado terminal */
export function isLoteTerminado(estado: LoteEstado): boolean {
  return estado === 'completado' || estado === 'fallido'
}

// =============================================================================
// IMPORTACIÓN DENTRO DE UN LOTE
// =============================================================================

/** Importación simplificada para listas dentro de lotes */
export interface LoteImportacion {
  id: number
  nombre_archivo: string
  estado: ImportacionEstado
  total_registros: number
  registros_exitosos: number
  registros_fallidos?: number
  total_prospectos?: number
  progreso?: number
}

/** Importación con datos de progreso (para polling) */
export interface LoteProgresoImportacion {
  id: number
  nombre_archivo: string
  estado: ImportacionEstado
  total_registros: number
  registros_exitosos: number
  registros_fallidos: number
  total_estimado: number
  progreso_porcentaje: number
  error: string | null
}

// =============================================================================
// ENTIDAD LOTE
// =============================================================================

/** Contadores de archivos de un lote */
export interface LoteContadoresArchivos {
  total_archivos: number
  archivos_completados?: number
  archivos_procesando?: number
  archivos_pendientes?: number
  archivos_fallidos?: number
}

/** Contadores de registros de un lote */
export interface LoteContadoresRegistros {
  total_registros: number
  registros_exitosos: number
  registros_fallidos: number
  total_estimado?: number
}

/** Entidad Lote completa */
export interface Lote extends LoteContadoresArchivos, LoteContadoresRegistros {
  id: number
  nombre: string
  user_id: number
  estado: LoteEstado
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  cerrado_en?: string | null
  importaciones?: LoteImportacion[]
  user?: UserReference
}

// =============================================================================
// PROGRESO DE LOTE
// =============================================================================

/** Progreso completo de un lote (para polling) */
export interface LoteProgreso {
  id: number
  nombre: string
  estado: LoteEstado
  created_at: string
  
  // Contadores de archivos
  total_archivos: number
  archivos_completados: number
  archivos_procesando: number
  archivos_pendientes: number
  archivos_fallidos: number
  
  // Contadores de registros
  total_registros: number
  registros_exitosos: number
  registros_fallidos: number
  total_estimado: number
  progreso_porcentaje: number
  
  // Detalle por importación
  importaciones: LoteProgresoImportacion[]
}

/** Calcula si el lote tiene trabajo pendiente */
export function loteTieneTrabajoPendiente(progreso: LoteProgreso): boolean {
  return progreso.archivos_procesando > 0 || progreso.archivos_pendientes > 0
}

/** Calcula el porcentaje real de progreso */
export function calcularProgresoLote(progreso: LoteProgreso): number {
  if (progreso.total_estimado <= 0) {
    return 0
  }
  
  const porcentaje = (progreso.total_registros / progreso.total_estimado) * 100
  return Math.min(Math.round(porcentaje * 10) / 10, 100)
}

// =============================================================================
// RESPUESTAS DE API
// =============================================================================

/** Respuesta al crear un lote */
export interface CrearLoteResponse {
  mensaje: string
  data: Lote
}

/** Respuesta al cerrar un lote */
export interface CerrarLoteResponse {
  mensaje: string
  data: Lote
}

/** Respuesta al obtener progreso de lote */
export interface LoteProgresoResponse {
  data: LoteProgreso
}

/** Respuesta al listar lotes */
export interface ListarLotesResponse {
  data: Lote[]
}

// =============================================================================
// LOTE PARA FILTROS
// =============================================================================

/** Lote con datos para selector de filtrado */
export interface LoteOpcionFiltrado {
  id: number
  nombre: string
  estado: LoteEstado
  total_archivos: number
  total_prospectos: number
  total_registros: number
  registros_exitosos: number
  created_at: string
  importaciones: Array<{
    id: number
    nombre_archivo: string
    estado: string
    total_prospectos: number
  }>
}

// =============================================================================
// LOTE ACTIVO (para UI de upload)
// =============================================================================

/** Archivo dentro de un lote activo en UI */
export interface LoteActivoArchivo {
  nombre: string
  registros: number
  estado: ImportacionEstado
}

/** Lote activo en la sesión de upload */
export interface LoteActivo {
  id: number
  nombre: string
  totalArchivos: number
  totalRegistros: number
  archivos: LoteActivoArchivo[]
}

/** Crea un LoteActivo desde la respuesta de la API */
export function crearLoteActivoDesdeRespuesta(
  loteResponse: {
    id: number
    nombre: string
    total_archivos: number
    total_registros: number
    importaciones?: Array<{
      nombre_archivo: string
      estado: string
      total_registros?: number
    }>
  }
): LoteActivo {
  return {
    id: loteResponse.id,
    nombre: loteResponse.nombre,
    totalArchivos: loteResponse.total_archivos,
    totalRegistros: loteResponse.total_registros,
    archivos: loteResponse.importaciones?.map(imp => ({
      nombre: imp.nombre_archivo,
      registros: imp.total_registros ?? 0,
      estado: imp.estado as ImportacionEstado,
    })) ?? [],
  }
}
