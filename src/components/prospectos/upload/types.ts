/**
 * Tipos para el sistema de importación de prospectos
 * Single Responsibility: Solo definiciones de tipos
 */

import type { ProspectoExcelRow } from '@/types/prospecto';

// ============================================================================
// Estados del componente
// ============================================================================

export type UploadStep = 'form' | 'preview' | 'uploading' | 'success';

export type ProcessingMode = 'direct' | 'background' | 'directo';

// ============================================================================
// Validación de Excel
// ============================================================================

export interface RowValidationResult {
  isValid: boolean;
  error: string | null;
  warnings: string[];
}

export interface ExcelValidationResult {
  rows: ProspectoExcelRow[];
  errors: string[];
  warnings: string[];
  totalRows: number;
  validRows: number;
}

// ============================================================================
// Lote de importación
// ============================================================================

export interface LoteInfo {
  id: number;
  nombre: string;
  totalArchivos: number;
  archivosSubidos: ArchivoSubido[];
}

export interface ArchivoSubido {
  nombre: string;
  registros: number;
  estado: 'pendiente' | 'procesando' | 'completado' | 'fallido';
  subidoEn: Date;
}

// ============================================================================
// Upload
// ============================================================================

export interface UploadResult {
  success: boolean;
  importacionId?: number;
  lote?: LoteInfo;
  processingMode: ProcessingMode;
  registrosExitosos?: number;
  registrosFallidos?: number;
  error?: string;
}

export interface UploadState {
  step: UploadStep;
  isProcessing: boolean;
  file: File | null;
  originName: string;
  preview: ProspectoExcelRow[];
  errors: string[];
  warnings: string[];
  lote: LoteInfo | null;
  lastUploadResult: UploadResult | null;
}

// ============================================================================
// Props de componentes
// ============================================================================

export interface UploadExcelProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export interface FileDropzoneProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  hasError?: boolean;
}

export interface PreviewTableProps {
  rows: ProspectoExcelRow[];
  maxRows?: number;
}

export interface UploadSuccessProps {
  lote: LoteInfo;
  lastResult: UploadResult;
  onAddAnother: () => void;
  onFinish: () => void;
}
