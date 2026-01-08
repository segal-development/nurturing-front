/**
 * Hook para upload de archivos al backend
 * Single Responsibility: Solo lógica de upload y tracking de lote
 * 
 * NO hace polling bloqueante - el upload es fire-and-forget para archivos grandes
 */

import { useState, useCallback, useRef } from 'react';
import { importacionesService } from '@/api/importaciones.service';
import { useLoteStore } from '@/stores/loteStore';
import type { LoteInfo, ArchivoSubido, UploadResult } from './types';

// ============================================================================
// Helpers
// ============================================================================

function createArchivoSubido(nombre: string, estado: ArchivoSubido['estado'] = 'pendiente'): ArchivoSubido {
  return {
    nombre,
    registros: 0,
    estado,
    subidoEn: new Date(),
  };
}

function buildLoteInfo(response: any, archivosSubidos: ArchivoSubido[]): LoteInfo {
  return {
    id: response.lote.id,
    nombre: response.lote.nombre,
    totalArchivos: response.lote.total_archivos,
    archivosSubidos,
  };
}

// ============================================================================
// Hook
// ============================================================================

interface UseFileUploadOptions {
  onUploadComplete?: (result: UploadResult) => void;
}

interface UseFileUploadReturn {
  isUploading: boolean;
  lote: LoteInfo | null;
  uploadedFiles: Set<string>;
  upload: (file: File, originName: string, existingLoteId?: number) => Promise<UploadResult>;
  canUploadFile: (fileName: string) => boolean;
  resetLote: () => void;
  error: string | null;
}

export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [lote, setLote] = useState<LoteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Set para prevenir duplicados (persiste entre renders)
  const uploadedFilesRef = useRef<Set<string>>(new Set());
  const [uploadedFiles, setUploadedFiles] = useState<Set<string>>(new Set());
  
  // Store global para tracking de lotes en background
  const { iniciarTrackingLote } = useLoteStore();

  /**
   * Verifica si un archivo ya fue subido (prevención de duplicados)
   */
  const canUploadFile = useCallback((fileName: string): boolean => {
    return !uploadedFilesRef.current.has(fileName);
  }, []);

  /**
   * Upload principal - rápido, sin polling bloqueante
   */
  const upload = useCallback(async (
    file: File,
    originName: string,
    existingLoteId?: number
  ): Promise<UploadResult> => {
    // Early return: prevenir duplicados
    if (!canUploadFile(file.name)) {
      return {
        success: false,
        processingMode: 'direct',
        error: `El archivo "${file.name}" ya fue subido en esta sesión`,
      };
    }

    setIsUploading(true);
    setError(null);

    try {
      const response = await importacionesService.importar(
        file,
        existingLoteId ? (lote?.nombre || originName) : originName,
        existingLoteId || lote?.id
      );

      // Marcar archivo como subido
      uploadedFilesRef.current.add(file.name);
      setUploadedFiles(new Set(uploadedFilesRef.current));

      // Construir info del archivo subido
      const archivoSubido = createArchivoSubido(
        file.name,
        response.procesamiento === 'background' ? 'procesando' : 'completado'
      );
      
      if (response.resumen) {
        archivoSubido.registros = response.resumen.registros_exitosos || 0;
      }

      // Actualizar lote
      const archivosActualizados = [...(lote?.archivosSubidos || []), archivoSubido];
      const loteActualizado = response.lote 
        ? buildLoteInfo(response, archivosActualizados)
        : lote;
      
      setLote(loteActualizado);

      // Para archivos grandes en background, iniciar tracking global
      if (response.procesamiento === 'background' && response.lote) {
        iniciarTrackingLote(response.lote.id, response.lote.nombre);
      }

      const result: UploadResult = {
        success: true,
        importacionId: response.data?.id,
        lote: loteActualizado || undefined,
        processingMode: response.procesamiento || 'direct',
        registrosExitosos: response.resumen?.registros_exitosos,
        registrosFallidos: response.resumen?.registros_fallidos,
      };

      options.onUploadComplete?.(result);
      return result;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al subir el archivo';
      setError(message);
      
      return {
        success: false,
        processingMode: 'direct',
        error: message,
      };
    } finally {
      setIsUploading(false);
    }
  }, [lote, canUploadFile, iniciarTrackingLote, options]);

  /**
   * Reset completo del lote (para nueva sesión)
   */
  const resetLote = useCallback(() => {
    setLote(null);
    setError(null);
    uploadedFilesRef.current.clear();
    setUploadedFiles(new Set());
  }, []);

  return {
    isUploading,
    lote,
    uploadedFiles,
    upload,
    canUploadFile,
    resetLote,
    error,
  };
}
