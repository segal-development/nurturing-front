/**
 * Tipos para Lotes (agrupación de importaciones)
 */

export interface LoteImportacion {
  id: number
  nombre_archivo: string
  estado: 'pendiente' | 'procesando' | 'completado' | 'fallido'
  total_registros: number
  registros_exitosos: number
  total_prospectos?: number
  progreso?: number
}

export interface Lote {
  id: number
  nombre: string
  user_id: number
  total_archivos: number
  total_registros: number
  registros_exitosos: number
  registros_fallidos: number
  estado: 'abierto' | 'procesando' | 'completado' | 'fallido'
  metadata: Record<string, any> | null
  created_at: string
  updated_at: string
  importaciones?: LoteImportacion[]
  user?: {
    id: number
    name: string
    email: string
  }
}

export interface LoteProgreso {
  id: number
  nombre: string
  estado: 'abierto' | 'procesando' | 'completado' | 'fallido'
  total_archivos: number
  total_registros: number
  registros_exitosos: number
  registros_fallidos: number
  importaciones: Array<{
    id: number
    nombre_archivo: string
    estado: string
    total_registros: number
    registros_exitosos: number
    progreso: number
  }>
}

export interface CrearLoteResponse {
  mensaje: string
  data: Lote
}

export interface ImportarConLoteResponse {
  mensaje: string
  data: any // Importacion
  lote: Lote
  procesamiento: 'directo' | 'background'
  instrucciones?: string
  resumen?: {
    total_registros: number
    registros_exitosos: number
    registros_fallidos: number
  }
}

// Para el selector de opciones de filtrado
export interface LoteOpcionFiltrado {
  id: number
  nombre: string
  estado: 'abierto' | 'procesando' | 'completado' | 'fallido'
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
