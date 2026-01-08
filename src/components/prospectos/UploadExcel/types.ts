/**
 * Tipos para el componente UploadExcel
 */

import { z } from 'zod'

// =============================================================================
// SCHEMA DE VALIDACION
// =============================================================================

export const uploadFormSchema = z.object({
  originName: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),
  archivo: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, 'Debes seleccionar un archivo')
    .refine(
      (files) =>
        files[0]?.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        files[0]?.type === 'application/vnd.ms-excel',
      'El archivo debe ser un Excel (.xlsx o .xls)'
    ),
})

export type UploadFormData = z.infer<typeof uploadFormSchema>

// =============================================================================
// TIPOS DE ENTIDADES
// =============================================================================

export interface LoteActivo {
  id: number
  nombre: string
  totalArchivos: number
  totalRegistros: number
  archivos: ArchivoEnLote[]
}

export interface ArchivoEnLote {
  nombre: string
  registros: number
  estado: string
}

export interface ProgresoImportacion {
  porcentaje: number
  registrosExitosos: number
  estado: 'pendiente' | 'procesando' | 'completado' | 'fallido'
}

// =============================================================================
// TIPOS DE ESTADO DEL COMPONENTE
// =============================================================================

export interface UploadState {
  // Archivos
  preview: import('@/types/prospecto').ProspectoExcelRow[]
  selectedFile: File | null
  fileSelected: boolean
  
  // Validacion
  errors: string[]
  warnings: string[]
  
  // Estado de proceso
  loading: boolean
  isUploading: boolean
  uploadSuccess: boolean
  
  // Lote
  loteActivo: LoteActivo | null
  modoAgregarArchivo: boolean
  selectedOriginName: string
  
  // Progreso de importacion
  importacionActualId: number | null
  importacionTerminada: boolean
  progresoActual: ProgresoImportacion | null
}

// =============================================================================
// PROPS DE COMPONENTES
// =============================================================================

export interface UploadExcelProps {
  onSuccess?: () => void
}

export interface LoteHeaderProps {
  lote: LoteActivo
}

export interface ArchivoListProps {
  archivos: ArchivoEnLote[]
}

export interface ProgresoCardProps {
  progreso: ProgresoImportacion
  nombreArchivo?: string
}

export interface PreviewTableProps {
  preview: import('@/types/prospecto').ProspectoExcelRow[]
  selectedOriginName: string
  errors: string[]
  onReset: () => void
  onUpload: () => void
  loading: boolean
}
