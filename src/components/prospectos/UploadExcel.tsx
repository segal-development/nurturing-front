/**
 * UploadExcel - Componente para importar prospectos desde Excel
 * 
 * Principios aplicados:
 * - Single Responsibility: UI separada de lógica (hooks)
 * - Early returns: Renderizado condicional limpio
 * - Funciones pequeñas: Componentes internos extraídos
 * - Tipos estrictos: Todo tipado
 * - Manejo de errores: Try/catch con mensajes claros
 */

import { useState, useRef, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Upload, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  Loader, 
  Plus, 
  FolderOpen,
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useExcelValidation } from './upload/useExcelValidation';
import { useFileUpload } from './upload/useFileUpload';
import type { UploadExcelProps, UploadStep, LoteInfo } from './upload/types';
import type { ProspectoExcelRow } from '@/types/prospecto';

// ============================================================================
// Schema de validación del form
// ============================================================================

const formSchema = z.object({
  originName: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(100, 'Máximo 100 caracteres'),
});

type FormData = z.infer<typeof formSchema>;

// ============================================================================
// Componentes internos (pequeños, una responsabilidad)
// ============================================================================

interface InstructionsProps {
  isAddingToLote: boolean;
  loteName?: string;
}

function Instructions({ isAddingToLote, loteName }: InstructionsProps) {
  return (
    <div className="bg-segal-blue/10 border border-segal-blue/20 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <FileSpreadsheet className="h-5 w-5 text-segal-blue shrink-0 mt-0.5" />
        <div>
          {isAddingToLote && loteName ? (
            <div className="mb-3 flex items-center gap-2 text-segal-blue">
              <FolderOpen className="h-4 w-4" />
              <span className="font-semibold">Agregando a: {loteName}</span>
            </div>
          ) : null}
          <p className="font-semibold text-segal-dark mb-2">Formato del Excel:</p>
          <ul className="list-disc list-inside text-sm space-y-1 text-segal-dark/80">
            <li><strong>A:</strong> Nombre</li>
            <li><strong>B:</strong> RUT</li>
            <li><strong>C:</strong> Email</li>
            <li><strong>D:</strong> Teléfono</li>
            <li><strong>E:</strong> Monto Deuda</li>
            <li><strong>F:</strong> URL Informe (opcional)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

interface FileDropzoneProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  hasError?: boolean;
  isDuplicate?: boolean;
}

function FileDropzone({ file, onFileSelect, disabled, hasError, isDuplicate }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  const borderColor = isDuplicate
    ? 'border-orange-400 bg-orange-50'
    : file
    ? 'border-segal-green/40 bg-segal-green/5 hover:bg-segal-green/10'
    : hasError
    ? 'border-segal-red/40 bg-segal-red/5'
    : 'border-segal-blue/40 bg-segal-blue/5 hover:bg-segal-blue/10';

  return (
    <label
      htmlFor="archivo"
      className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${borderColor}`}
    >
      <div className="flex flex-col items-center justify-center py-4">
        {file ? (
          <>
            {isDuplicate ? (
              <AlertCircle className="w-10 h-10 mb-3 text-orange-500" />
            ) : (
              <CheckCircle2 className="w-10 h-10 mb-3 text-segal-green" />
            )}
            <p className="text-sm font-medium text-segal-dark">{file.name}</p>
            <p className="text-xs text-segal-dark/60 mt-1">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            {isDuplicate && (
              <p className="text-xs text-orange-600 mt-2 font-medium">
                Este archivo ya fue subido
              </p>
            )}
            <p className="text-xs text-segal-blue mt-2 underline">Click para cambiar</p>
          </>
        ) : (
          <>
            <Upload className={`w-10 h-10 mb-3 ${hasError ? 'text-segal-red' : 'text-segal-blue'}`} />
            <p className="text-sm text-segal-dark">
              <span className="font-semibold">Click para subir</span> o arrastra aquí
            </p>
            <p className="text-xs text-segal-dark/60 mt-1">.xlsx, .xls</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        id="archivo"
        type="file"
        className="hidden"
        accept=".xlsx,.xls"
        onChange={handleChange}
        disabled={disabled}
      />
    </label>
  );
}

interface ErrorListProps {
  errors: string[];
  title?: string;
  type?: 'error' | 'warning';
}

function ErrorList({ errors, title, type = 'error' }: ErrorListProps) {
  if (errors.length === 0) return null;

  const isWarning = type === 'warning';
  const bgColor = isWarning ? 'bg-yellow-50 border-yellow-300' : 'bg-segal-red/10 border-segal-red/30';
  const textColor = isWarning ? 'text-yellow-700' : 'text-segal-red';
  const iconColor = isWarning ? 'text-yellow-600' : 'text-segal-red';

  return (
    <div className={`${bgColor} border rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <AlertCircle className={`h-5 w-5 ${iconColor} shrink-0 mt-0.5`} />
        <div className="flex-1">
          <p className={`font-semibold ${textColor} mb-2`}>
            {title || `${errors.length} ${type === 'warning' ? 'advertencia' : 'error'}${errors.length !== 1 ? 's' : ''}`}
          </p>
          <ul className={`list-disc pl-5 space-y-1 max-h-32 overflow-y-auto text-sm ${textColor}`}>
            {errors.slice(0, 10).map((error, i) => (
              <li key={i}>{error}</li>
            ))}
            {errors.length > 10 && (
              <li className="font-medium">...y {errors.length - 10} más</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

interface PreviewTableProps {
  rows: ProspectoExcelRow[];
  originName: string;
  errorCount: number;
}

function PreviewTable({ rows, originName, errorCount }: PreviewTableProps) {
  const displayRows = rows.slice(0, 10);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-segal-dark">Vista Previa</h3>
          <p className="text-sm text-segal-dark/70">
            <span className="text-segal-green font-medium">{rows.length} válidos</span>
            {errorCount > 0 && (
              <span className="text-segal-red ml-2">• {errorCount} errores</span>
            )}
          </p>
        </div>
        <span className="text-sm text-segal-blue font-medium">{originName}</span>
      </div>

      <div className="border border-segal-blue/10 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-segal-blue/5">
              <TableHead className="w-12 font-bold">#</TableHead>
              <TableHead className="font-bold">Nombre</TableHead>
              <TableHead className="font-bold">RUT</TableHead>
              <TableHead className="font-bold">Email</TableHead>
              <TableHead className="font-bold">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayRows.map((row, i) => (
              <TableRow key={i} className="hover:bg-segal-blue/5">
                <TableCell className="font-medium">{i + 1}</TableCell>
                <TableCell>{row.nombre}</TableCell>
                <TableCell className="text-segal-blue font-medium">{row.rut}</TableCell>
                <TableCell className="text-sm">{row.email}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 rounded text-xs bg-segal-blue/10 text-segal-blue">
                    ${parseInt(String(row.monto_deuda || '0')).toLocaleString('es-CL')}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {rows.length > 10 && (
          <div className="p-2 text-center text-sm text-segal-dark/60 border-t bg-segal-blue/5">
            Mostrando 10 de {rows.length}
          </div>
        )}
      </div>
    </div>
  );
}

interface SuccessViewProps {
  lote: LoteInfo;
  lastUpload: { fileName: string; registros: number };
  onAddAnother: () => void;
  onFinish: () => void;
}

function SuccessView({ lote, lastUpload, onAddAnother, onFinish }: SuccessViewProps) {
  return (
    <div className="space-y-4">
      {/* Header del lote */}
      <div className="bg-gradient-to-r from-segal-blue/10 to-segal-turquoise/10 border border-segal-blue/20 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <FolderOpen className="h-6 w-6 text-segal-blue" />
          <div>
            <p className="font-bold text-segal-dark">{lote.nombre}</p>
            <p className="text-sm text-segal-dark/60">
              {lote.totalArchivos} archivo{lote.totalArchivos !== 1 ? 's' : ''} subido{lote.totalArchivos !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de archivos */}
      {lote.archivosSubidos.length > 0 && (
        <div className="bg-white border border-segal-blue/10 rounded-lg p-4">
          <p className="text-sm font-semibold text-segal-dark mb-3">Archivos en este lote:</p>
          <div className="space-y-2">
            {lote.archivosSubidos.map((archivo, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 px-3 bg-segal-blue/5 rounded">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-segal-blue" />
                  <span className="text-sm">{archivo.nombre}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  archivo.estado === 'completado' 
                    ? 'bg-segal-green/20 text-segal-green' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {archivo.estado === 'completado' ? '✓ Listo' : '⏳ Procesando'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Último archivo */}
      <div className="bg-segal-green/10 border border-segal-green/30 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-segal-green" />
          <div>
            <p className="font-semibold text-segal-green">¡Archivo subido!</p>
            <p className="text-sm text-segal-green/80">
              "{lastUpload.fileName}" - {lastUpload.registros.toLocaleString('es-CL')} registros
            </p>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex justify-between items-center pt-2">
        <p className="text-sm text-segal-dark/60">¿Agregar más archivos?</p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onAddAnother}
            className="border-segal-blue text-segal-blue"
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar otro
          </Button>
          <Button
            onClick={onFinish}
            className="bg-segal-green hover:bg-segal-green/90 text-white"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Finalizar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Componente principal
// ============================================================================

export function UploadExcel({ onSuccess }: UploadExcelProps) {
  // Estado del flujo
  const [step, setStep] = useState<UploadStep>('form');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAddingToLote, setIsAddingToLote] = useState(false);
  const [lastUploadInfo, setLastUploadInfo] = useState<{ fileName: string; registros: number } | null>(null);

  // Hooks de lógica
  const { 
    isValidating, 
    validationResult, 
    validateFile, 
    clearValidation,
    error: validationError 
  } = useExcelValidation();
  
  const { 
    lote, 
    upload, 
    canUploadFile, 
    resetLote,
    error: uploadError 
  } = useFileUpload();

  // Form
  const { control, handleSubmit, formState: { errors: formErrors }, reset: resetForm, getValues } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { originName: '' },
  });

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
  }, []);

  const handleValidateAndPreview = useCallback(async (_data: FormData) => {
    if (!selectedFile) {
      toast.error('Selecciona un archivo');
      return;
    }

    try {
      await validateFile(selectedFile);
      setStep('preview');
    } catch {
      toast.error('Error al procesar el archivo');
    }
  }, [selectedFile, validateFile]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !validationResult) return;

    const originName = getValues('originName');
    
    // Verificar duplicado
    if (!canUploadFile(selectedFile.name)) {
      toast.error(`"${selectedFile.name}" ya fue subido`);
      return;
    }

    setStep('uploading');

    const result = await upload(selectedFile, originName);

    if (result.success) {
      setLastUploadInfo({
        fileName: selectedFile.name,
        registros: result.registrosExitosos || validationResult.validRows,
      });
      setStep('success');
      
      if (result.processingMode === 'background') {
        toast.info('Procesando en segundo plano', {
          description: 'Puedes agregar más archivos mientras se procesa.',
        });
      } else {
        toast.success('Importación completada');
      }
    } else {
      setStep('preview');
      toast.error(result.error || 'Error al subir');
    }
  }, [selectedFile, validationResult, getValues, canUploadFile, upload]);

  const handleAddAnother = useCallback(() => {
    setSelectedFile(null);
    clearValidation();
    setStep('form');
    setIsAddingToLote(true);
    // NO resetear el form para mantener el nombre del lote
  }, [clearValidation]);

  const handleFinish = useCallback(() => {
    toast.success('Carga finalizada', {
      description: `${lote?.totalArchivos || 1} archivo(s) subidos`,
    });
    resetLote();
    resetForm();
    setSelectedFile(null);
    clearValidation();
    setStep('form');
    setIsAddingToLote(false);
    setLastUploadInfo(null);
    onSuccess?.();
  }, [lote, resetLote, resetForm, clearValidation, onSuccess]);

  const handleCancel = useCallback(() => {
    setSelectedFile(null);
    clearValidation();
    setStep('form');
    if (!isAddingToLote) {
      resetForm();
    }
  }, [clearValidation, resetForm, isAddingToLote]);

  // ============================================================================
  // Render helpers
  // ============================================================================

  const isDuplicate = selectedFile ? !canUploadFile(selectedFile.name) : false;
  const allErrors = [
    ...(validationResult?.errors || []),
    ...(validationError ? [validationError] : []),
    ...(uploadError ? [uploadError] : []),
  ];

  // ============================================================================
  // Render por paso
  // ============================================================================

  // Success step
  if (step === 'success' && lote && lastUploadInfo) {
    return (
      <div className="space-y-4">
        <Instructions isAddingToLote={false} />
        <SuccessView
          lote={lote}
          lastUpload={lastUploadInfo}
          onAddAnother={handleAddAnother}
          onFinish={handleFinish}
        />
      </div>
    );
  }

  // Uploading step
  if (step === 'uploading') {
    return (
      <div className="space-y-4">
        <Instructions isAddingToLote={isAddingToLote} loteName={lote?.nombre} />
        <div className="bg-gradient-to-br from-segal-blue/5 to-segal-turquoise/5 rounded-xl border border-segal-blue/20 p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader className="h-12 w-12 text-segal-blue animate-spin" />
            <div className="text-center">
              <p className="font-bold text-lg text-segal-dark">Subiendo archivo...</p>
              <p className="text-sm text-segal-dark/60 mt-1">{selectedFile?.name}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Preview step
  if (step === 'preview' && validationResult) {
    return (
      <div className="space-y-4">
        <Instructions isAddingToLote={isAddingToLote} loteName={lote?.nombre} />
        
        <ErrorList errors={validationResult.errors} type="error" />
        <ErrorList errors={validationResult.warnings} type="warning" />
        
        <PreviewTable
          rows={validationResult.rows}
          originName={getValues('originName')}
          errorCount={validationResult.errors.length}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={handleCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={validationResult.rows.length === 0}
            className="bg-segal-blue hover:bg-segal-blue/90 text-white"
          >
            <Upload className="mr-2 h-4 w-4" />
            Importar {validationResult.rows.length.toLocaleString('es-CL')} registros
          </Button>
        </div>
      </div>
    );
  }

  // Form step (default)
  return (
    <div className="space-y-4">
      <Instructions isAddingToLote={isAddingToLote} loteName={lote?.nombre} />

      <form onSubmit={handleSubmit(handleValidateAndPreview)} className="space-y-4">
        {/* Nombre de origen - solo si no estamos agregando a un lote existente */}
        {!isAddingToLote && (
          <div className="space-y-2">
            <Label htmlFor="originName" className="font-semibold text-segal-dark">
              Nombre de la Carga <span className="text-segal-red">*</span>
            </Label>
            <Controller
              name="originName"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="originName"
                  placeholder="Ej: Carga Enero 2025"
                  className={`bg-white border ${formErrors.originName ? 'border-segal-red' : 'border-segal-blue/30'}`}
                />
              )}
            />
            {formErrors.originName && (
              <p className="text-sm text-segal-red">{formErrors.originName.message}</p>
            )}
          </div>
        )}

        {/* Dropzone */}
        <div className="space-y-2">
          <Label className="font-semibold text-segal-dark">
            Archivo Excel <span className="text-segal-red">*</span>
          </Label>
          <FileDropzone
            file={selectedFile}
            onFileSelect={handleFileSelect}
            disabled={isValidating}
            isDuplicate={isDuplicate}
          />
        </div>

        {/* Errores */}
        <ErrorList errors={allErrors} />

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-2">
          {isAddingToLote && (
            <Button type="button" variant="outline" onClick={handleFinish}>
              Finalizar sin agregar más
            </Button>
          )}
          <Button
            type="submit"
            disabled={!selectedFile || isValidating || isDuplicate || (formErrors.originName && !isAddingToLote)}
            className="bg-segal-blue hover:bg-segal-blue/90 text-white"
          >
            {isValidating ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Validando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Cargar y Validar
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
