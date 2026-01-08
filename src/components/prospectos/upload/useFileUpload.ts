/**
 * Hook para upload de archivos al backend
 * Single Responsibility: Solo lógica de upload y tracking de lote
 * 
 * Soporta dos modos:
 * - Archivos pequeños: procesamiento directo, retorna inmediatamente
 * - Archivos grandes: background, ESPERA a que termine antes de permitir otro
 */

import { useState, useCallback, useRef } from 'react';
import { importacionesService } from '@/api/importaciones.service';
import { useLoteStore } from '@/stores/loteStore';
import type { LoteInfo, ArchivoSubido, UploadResult } from './types';

// ============================================================================
// Tipos internos
// ============================================================================

interface ProcessingStatus {
  importacionId: number;
  fileName: string;
  progress: number;
  registrosExitosos: number;
  estado: 'pendiente' | 'procesando' | 'completado' | 'fallido';
}

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
  onProgressUpdate?: (status: ProcessingStatus) => void;
}

interface UseFileUploadReturn {
  isUploading: boolean;
  isProcessing: boolean;
  processingStatus: ProcessingStatus | null;
  lote: LoteInfo | null;
  uploadedFiles: Set<string>;
  upload: (file: File, originName: string, existingLoteId?: number) => Promise<UploadResult>;
  canUploadFile: (fileName: string) => boolean;
  resetLote: () => void;
  error: string | null;
}

export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
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
   * Espera a que una importación termine (polling optimizado)
   */
  const waitForImportacion = useCallback(async (
    importacionId: number,
    fileName: string
  ): Promise<{ success: boolean; registros: number; error?: string }> => {
    const MAX_ATTEMPTS = 400; // ~20 minutos con 3s de intervalo
    const POLL_INTERVAL = 3000;
    
    let attempts = 0;
    
    while (attempts < MAX_ATTEMPTS) {
      try {
        const progreso = await importacionesService.getProgreso(importacionId);
        
        // Actualizar estado
        const status: ProcessingStatus = {
          importacionId,
          fileName,
          progress: progreso.progreso_porcentaje,
          registrosExitosos: progreso.registros_exitosos ?? 0,
          estado: progreso.estado,
        };
        setProcessingStatus(status);
        options.onProgressUpdate?.(status);

        // Terminó?
        if (progreso.estado === 'completado') {
          return { 
            success: true, 
            registros: progreso.registros_exitosos ?? 0 
          };
        }
        
        if (progreso.estado === 'fallido') {
          return { 
            success: false, 
            registros: 0, 
            error: progreso.metadata?.error || 'Error al procesar' 
          };
        }

        // Esperar antes de siguiente poll
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
        attempts++;
        
      } catch (err) {
        // Error de red, reintentar
        attempts++;
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
      }
    }

    return { success: false, registros: 0, error: 'Timeout esperando procesamiento' };
  }, [options]);

  /**
   * Upload principal
   * - Archivos pequeños: retorna inmediatamente
   * - Archivos grandes: espera a que termine para evitar concurrencia
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

    // Early return: si ya hay uno procesando, no permitir otro
    if (isProcessing) {
      return {
        success: false,
        processingMode: 'direct',
        error: 'Esperá a que termine el archivo actual antes de subir otro',
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

      setIsUploading(false);

      // Marcar archivo como subido
      uploadedFilesRef.current.add(file.name);
      setUploadedFiles(new Set(uploadedFilesRef.current));

      // Construir info del archivo subido
      const archivoSubido = createArchivoSubido(
        file.name,
        response.procesamiento === 'background' ? 'procesando' : 'completado'
      );

      // Procesamiento en background? ESPERAR a que termine
      if (response.procesamiento === 'background') {
        setIsProcessing(true);
        setProcessingStatus({
          importacionId: response.data.id,
          fileName: file.name,
          progress: 0,
          registrosExitosos: 0,
          estado: 'pendiente',
        });

        // Iniciar tracking global (para el indicator en header)
        if (response.lote) {
          iniciarTrackingLote(response.lote.id, response.lote.nombre);
        }

        // ESPERAR a que termine
        const resultado = await waitForImportacion(response.data.id, file.name);
        
        setIsProcessing(false);
        setProcessingStatus(null);

        archivoSubido.estado = resultado.success ? 'completado' : 'fallido';
        archivoSubido.registros = resultado.registros;

        // Actualizar lote
        const archivosActualizados = [...(lote?.archivosSubidos || []), archivoSubido];
        const loteActualizado = response.lote 
          ? buildLoteInfo(response, archivosActualizados)
          : lote;
        setLote(loteActualizado);

        if (!resultado.success) {
          setError(resultado.error || 'Error al procesar');
          return {
            success: false,
            processingMode: 'background',
            error: resultado.error,
            lote: loteActualizado || undefined,
          };
        }

        return {
          success: true,
          importacionId: response.data?.id,
          lote: loteActualizado || undefined,
          processingMode: 'background',
          registrosExitosos: resultado.registros,
          registrosFallidos: 0,
        };
      }

      // Procesamiento directo - ya terminó
      if (response.resumen) {
        archivoSubido.registros = response.resumen.registros_exitosos || 0;
        archivoSubido.estado = 'completado';
      }

      const archivosActualizados = [...(lote?.archivosSubidos || []), archivoSubido];
      const loteActualizado = response.lote 
        ? buildLoteInfo(response, archivosActualizados)
        : lote;
      setLote(loteActualizado);

      return {
        success: true,
        importacionId: response.data?.id,
        lote: loteActualizado || undefined,
        processingMode: response.procesamiento || 'direct',
        registrosExitosos: response.resumen?.registros_exitosos,
        registrosFallidos: response.resumen?.registros_fallidos,
      };

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al subir el archivo';
      setError(message);
      setIsUploading(false);
      setIsProcessing(false);
      setProcessingStatus(null);
      
      return {
        success: false,
        processingMode: 'direct',
        error: message,
      };
    }
  }, [lote, canUploadFile, isProcessing, iniciarTrackingLote, waitForImportacion]);

  /**
   * Reset completo del lote (para nueva sesión)
   */
  const resetLote = useCallback(() => {
    setLote(null);
    setError(null);
    setIsProcessing(false);
    setProcessingStatus(null);
    uploadedFilesRef.current.clear();
    setUploadedFiles(new Set());
  }, []);

  return {
    isUploading,
    isProcessing,
    processingStatus,
    lote,
    uploadedFiles,
    upload,
    canUploadFile,
    resetLote,
    error,
  };
}
